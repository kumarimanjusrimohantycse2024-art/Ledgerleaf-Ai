# 📡 LedgerLeaf AI — API Reference

> **Base URL:** `http://localhost:8000` (dev) | `https://your-api.up.railway.app` (prod)  
> **Interactive Docs:** `{BASE_URL}/docs` (Swagger UI)

---

## Authentication

All protected endpoints require:
```
Authorization: Bearer <jwt_token>
X-Organization-Id: <organization_uuid>
```

### POST `/api/v1/auth/register`
Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ss123",
  "name": "Jane Smith"
}
```

**Response:** `201 Created`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Jane Smith"
  }
}
```

### POST `/api/v1/auth/login`
Authenticate and receive JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ss123"
}
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

### GET `/api/v1/auth/me`
Get current user profile. **Requires auth.**

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "Jane Smith",
  "created_at": "2026-10-21T12:00:00Z"
}
```

---

## Organizations

### POST `/api/v1/auth/organizations`
Create a new organization (workspace). **Requires auth.**

**Request:**
```json
{
  "name": "My Agency",
  "industry": "Digital Agency"
}
```

### GET `/api/v1/auth/organizations`
List user's organizations. **Requires auth.**

---

## Clients

### GET `/api/v1/clients`
List clients with pagination. **Requires auth + org.**

**Query Params:** `?skip=0&limit=20&search=acme`

### POST `/api/v1/clients`
Create a new client. **Requires auth + org.**

**Request:**
```json
{
  "name": "Acme Corp",
  "email": "billing@acme.com",
  "phone": "+1-555-0100",
  "address": "123 Business St",
  "notes": "Premium client"
}
```

### GET `/api/v1/clients/{id}`
Get client details. **Requires auth + org.**

### PUT `/api/v1/clients/{id}`
Update client. **Requires auth + org.**

### DELETE `/api/v1/clients/{id}`
Delete client. **Requires auth + org.**

---

## Invoices

### GET `/api/v1/invoices`
List invoices with pagination. **Requires auth + org.**

**Query Params:** `?skip=0&limit=20&status=draft&client_id=uuid`

### POST `/api/v1/invoices`
Create invoice with line items. **Requires auth + org.**

**Request:**
```json
{
  "client_id": "uuid",
  "due_date": "2026-11-21",
  "tax_rate": 18.0,
  "discount": 5.0,
  "notes": "Web development services",
  "items": [
    {
      "description": "Frontend Development",
      "quantity": 40,
      "unit_price": 150.00
    },
    {
      "description": "Backend API",
      "quantity": 30,
      "unit_price": 175.00
    }
  ]
}
```

**Response:** `201 Created` — Invoice with computed `subtotal`, `tax_amount`, `discount_amount`, `total`

### POST `/api/v1/invoices/{id}/issue`
Issue a draft invoice (changes status to `issued`). **Requires auth + org.**

### POST `/api/v1/invoices/{id}/payments`
Record a payment against an invoice. **Requires auth + org.**

**Request:**
```json
{
  "amount": 5000.00,
  "method": "bank_transfer",
  "reference": "TXN-12345",
  "idempotency_key": "unique-key-123"
}
```

**Business Rules:**
- Partial payments allowed
- Overpayment rejected (400 error)
- Duplicate `idempotency_key` returns existing payment
- Auto-sets status to `paid` when fully paid

---

## Expenses

### GET `/api/v1/expenses`
List expenses. **Requires auth + org.**

### POST `/api/v1/expenses`
Create expense. **Requires auth + org.**

**Request:**
```json
{
  "description": "Office Supplies",
  "amount": 250.00,
  "category": "Office",
  "date": "2026-10-21",
  "vendor": "Staples",
  "receipt_url": null
}
```

### PUT `/api/v1/expenses/{id}`
Update expense. **Requires auth + org.**

### DELETE `/api/v1/expenses/{id}`
Delete expense. **Requires auth + org.**

---

## Dashboard

### GET `/api/v1/dashboard`
Get financial dashboard data. **Requires auth + org.**

**Response:** `200 OK`
```json
{
  "total_revenue": 125000.00,
  "total_expenses": 45000.00,
  "net_income": 80000.00,
  "outstanding_receivables": 15000.00,
  "monthly_revenue": [
    { "month": "2026-01", "amount": 10000.00 },
    { "month": "2026-02", "amount": 12000.00 }
  ],
  "expense_by_category": [
    { "category": "Office", "amount": 5000.00 },
    { "category": "Software", "amount": 3000.00 }
  ],
  "recent_invoices": [...],
  "recent_expenses": [...]
}
```

---

## Approvals

### GET `/api/v1/approvals`
List pending approvals. **Requires auth + org.**

### POST `/api/v1/approvals`
Create an approval request. **Requires auth + org.**

**Request:**
```json
{
  "action_type": "send_invoice",
  "description": "Send invoice #INV-001 to Acme Corp",
  "risk_level": "medium",
  "payload": { "invoice_id": "uuid", "recipient": "billing@acme.com" },
  "expires_at": "2026-10-22T12:00:00Z"
}
```

### POST `/api/v1/approvals/{id}/approve`
Approve a pending action. Verifies payload hash integrity. **Requires auth + org.**

### POST `/api/v1/approvals/{id}/reject`
Reject a pending action. **Requires auth + org.**

**Request:**
```json
{
  "reason": "Need to verify amount first"
}
```

---

## Transactions

### GET `/api/v1/transactions`
List transaction ledger entries. **Requires auth + org.**

---

## Categories

### GET `/api/v1/categories`
List expense categories. **Requires auth + org.**

---

## Health

### GET `/health`
Application health check. **No auth required.**

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

---

## Error Responses

All errors follow a consistent format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

| Status Code | Meaning |
|-------------|---------|
| `400` | Bad Request (validation error, business rule violation) |
| `401` | Unauthorized (missing or invalid token) |
| `403` | Forbidden (wrong organization, insufficient role) |
| `404` | Not Found |
| `409` | Conflict (duplicate resource) |
| `422` | Unprocessable Entity (Pydantic validation) |
| `500` | Internal Server Error |
