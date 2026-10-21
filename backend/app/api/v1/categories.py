"""LedgerLeaf AI — Categories API routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select

from app.api.deps import CurrentOrg, CurrentUser, DB, require_role
from app.core.security import generate_uuid
from app.models.models import Category, OrgRole
from app.schemas.schemas import CategoryCreate, CategoryResponse

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("", response_model=list[CategoryResponse])
async def list_categories(request: Request, org: CurrentOrg, db: DB):
    result = await db.execute(
        select(Category).where(Category.org_id == org.id).order_by(Category.name)
    )
    return [CategoryResponse.model_validate(c) for c in result.scalars().all()]


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    data: CategoryCreate, request: Request, org: CurrentOrg, db: DB,
    _role: None = Depends(require_role(OrgRole.OWNER, OrgRole.FINANCE_MANAGER)),
):
    cat = Category(id=generate_uuid(), org_id=org.id, **data.model_dump())
    db.add(cat)
    await db.flush()
    return CategoryResponse.model_validate(cat)
