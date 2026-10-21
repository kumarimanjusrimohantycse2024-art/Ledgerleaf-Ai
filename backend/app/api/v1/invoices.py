"""LedgerLeaf AI — Invoice & Payment API routes."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from decimal import ROUND_HALF_UP, Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import CurrentOrg, CurrentUser, DB, require_role
from app.core.security import generate_uuid
from app.models.models import (
    AuditEvent,
    Client,
    Invoice,
    InvoiceLineItem,
    InvoiceStatus,
    OrgRole,
    Payment,
    Transaction,
    TransactionType,
)
from app.schemas.schemas import (
    InvoiceCreate,
    InvoiceResponse,
    InvoiceUpdate,
    PaginatedResponse,
    PaymentCreate,
    PaymentResponse,
)

router = APIRouter(prefix="/invoices", tags=["Invoices"])


def _calculate_line_total(qty: Decimal, unit_price: Decimal, discount_pct: Decimal, tax_pct: Decimal) -> dict:
    """Deterministic line-item calculation with Decimal arithmetic."""
    base = (qty * unit_price).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    discount = (base * discount_pct / Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    after_discount = base - discount
    tax = (after_discount * tax_pct / Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    line_total = (after_discount + tax).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    return {
        "base": base,
        "discount": discount,
        "after_discount": after_discount,
        "tax": tax,
        "line_total": line_total,
    }


def _calculate_invoice_totals(line_items_data: list[dict]) -> dict:
    """Calculate invoice totals from line items using Decimal arithmetic."""
    subtotal = Decimal("0.00")
    total_tax = Decimal("0.00")
    total_discount = Decimal("0.00")

    for item in line_items_data:
        subtotal += item["after_discount"]
        total_tax += item["tax"]
        total_discount += item["discount"]

    total = subtotal + total_tax
    return {
        "subtotal": subtotal.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
        "tax_amount": total_tax.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
        "discount_amount": total_discount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
        "total": total.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
    }


async def _next_invoice_number(db: AsyncSession, org_id: str) -> str:
    """Generate the next sequential invoice number for the org."""
    result = await db.execute(
        select(func.count()).where(Invoice.org_id == org_id)
    )
    count = result.scalar() or 0
    return f"INV-{count + 1:05d}"


@router.get("", response_model=PaginatedResponse)
async def list_invoices(
    request: Request,
    org: CurrentOrg,
    db: DB,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status"),
    client_id: str | None = None,
    search: str | None = None,
):
    """List invoices for the current organization."""
    query = select(Invoice).where(Invoice.org_id == org.id)

    if status_filter:
        try:
            inv_status = InvoiceStatus(status_filter)
            query = query.where(Invoice.status == inv_status)
        except ValueError:
            pass

    if client_id:
        query = query.where(Invoice.client_id == client_id)

    if search:
        query = query.where(
            Invoice.invoice_number.ilike(f"%{search}%")
        )

    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    query = query.options(selectinload(Invoice.line_items), selectinload(Invoice.client))
    query = query.order_by(Invoice.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    invoices = result.scalars().unique().all()

    return PaginatedResponse(
        items=[InvoiceResponse.model_validate(inv) for inv in invoices],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size if total > 0 else 0,
    )


@router.post("", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
async def create_invoice(
    data: InvoiceCreate,
    request: Request,
    org: CurrentOrg,
    user: CurrentUser,
    db: DB,
    _role: None = Depends(require_role(OrgRole.OWNER, OrgRole.FINANCE_MANAGER, OrgRole.TEAM_MEMBER)),
):
    """Create a new invoice with line items. Totals are calculated server-side."""
    # Verify client belongs to org
    result = await db.execute(
        select(Client).where(Client.id == data.client_id, Client.org_id == org.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found in this organization")

    invoice_number = await _next_invoice_number(db, org.id)

    # Calculate line items
    calculated_items = []
    for item in data.line_items:
        calc = _calculate_line_total(item.quantity, item.unit_price, item.discount_percent, item.tax_percent)
        calculated_items.append({**item.model_dump(), **calc})

    totals = _calculate_invoice_totals(calculated_items)

    invoice = Invoice(
        id=generate_uuid(),
        org_id=org.id,
        client_id=data.client_id,
        invoice_number=invoice_number,
        issue_date=data.issue_date,
        due_date=data.due_date,
        currency=data.currency or org.currency,
        subtotal=totals["subtotal"],
        tax_amount=totals["tax_amount"],
        discount_amount=totals["discount_amount"],
        total=totals["total"],
        amount_paid=Decimal("0.00"),
        balance_due=totals["total"],
        notes=data.notes,
        payment_terms=data.payment_terms,
        created_by=user.id,
    )
    db.add(invoice)
    await db.flush()

    for idx, item_data in enumerate(calculated_items):
        line_item = InvoiceLineItem(
            id=generate_uuid(),
            invoice_id=invoice.id,
            description=item_data["description"],
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"],
            discount_percent=item_data["discount_percent"],
            tax_percent=item_data["tax_percent"],
            line_total=item_data["line_total"],
            sort_order=item_data.get("sort_order", idx),
        )
        db.add(line_item)

    audit = AuditEvent(
        id=generate_uuid(),
        org_id=org.id,
        user_id=user.id,
        action="invoice.created",
        resource_type="invoice",
        resource_id=invoice.id,
        details=json.dumps({"invoice_number": invoice_number, "total": str(totals["total"])}),
    )
    db.add(audit)
    await db.flush()

    # Reload with relationships
    result = await db.execute(
        select(Invoice)
        .options(selectinload(Invoice.line_items), selectinload(Invoice.client))
        .where(Invoice.id == invoice.id)
    )
    invoice = result.scalar_one()
    return InvoiceResponse.model_validate(invoice)


@router.get("/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(invoice_id: str, request: Request, org: CurrentOrg, db: DB):
    """Get an invoice by ID."""
    result = await db.execute(
        select(Invoice)
        .options(selectinload(Invoice.line_items), selectinload(Invoice.client))
        .where(Invoice.id == invoice_id, Invoice.org_id == org.id)
    )
    invoice = result.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")
    return InvoiceResponse.model_validate(invoice)


@router.post("/{invoice_id}/issue", response_model=InvoiceResponse)
async def issue_invoice(
    invoice_id: str,
    request: Request,
    org: CurrentOrg,
    user: CurrentUser,
    db: DB,
    _role: None = Depends(require_role(OrgRole.OWNER, OrgRole.FINANCE_MANAGER)),
):
    """Transition invoice from DRAFT to ISSUED."""
    result = await db.execute(
        select(Invoice)
        .options(selectinload(Invoice.line_items), selectinload(Invoice.client))
        .where(Invoice.id == invoice_id, Invoice.org_id == org.id)
    )
    invoice = result.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")

    if invoice.status != InvoiceStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot issue invoice in status '{invoice.status.value}'. Must be 'draft'.",
        )

    invoice.status = InvoiceStatus.ISSUED

    audit = AuditEvent(
        id=generate_uuid(), org_id=org.id, user_id=user.id,
        action="invoice.issued", resource_type="invoice", resource_id=invoice.id,
    )
    db.add(audit)
    await db.flush()

    return InvoiceResponse.model_validate(invoice)


# ─── Payments ────────────────────────────────────────────────────────────────


payments_router = APIRouter(prefix="/payments", tags=["Payments"])


@payments_router.post("", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def record_payment(
    data: PaymentCreate,
    request: Request,
    org: CurrentOrg,
    user: CurrentUser,
    db: DB,
    _role: None = Depends(require_role(OrgRole.OWNER, OrgRole.FINANCE_MANAGER)),
):
    """Record a payment against an invoice. Prevents duplicate payments via idempotency key."""
    # Check idempotency
    if data.idempotency_key:
        result = await db.execute(
            select(Payment).where(Payment.idempotency_key == data.idempotency_key)
        )
        existing = result.scalar_one_or_none()
        if existing:
            return PaymentResponse.model_validate(existing)

    # Verify invoice belongs to org
    result = await db.execute(
        select(Invoice).where(Invoice.id == data.invoice_id, Invoice.org_id == org.id)
    )
    invoice = result.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")

    if invoice.status in (InvoiceStatus.CANCELLED, InvoiceStatus.VOID):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot pay a cancelled/void invoice")

    if invoice.status == InvoiceStatus.PAID:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invoice is already fully paid")

    if data.amount > invoice.balance_due:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payment amount {data.amount} exceeds balance due {invoice.balance_due}",
        )

    # Ensure currency match
    if data.payment_date is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment date is required")

    payment = Payment(
        id=generate_uuid(),
        org_id=org.id,
        invoice_id=invoice.id,
        amount=data.amount,
        currency=invoice.currency,
        payment_date=data.payment_date,
        payment_method=data.payment_method,
        reference=data.reference,
        notes=data.notes,
        idempotency_key=data.idempotency_key,
        recorded_by=user.id,
    )
    db.add(payment)

    # Update invoice
    invoice.amount_paid = (invoice.amount_paid + data.amount).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    invoice.balance_due = (invoice.total - invoice.amount_paid).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    if invoice.balance_due <= Decimal("0.00"):
        invoice.status = InvoiceStatus.PAID
        invoice.balance_due = Decimal("0.00")
    elif invoice.amount_paid > Decimal("0.00"):
        invoice.status = InvoiceStatus.PARTIALLY_PAID

    # Create transaction record
    txn = Transaction(
        id=generate_uuid(),
        org_id=org.id,
        transaction_type=TransactionType.INCOME,
        description=f"Payment for invoice {invoice.invoice_number}",
        amount=data.amount,
        currency=invoice.currency,
        transaction_date=data.payment_date,
        invoice_id=invoice.id,
        payment_id=payment.id,
        reference=data.reference,
        created_by=user.id,
    )
    db.add(txn)

    audit = AuditEvent(
        id=generate_uuid(), org_id=org.id, user_id=user.id,
        action="payment.recorded", resource_type="payment", resource_id=payment.id,
        details=json.dumps({
            "invoice_id": invoice.id,
            "amount": str(data.amount),
            "new_balance": str(invoice.balance_due),
            "new_status": invoice.status.value,
        }),
    )
    db.add(audit)
    await db.flush()

    return PaymentResponse.model_validate(payment)


@payments_router.get("/{invoice_id}/payments", response_model=list[PaymentResponse])
async def list_invoice_payments(invoice_id: str, request: Request, org: CurrentOrg, db: DB):
    """List all payments for an invoice."""
    result = await db.execute(
        select(Invoice).where(Invoice.id == invoice_id, Invoice.org_id == org.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")

    result = await db.execute(
        select(Payment).where(Payment.invoice_id == invoice_id, Payment.org_id == org.id)
        .order_by(Payment.payment_date.desc())
    )
    payments = result.scalars().all()
    return [PaymentResponse.model_validate(p) for p in payments]
