"""LedgerLeaf AI — Pydantic schemas for request/response validation."""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, EmailStr, Field, field_validator


# ─── Base ────────────────────────────────────────────────────────────────────


class BaseSchema(BaseModel):
    """Base schema with common config."""
    model_config = {"from_attributes": True}


class TimestampSchema(BaseSchema):
    created_at: datetime
    updated_at: datetime


# ─── Auth ────────────────────────────────────────────────────────────────────


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=255)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    user: UserResponse
    token_type: str = "bearer"


class UserResponse(BaseSchema):
    id: str
    email: str
    full_name: str
    avatar_url: str | None = None
    is_active: bool


class UserUpdate(BaseModel):
    full_name: str | None = Field(None, min_length=1, max_length=255)
    avatar_url: str | None = None


# ─── Organization ────────────────────────────────────────────────────────────


class OrgCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    country: str = Field(default="IN", min_length=2, max_length=3)
    currency: str = Field(default="INR", min_length=3, max_length=3)
    timezone: str = Field(default="Asia/Kolkata", max_length=64)


class OrgResponse(TimestampSchema):
    id: str
    name: str
    slug: str
    country: str
    currency: str
    timezone: str
    logo_url: str | None = None
    is_demo: bool


class OrgMemberResponse(BaseSchema):
    id: str
    user_id: str
    org_id: str
    role: str
    is_active: bool
    user: UserResponse | None = None


class InvitationCreate(BaseModel):
    email: EmailStr
    role: str = "team_member"


class InvitationResponse(TimestampSchema):
    id: str
    org_id: str
    email: str
    role: str
    status: str
    expires_at: datetime


# ─── Client ──────────────────────────────────────────────────────────────────


class ClientCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: EmailStr | None = None
    phone: str | None = Field(None, max_length=32)
    company: str | None = Field(None, max_length=255)
    address: str | None = None
    city: str | None = Field(None, max_length=128)
    country: str | None = Field(None, max_length=3)
    tax_id: str | None = Field(None, max_length=64)
    notes: str | None = None


class ClientUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    email: EmailStr | None = None
    phone: str | None = Field(None, max_length=32)
    company: str | None = Field(None, max_length=255)
    address: str | None = None
    city: str | None = Field(None, max_length=128)
    country: str | None = Field(None, max_length=3)
    tax_id: str | None = Field(None, max_length=64)
    notes: str | None = None
    is_active: bool | None = None


class ClientResponse(TimestampSchema):
    id: str
    org_id: str
    name: str
    email: str | None = None
    phone: str | None = None
    company: str | None = None
    address: str | None = None
    city: str | None = None
    country: str | None = None
    tax_id: str | None = None
    notes: str | None = None
    is_active: bool


# ─── Invoice ─────────────────────────────────────────────────────────────────


class LineItemCreate(BaseModel):
    description: str = Field(min_length=1)
    quantity: Decimal = Field(default=Decimal("1"), ge=Decimal("0.0001"))
    unit_price: Decimal = Field(ge=Decimal("0"))
    discount_percent: Decimal = Field(default=Decimal("0"), ge=Decimal("0"), le=Decimal("100"))
    tax_percent: Decimal = Field(default=Decimal("0"), ge=Decimal("0"), le=Decimal("100"))
    sort_order: int = 0


class LineItemResponse(BaseSchema):
    id: str
    invoice_id: str
    description: str
    quantity: Decimal
    unit_price: Decimal
    discount_percent: Decimal
    tax_percent: Decimal
    line_total: Decimal
    sort_order: int


class InvoiceCreate(BaseModel):
    client_id: str
    issue_date: datetime
    due_date: datetime
    currency: str = Field(default="INR", min_length=3, max_length=3)
    notes: str | None = None
    payment_terms: str | None = None
    line_items: list[LineItemCreate] = Field(min_length=1)

    @field_validator("due_date")
    @classmethod
    def due_date_after_issue(cls, v: datetime, info) -> datetime:
        if "issue_date" in info.data and v < info.data["issue_date"]:
            raise ValueError("Due date must be on or after issue date")
        return v


class InvoiceUpdate(BaseModel):
    client_id: str | None = None
    issue_date: datetime | None = None
    due_date: datetime | None = None
    currency: str | None = Field(None, min_length=3, max_length=3)
    notes: str | None = None
    payment_terms: str | None = None
    line_items: list[LineItemCreate] | None = None


class InvoiceResponse(TimestampSchema):
    id: str
    org_id: str
    client_id: str
    invoice_number: str
    status: str
    issue_date: datetime
    due_date: datetime
    currency: str
    subtotal: Decimal
    tax_amount: Decimal
    discount_amount: Decimal
    total: Decimal
    amount_paid: Decimal
    balance_due: Decimal
    notes: str | None = None
    payment_terms: str | None = None
    created_by: str
    line_items: list[LineItemResponse] = []
    client: ClientResponse | None = None


# ─── Payment ─────────────────────────────────────────────────────────────────


class PaymentCreate(BaseModel):
    invoice_id: str
    amount: Decimal = Field(gt=Decimal("0"))
    payment_date: datetime
    payment_method: str | None = None
    reference: str | None = None
    notes: str | None = None
    idempotency_key: str | None = None


class PaymentResponse(TimestampSchema):
    id: str
    org_id: str
    invoice_id: str
    amount: Decimal
    currency: str
    payment_date: datetime
    payment_method: str | None = None
    reference: str | None = None
    notes: str | None = None
    recorded_by: str


# ─── Expense ─────────────────────────────────────────────────────────────────


class ExpenseCreate(BaseModel):
    description: str = Field(min_length=1)
    merchant: str | None = None
    amount: Decimal = Field(gt=Decimal("0"))
    tax_amount: Decimal = Field(default=Decimal("0"), ge=Decimal("0"))
    currency: str = Field(default="INR", min_length=3, max_length=3)
    expense_date: datetime
    payment_method: str | None = None
    category_id: str | None = None
    document_id: str | None = None
    notes: str | None = None


class ExpenseUpdate(BaseModel):
    description: str | None = Field(None, min_length=1)
    merchant: str | None = None
    amount: Decimal | None = Field(None, gt=Decimal("0"))
    tax_amount: Decimal | None = Field(None, ge=Decimal("0"))
    currency: str | None = Field(None, min_length=3, max_length=3)
    expense_date: datetime | None = None
    payment_method: str | None = None
    category_id: str | None = None
    notes: str | None = None
    status: str | None = None


class ExpenseResponse(TimestampSchema):
    id: str
    org_id: str
    description: str
    merchant: str | None = None
    amount: Decimal
    tax_amount: Decimal
    currency: str
    expense_date: datetime
    payment_method: str | None = None
    category_id: str | None = None
    document_id: str | None = None
    status: str
    notes: str | None = None
    created_by: str


# ─── Transaction ─────────────────────────────────────────────────────────────


class TransactionCreate(BaseModel):
    transaction_type: str
    description: str = Field(min_length=1)
    amount: Decimal = Field(gt=Decimal("0"))
    currency: str = Field(default="INR", min_length=3, max_length=3)
    transaction_date: datetime
    category_id: str | None = None
    invoice_id: str | None = None
    expense_id: str | None = None
    reference: str | None = None


class TransactionResponse(TimestampSchema):
    id: str
    org_id: str
    transaction_type: str
    description: str
    amount: Decimal
    currency: str
    transaction_date: datetime
    category_id: str | None = None
    invoice_id: str | None = None
    expense_id: str | None = None
    reference: str | None = None
    created_by: str


# ─── Category ────────────────────────────────────────────────────────────────


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=128)
    description: str | None = None
    color: str | None = Field(None, pattern=r"^#[0-9a-fA-F]{6}$")


class CategoryResponse(TimestampSchema):
    id: str
    org_id: str
    name: str
    description: str | None = None
    color: str | None = None


# ─── Document ────────────────────────────────────────────────────────────────


class DocumentResponse(TimestampSchema):
    id: str
    org_id: str
    filename: str
    original_filename: str
    mime_type: str
    file_size: int
    document_type: str
    extraction_status: str
    uploaded_by: str


class ExtractionResultResponse(BaseSchema):
    id: str
    document_id: str
    field_name: str
    extracted_value: str | None
    corrected_value: str | None
    confidence: Decimal | None
    is_reviewed: bool


# ─── Action Proposal ─────────────────────────────────────────────────────────


class ActionProposalCreate(BaseModel):
    action_type: str
    target_record_type: str | None = None
    target_record_id: str | None = None
    payload: dict[str, Any]
    recipient: str | None = None
    evidence: dict[str, Any] | None = None
    risk_level: str = "low"


class ActionProposalResponse(TimestampSchema):
    id: str
    org_id: str
    requested_by: str
    action_type: str
    target_record_type: str | None = None
    target_record_id: str | None = None
    payload: dict[str, Any]
    payload_hash: str
    recipient: str | None = None
    evidence: dict[str, Any] | None = None
    risk_level: str
    required_role: str
    status: str
    approved_by: str | None = None
    approved_at: datetime | None = None
    rejection_reason: str | None = None
    execution_result: str | None = None
    expires_at: datetime


class ApprovalDecision(BaseModel):
    approved: bool
    reason: str | None = None


# ─── Dashboard ───────────────────────────────────────────────────────────────


class DashboardResponse(BaseModel):
    period_start: datetime
    period_end: datetime
    currency: str
    total_income: Decimal
    total_expenses: Decimal
    net_income: Decimal
    outstanding_receivables: Decimal
    overdue_invoices_count: int
    overdue_invoices_amount: Decimal
    pending_approvals_count: int
    monthly_trends: list[dict[str, Any]]
    expense_by_category: list[dict[str, Any]]
    recent_transactions: list[TransactionResponse]
    recent_ai_insights: list[dict[str, Any]] = []


# ─── Pagination ──────────────────────────────────────────────────────────────


class PaginatedResponse(BaseModel):
    items: list[Any]
    total: int
    page: int
    page_size: int
    total_pages: int


# ─── AI ──────────────────────────────────────────────────────────────────────


class AIChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    conversation_id: str | None = None


class AIChatResponse(BaseModel):
    conversation_id: str
    message: str
    source_records: list[dict[str, Any]] = []
    proposed_actions: list[ActionProposalResponse] = []
    tokens_used: int = 0


# ─── Health ──────────────────────────────────────────────────────────────────


class HealthResponse(BaseModel):
    status: str
    version: str
    database: str
    timestamp: datetime
