"""LedgerLeaf AI — Dashboard API routes."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from decimal import Decimal

from fastapi import APIRouter, Query, Request
from sqlalchemy import case, extract, func, select

from app.api.deps import CurrentOrg, DB
from app.models.models import (
    ActionProposal,
    ActionStatus,
    Category,
    Expense,
    ExpenseStatus,
    Invoice,
    InvoiceStatus,
    Transaction,
    TransactionType,
)
from app.schemas.schemas import DashboardResponse, TransactionResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardResponse)
async def get_dashboard(
    request: Request,
    org: CurrentOrg,
    db: DB,
    period_start: datetime | None = None,
    period_end: datetime | None = None,
):
    """Get the financial dashboard summary for the current organization.

    All figures are computed from backend data — nothing is fabricated.
    """
    now = datetime.now(timezone.utc)
    if period_start is None:
        period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    if period_end is None:
        period_end = now

    # ── Total Income (from transactions in period) ────────────────────────
    income_result = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount), Decimal("0.00")))
        .where(
            Transaction.org_id == org.id,
            Transaction.transaction_type == TransactionType.INCOME,
            Transaction.transaction_date >= period_start,
            Transaction.transaction_date <= period_end,
        )
    )
    total_income = income_result.scalar() or Decimal("0.00")

    # ── Total Expenses (approved, in period) ──────────────────────────────
    expense_result = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount), Decimal("0.00")))
        .where(
            Transaction.org_id == org.id,
            Transaction.transaction_type == TransactionType.EXPENSE,
            Transaction.transaction_date >= period_start,
            Transaction.transaction_date <= period_end,
        )
    )
    total_expenses = expense_result.scalar() or Decimal("0.00")

    net_income = total_income - total_expenses

    # ── Outstanding Receivables ───────────────────────────────────────────
    recv_result = await db.execute(
        select(func.coalesce(func.sum(Invoice.balance_due), Decimal("0.00")))
        .where(
            Invoice.org_id == org.id,
            Invoice.status.in_([InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE]),
        )
    )
    outstanding_receivables = recv_result.scalar() or Decimal("0.00")

    # ── Overdue Invoices ──────────────────────────────────────────────────
    overdue_result = await db.execute(
        select(func.count(), func.coalesce(func.sum(Invoice.balance_due), Decimal("0.00")))
        .where(
            Invoice.org_id == org.id,
            Invoice.status.in_([InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE]),
            Invoice.due_date < now,
        )
    )
    overdue_row = overdue_result.one()
    overdue_count = overdue_row[0] or 0
    overdue_amount = overdue_row[1] or Decimal("0.00")

    # ── Pending Approvals ─────────────────────────────────────────────────
    approval_result = await db.execute(
        select(func.count())
        .where(
            ActionProposal.org_id == org.id,
            ActionProposal.status == ActionStatus.PENDING_APPROVAL,
        )
    )
    pending_approvals = approval_result.scalar() or 0

    # ── Monthly Trends (last 6 months) ────────────────────────────────────
    six_months_ago = now - timedelta(days=180)
    trends_result = await db.execute(
        select(
            extract("year", Transaction.transaction_date).label("year"),
            extract("month", Transaction.transaction_date).label("month"),
            func.sum(
                case(
                    (Transaction.transaction_type == TransactionType.INCOME, Transaction.amount),
                    else_=Decimal("0"),
                )
            ).label("income"),
            func.sum(
                case(
                    (Transaction.transaction_type == TransactionType.EXPENSE, Transaction.amount),
                    else_=Decimal("0"),
                )
            ).label("expenses"),
        )
        .where(
            Transaction.org_id == org.id,
            Transaction.transaction_date >= six_months_ago,
        )
        .group_by("year", "month")
        .order_by("year", "month")
    )
    monthly_trends = [
        {"year": int(row.year), "month": int(row.month), "income": float(row.income or 0), "expenses": float(row.expenses or 0)}
        for row in trends_result
    ]

    # ── Expense by Category ──────────────────────────────────────────────
    cat_result = await db.execute(
        select(
            Category.name,
            Category.color,
            func.sum(Expense.amount).label("total"),
        )
        .join(Expense, Expense.category_id == Category.id)
        .where(
            Expense.org_id == org.id,
            Expense.status == ExpenseStatus.APPROVED,
            Expense.expense_date >= period_start,
            Expense.expense_date <= period_end,
        )
        .group_by(Category.name, Category.color)
        .order_by(func.sum(Expense.amount).desc())
    )
    expense_by_category = [
        {"name": row.name, "color": row.color, "total": float(row.total or 0)}
        for row in cat_result
    ]

    # ── Recent Transactions ──────────────────────────────────────────────
    txn_result = await db.execute(
        select(Transaction)
        .where(Transaction.org_id == org.id)
        .order_by(Transaction.transaction_date.desc())
        .limit(10)
    )
    recent_txns = txn_result.scalars().all()

    return DashboardResponse(
        period_start=period_start,
        period_end=period_end,
        currency=org.currency,
        total_income=total_income,
        total_expenses=total_expenses,
        net_income=net_income,
        outstanding_receivables=outstanding_receivables,
        overdue_invoices_count=overdue_count,
        overdue_invoices_amount=overdue_amount,
        pending_approvals_count=pending_approvals,
        monthly_trends=monthly_trends,
        expense_by_category=expense_by_category,
        recent_transactions=[TransactionResponse.model_validate(t) for t in recent_txns],
    )
