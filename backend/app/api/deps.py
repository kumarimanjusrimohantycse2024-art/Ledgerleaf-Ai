"""LedgerLeaf AI — Dependency injection for FastAPI routes."""
from __future__ import annotations

from typing import Annotated

from fastapi import Depends, Header, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import decode_internal_token, decode_supabase_jwt
from app.models.models import OrgMembership, OrgRole, Organization, User

settings = get_settings()


async def get_current_user(
    request: Request,
    authorization: str | None = Header(None),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Extract and verify the current user from the Authorization header."""
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authorization header")

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authorization scheme")

    # Try Supabase JWT first, then internal token
    payload = None
    if settings.supabase_jwt_secret:
        payload = decode_supabase_jwt(token)

    if payload is None:
        payload = decode_internal_token(token)

    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    result = await db.execute(select(User).where(User.id == user_id, User.is_active == True))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")

    return user


async def get_current_org(
    request: Request,
    x_org_id: str | None = Header(None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Organization:
    """Resolve the current organization from the X-Org-Id header and verify membership."""
    if not x_org_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing X-Org-Id header")

    result = await db.execute(
        select(Organization).where(Organization.id == x_org_id)
    )
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

    # Verify membership
    result = await db.execute(
        select(OrgMembership).where(
            OrgMembership.user_id == user.id,
            OrgMembership.org_id == org.id,
            OrgMembership.is_active == True,
        )
    )
    membership = result.scalar_one_or_none()
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this organization")

    # Store membership on request for role checks
    request.state.membership = membership
    request.state.user = user
    request.state.org = org

    return org


def require_role(*allowed_roles: OrgRole):
    """Dependency factory: checks that the user has one of the allowed roles."""

    async def checker(request: Request) -> OrgMembership:
        membership: OrgMembership | None = getattr(request.state, "membership", None)
        if not membership:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Organization context required")
        if membership.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of: {[r.value for r in allowed_roles]}",
            )
        return membership

    return checker


# Annotated dependencies for cleaner signatures
CurrentUser = Annotated[User, Depends(get_current_user)]
CurrentOrg = Annotated[Organization, Depends(get_current_org)]
DB = Annotated[AsyncSession, Depends(get_db)]
