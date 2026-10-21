"""LedgerLeaf AI — Clients API routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentOrg, CurrentUser, DB, require_role
from app.core.security import generate_uuid
from app.models.models import AuditEvent, Client, OrgRole
from app.schemas.schemas import ClientCreate, ClientResponse, ClientUpdate, PaginatedResponse

router = APIRouter(prefix="/clients", tags=["Clients"])


@router.get("", response_model=PaginatedResponse)
async def list_clients(
    request: Request,
    org: CurrentOrg,
    db: DB,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    is_active: bool | None = None,
):
    """List clients for the current organization."""
    query = select(Client).where(Client.org_id == org.id)

    if search:
        query = query.where(
            Client.name.ilike(f"%{search}%") | Client.email.ilike(f"%{search}%") | Client.company.ilike(f"%{search}%")
        )
    if is_active is not None:
        query = query.where(Client.is_active == is_active)

    # Count
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    # Paginate
    query = query.order_by(Client.name).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    clients = result.scalars().all()

    return PaginatedResponse(
        items=[ClientResponse.model_validate(c) for c in clients],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size if total > 0 else 0,
    )


@router.post("", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(
    data: ClientCreate,
    request: Request,
    org: CurrentOrg,
    user: CurrentUser,
    db: DB,
    _role: None = Depends(require_role(OrgRole.OWNER, OrgRole.FINANCE_MANAGER, OrgRole.TEAM_MEMBER)),
):
    """Create a new client."""
    client = Client(
        id=generate_uuid(),
        org_id=org.id,
        **data.model_dump(),
    )
    db.add(client)

    # Audit
    audit = AuditEvent(
        id=generate_uuid(),
        org_id=org.id,
        user_id=user.id,
        action="client.created",
        resource_type="client",
        resource_id=client.id,
    )
    db.add(audit)
    await db.flush()

    return ClientResponse.model_validate(client)


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(client_id: str, request: Request, org: CurrentOrg, db: DB):
    """Get a client by ID."""
    result = await db.execute(
        select(Client).where(Client.id == client_id, Client.org_id == org.id)
    )
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    return ClientResponse.model_validate(client)


@router.patch("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: str,
    data: ClientUpdate,
    request: Request,
    org: CurrentOrg,
    user: CurrentUser,
    db: DB,
    _role: None = Depends(require_role(OrgRole.OWNER, OrgRole.FINANCE_MANAGER)),
):
    """Update a client."""
    result = await db.execute(
        select(Client).where(Client.id == client_id, Client.org_id == org.id)
    )
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(client, field, value)

    audit = AuditEvent(
        id=generate_uuid(),
        org_id=org.id,
        user_id=user.id,
        action="client.updated",
        resource_type="client",
        resource_id=client.id,
        details=str(update_data),
    )
    db.add(audit)
    await db.flush()

    return ClientResponse.model_validate(client)


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_client(
    client_id: str,
    request: Request,
    org: CurrentOrg,
    user: CurrentUser,
    db: DB,
    _role: None = Depends(require_role(OrgRole.OWNER, OrgRole.FINANCE_MANAGER)),
):
    """Deactivate a client (soft delete)."""
    result = await db.execute(
        select(Client).where(Client.id == client_id, Client.org_id == org.id)
    )
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

    client.is_active = False

    audit = AuditEvent(
        id=generate_uuid(),
        org_id=org.id,
        user_id=user.id,
        action="client.deactivated",
        resource_type="client",
        resource_id=client.id,
    )
    db.add(audit)
    await db.flush()
