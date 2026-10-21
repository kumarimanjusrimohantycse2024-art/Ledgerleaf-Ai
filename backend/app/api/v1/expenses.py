"""LedgerLeaf AI — Expenses API routes."""
from __future__ import annotations

import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, select

from app.api.deps import CurrentOrg, CurrentUser, DB, require_role
from app.core.security import generate_uuid
from app.models.models import (
    AuditEvent,
    Category,
    Expense,
    ExpenseStatus,
    OrgRole,
    Transaction,
    TransactionType,
)
from app.schemas.schemas import ExpenseCreate, ExpenseResponse, ExpenseUpdate, PaginatedResponse

router = APIRouter(prefix="/expenses", tags=["Expenses"])


@router.get("", response_model=PaginatedResponse)
async def list_expenses(
    request: Request,
    org: CurrentOrg,
    db: DB,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status"),
    category_id: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
):
    """List expenses for the current organization."""
    query = select(Expense).where(Expense.org_id == org.id)

    if status_filter:
        try:
            exp_status = ExpenseStatus(status_filter)
            query = query.where(Expense.status == exp_status)
        except ValueError:
            pass

    if category_id:
        query = query.where(Expense.category_id == category_id)
    if date_from:
        query = query.where(Expense.expense_date >= date_from)
    if date_to:
        query = query.where(Expense.expense_date <= date_to)

    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    query = query.order_by(Expense.expense_date.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    expenses = result.scalars().all()

    return PaginatedResponse(
        items=[ExpenseResponse.model_validate(e) for e in expenses],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size if total > 0 else 0,
    )


@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_expense(
    data: ExpenseCreate,
    request: Request,
    org: CurrentOrg,
    user: CurrentUser,
    db: DB,
    _role: None = Depends(require_role(OrgRole.OWNER, OrgRole.FINANCE_MANAGER, OrgRole.TEAM_MEMBER)),
):
    """Create a new expense record."""
    # Verify category if provided
    if data.category_id:
        result = await db.execute(
            select(Category).where(Category.id == data.category_id, Category.org_id == org.id)
        )
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    expense = Expense(
        id=generate_uuid(),
        org_id=org.id,
        created_by=user.id,
        **data.model_dump(),
    )
    db.add(expense)

    audit = AuditEvent(
        id=generate_uuid(), org_id=org.id, user_id=user.id,
        action="expense.created", resource_type="expense", resource_id=expense.id,
        details=json.dumps({"amount": str(data.amount), "merchant": data.merchant}),
    )
    db.add(audit)
    await db.flush()

    return ExpenseResponse.model_validate(expense)


@router.get("/{expense_id}", response_model=ExpenseResponse)
async def get_expense(expense_id: str, request: Request, org: CurrentOrg, db: DB):
    """Get an expense by ID."""
    result = await db.execute(
        select(Expense).where(Expense.id == expense_id, Expense.org_id == org.id)
    )
    expense = result.scalar_one_or_none()
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    return ExpenseResponse.model_validate(expense)


@router.patch("/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    expense_id: str,
    data: ExpenseUpdate,
    request: Request,
    org: CurrentOrg,
    user: CurrentUser,
    db: DB,
    _role: None = Depends(require_role(OrgRole.OWNER, OrgRole.FINANCE_MANAGER)),
):
    """Update an expense."""
    result = await db.execute(
        select(Expense).where(Expense.id == expense_id, Expense.org_id == org.id)
    )
    expense = result.scalar_one_or_none()
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")

    update_data = data.model_dump(exclude_unset=True)

    # Handle status transition
    if "status" in update_data:
        try:
            new_status = ExpenseStatus(update_data["status"])
            update_data["status"] = new_status
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status")

    for field, value in update_data.items():
        setattr(expense, field, value)

    # If approved, create transaction
    if expense.status == ExpenseStatus.APPROVED:
        # Check if transaction already exists
        result = await db.execute(
            select(Transaction).where(Transaction.expense_id == expense.id)
        )
        if not result.scalar_one_or_none():
            txn = Transaction(
                id=generate_uuid(),
                org_id=org.id,
                transaction_type=TransactionType.EXPENSE,
                description=expense.description,
                amount=expense.amount,
                currency=expense.currency,
                transaction_date=expense.expense_date,
                category_id=expense.category_id,
                expense_id=expense.id,
                created_by=user.id,
            )
            db.add(txn)

    audit = AuditEvent(
        id=generate_uuid(), org_id=org.id, user_id=user.id,
        action="expense.updated", resource_type="expense", resource_id=expense.id,
    )
    db.add(audit)
    await db.flush()

    return ExpenseResponse.model_validate(expense)
