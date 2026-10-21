"""LedgerLeaf AI — Authentication API routes."""
from __future__ import annotations

import re
from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, DB
from app.core.database import get_db
from app.core.security import create_internal_token, generate_invitation_token, generate_uuid
from app.models.models import (
    Invitation,
    InvitationStatus,
    OrgMembership,
    OrgRole,
    Organization,
    User,
)
from app.schemas.schemas import (
    AuthResponse,
    InvitationCreate,
    InvitationResponse,
    LoginRequest,
    OrgCreate,
    OrgMemberResponse,
    OrgResponse,
    RegisterRequest,
    UserResponse,
    UserUpdate,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


def _slugify(name: str) -> str:
    slug = re.sub(r"[^\w\s-]", "", name.lower().strip())
    slug = re.sub(r"[\s_]+", "-", slug)
    return slug[:200]


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(data: RegisterRequest, db: DB):
    """Register a new user account."""
    # Check existing
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        id=generate_uuid(),
        email=data.email,
        full_name=data.full_name,
        password_hash=_hash_password(data.password),
    )
    db.add(user)
    await db.flush()

    token = create_internal_token(user.id)
    return AuthResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=AuthResponse)
async def login(data: LoginRequest, db: DB):
    """Login with email and password."""
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not user.password_hash or not _verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")

    token = create_internal_token(user.id)
    return AuthResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
async def get_profile(user: CurrentUser):
    """Get current user profile."""
    return UserResponse.model_validate(user)


@router.patch("/me", response_model=UserResponse)
async def update_profile(data: UserUpdate, user: CurrentUser, db: DB):
    """Update current user profile."""
    if data.full_name is not None:
        user.full_name = data.full_name
    if data.avatar_url is not None:
        user.avatar_url = data.avatar_url
    await db.flush()
    return UserResponse.model_validate(user)


@router.get("/organizations", response_model=list[OrgResponse])
async def list_organizations(user: CurrentUser, db: DB):
    """List organizations the current user belongs to."""
    result = await db.execute(
        select(Organization)
        .join(OrgMembership, OrgMembership.org_id == Organization.id)
        .where(OrgMembership.user_id == user.id, OrgMembership.is_active == True)
    )
    orgs = result.scalars().all()
    return [OrgResponse.model_validate(o) for o in orgs]


@router.post("/organizations", response_model=OrgResponse, status_code=status.HTTP_201_CREATED)
async def create_organization(data: OrgCreate, user: CurrentUser, db: DB):
    """Create a new organization and add the user as owner."""
    base_slug = _slugify(data.name)
    slug = base_slug

    # Ensure unique slug
    counter = 1
    while True:
        result = await db.execute(select(Organization).where(Organization.slug == slug))
        if not result.scalar_one_or_none():
            break
        slug = f"{base_slug}-{counter}"
        counter += 1

    org = Organization(
        id=generate_uuid(),
        name=data.name,
        slug=slug,
        country=data.country,
        currency=data.currency,
        timezone=data.timezone,
    )
    db.add(org)
    await db.flush()

    membership = OrgMembership(
        id=generate_uuid(),
        user_id=user.id,
        org_id=org.id,
        role=OrgRole.OWNER,
    )
    db.add(membership)

    # Create default categories
    from app.models.models import Category
    default_categories = [
        ("Software & Tools", "#4F46E5"),
        ("Office Supplies", "#059669"),
        ("Travel", "#D97706"),
        ("Meals & Entertainment", "#DC2626"),
        ("Professional Services", "#7C3AED"),
        ("Marketing", "#2563EB"),
        ("Utilities", "#6B7280"),
        ("Miscellaneous", "#9CA3AF"),
    ]
    for name, color in default_categories:
        cat = Category(id=generate_uuid(), org_id=org.id, name=name, color=color)
        db.add(cat)

    await db.flush()
    return OrgResponse.model_validate(org)


@router.get("/organizations/{org_id}/members", response_model=list[OrgMemberResponse])
async def list_org_members(org_id: str, user: CurrentUser, db: DB):
    """List members of an organization."""
    # Verify membership
    result = await db.execute(
        select(OrgMembership).where(
            OrgMembership.user_id == user.id,
            OrgMembership.org_id == org_id,
            OrgMembership.is_active == True,
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member")

    result = await db.execute(
        select(OrgMembership)
        .where(OrgMembership.org_id == org_id, OrgMembership.is_active == True)
    )
    members = result.scalars().all()

    # Eagerly load user info
    response = []
    for m in members:
        user_result = await db.execute(select(User).where(User.id == m.user_id))
        u = user_result.scalar_one_or_none()
        response.append(OrgMemberResponse(
            id=m.id,
            user_id=m.user_id,
            org_id=m.org_id,
            role=m.role.value,
            is_active=m.is_active,
            user=UserResponse.model_validate(u) if u else None,
        ))
    return response


@router.post("/organizations/{org_id}/invitations", response_model=InvitationResponse, status_code=status.HTTP_201_CREATED)
async def create_invitation(org_id: str, data: InvitationCreate, user: CurrentUser, db: DB):
    """Invite a user to the organization."""
    # Verify caller is owner or finance_manager
    result = await db.execute(
        select(OrgMembership).where(
            OrgMembership.user_id == user.id,
            OrgMembership.org_id == org_id,
            OrgMembership.is_active == True,
        )
    )
    membership = result.scalar_one_or_none()
    if not membership or membership.role not in (OrgRole.OWNER, OrgRole.FINANCE_MANAGER):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")

    try:
        role = OrgRole(data.role)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid role: {data.role}")

    invitation = Invitation(
        id=generate_uuid(),
        org_id=org_id,
        email=data.email,
        role=role,
        token=generate_invitation_token(),
        invited_by=user.id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db.add(invitation)
    await db.flush()

    return InvitationResponse(
        id=invitation.id,
        org_id=invitation.org_id,
        email=invitation.email,
        role=invitation.role.value,
        status=invitation.status.value,
        expires_at=invitation.expires_at,
        created_at=invitation.created_at,
        updated_at=invitation.updated_at,
    )


@router.post("/invitations/{token}/accept", response_model=OrgMemberResponse)
async def accept_invitation(token: str, user: CurrentUser, db: DB):
    """Accept an organization invitation."""
    result = await db.execute(
        select(Invitation).where(
            Invitation.token == token,
            Invitation.status == InvitationStatus.PENDING,
        )
    )
    invitation = result.scalar_one_or_none()
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found or already used")

    if invitation.expires_at < datetime.now(timezone.utc):
        invitation.status = InvitationStatus.EXPIRED
        await db.flush()
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Invitation has expired")

    if invitation.email != user.email:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invitation is for a different email")

    # Check if already a member
    result = await db.execute(
        select(OrgMembership).where(
            OrgMembership.user_id == user.id,
            OrgMembership.org_id == invitation.org_id,
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        existing.is_active = True
        existing.role = invitation.role
        membership = existing
    else:
        membership = OrgMembership(
            id=generate_uuid(),
            user_id=user.id,
            org_id=invitation.org_id,
            role=invitation.role,
        )
        db.add(membership)

    invitation.status = InvitationStatus.ACCEPTED
    await db.flush()

    return OrgMemberResponse(
        id=membership.id,
        user_id=membership.user_id,
        org_id=membership.org_id,
        role=membership.role.value,
        is_active=membership.is_active,
    )
