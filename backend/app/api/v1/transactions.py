"""LedgerLeaf AI — Transactions API routes."""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Query, Request
from sqlalchemy import func, select

from app.api.deps import CurrentOrg, DB
from app.models.models import Transaction, TransactionType
from app.schemas.schemas import PaginatedResponse, TransactionResponse

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.get("", response_model=PaginatedResponse)
async def list_transactions(
    request: Request, org: CurrentOrg, db: DB,
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    transaction_type: str | None = None,
    date_from: datetime | None = None, date_to: datetime | None = None,
):
    query = select(Transaction).where(Transaction.org_id == org.id)
    if transaction_type:
        try:
            query = query.where(Transaction.transaction_type == TransactionType(transaction_type))
        except ValueError:
            pass
    if date_from:
        query = query.where(Transaction.transaction_date >= date_from)
    if date_to:
        query = query.where(Transaction.transaction_date <= date_to)

    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar() or 0
    query = query.order_by(Transaction.transaction_date.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    txns = result.scalars().all()
    return PaginatedResponse(
        items=[TransactionResponse.model_validate(t) for t in txns],
        total=total, page=page, page_size=page_size,
        total_pages=(total + page_size - 1) // page_size if total > 0 else 0,
    )
