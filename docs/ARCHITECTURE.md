# 🏗️ LedgerLeaf AI — Architecture Decision Record

## System Architecture

### Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | Next.js 16 + React 19 + TypeScript | Server components, App Router, type safety |
| **Styling** | Tailwind CSS 4 | Rapid UI development, utility-first |
| **Charts** | Recharts 3 | React-native charting, responsive |
| **Icons** | Lucide React | Consistent, tree-shakeable icons |
| **Backend** | FastAPI + Python 3.13 | Async-first, auto-docs, type validation |
| **ORM** | SQLAlchemy 2.1 (async) | Mature, battle-tested, async support |
| **Validation** | Pydantic V2 | Fast validation, JSON serialization |
| **Auth** | JWT + bcrypt | Stateless auth, secure password hashing |
| **Database** | SQLite (dev) / PostgreSQL (prod) | Zero-config dev, production-ready |

---

## Design Principles

### 1. AI Proposes, Humans Approve
All consequential AI actions go through an approval pipeline:
```
AI Suggestion → Pending Approval → Human Review → Approve/Reject → Execute/Cancel
```

### 2. Tenant Isolation
Every database query is scoped to the authenticated user's organization:
```python
query = select(Model).where(Model.organization_id == current_org_id)
```

### 3. Decimal Safety
All monetary calculations use Python `Decimal` with `ROUND_HALF_UP`:
```python
from decimal import Decimal, ROUND_HALF_UP
total = (quantity * unit_price).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
```

### 4. Payload Integrity
Approval payloads are SHA-256 hashed to prevent tampering:
```python
payload_hash = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()
```

### 5. Idempotency
Payment operations use idempotency keys to prevent double-charging:
```python
existing = await db.execute(select(Payment).where(Payment.idempotency_key == key))
```

---

## Data Model

### Core Entities

```
User (1) ──── (N) OrgMembership (N) ──── (1) Organization
                                              │
                    ┌─────────────┬────────────┼────────────┬──────────────┐
                    │             │            │            │              │
                 Client       Invoice      Expense    Approval     Transaction
                    │             │
                    │          InvoiceLine
                    │             │
                    └─── Invoice ─┘
                         │
                      Payment
```

### Key Relationships
- **User** belongs to multiple **Organizations** via **OrgMembership** (with roles)
- **Organization** owns all business entities (clients, invoices, expenses)
- **Invoice** has multiple **InvoiceLines** with computed subtotals
- **Payment** records against **Invoice** with overpayment prevention
- **Approval** links to any action with payload hash verification

---

## API Design

### RESTful Conventions
- `GET /api/v1/{resource}` — List with pagination
- `POST /api/v1/{resource}` — Create
- `GET /api/v1/{resource}/{id}` — Read
- `PUT /api/v1/{resource}/{id}` — Update
- `DELETE /api/v1/{resource}/{id}` — Delete

### Authentication Flow
```
POST /api/v1/auth/register → { email, password, name } → JWT token
POST /api/v1/auth/login → { email, password } → JWT token
GET /api/v1/auth/me → Profile (requires Bearer token)
```

### Organization Scoping
All business endpoints require:
- `Authorization: Bearer <jwt_token>` header
- `X-Organization-Id: <uuid>` header

---

## Security Model

| Threat | Mitigation |
|--------|-----------|
| Credential theft | bcrypt password hashing (12 rounds) |
| Token forgery | JWT with HS256, configurable expiry |
| Cross-tenant access | Organization-scoped queries + test coverage |
| Double payments | Idempotency keys on payment creation |
| Approval tampering | SHA-256 payload hash verification |
| SQL injection | SQLAlchemy parameterized queries |
| XSS | React auto-escaping + CSP headers |
| CSRF | SameSite cookies + Bearer tokens |

---

## Frontend Architecture

### Route Structure (App Router)
```
/ → Landing page (marketing)
/login → Authentication
/register → Registration
/onboarding → Organization setup
/dashboard → Financial overview (protected)
/dashboard/invoices → Invoice management
/dashboard/clients → Client directory
/dashboard/expenses → Expense tracker
/dashboard/assistant → AI chat
/dashboard/approvals → Approval queue
/dashboard/reports → Financial reports
/dashboard/cashflow → Cash flow forecast
/dashboard/transactions → Transaction ledger
/dashboard/receivables → Accounts receivable
/dashboard/documents → Document management
/dashboard/team → Team members
/dashboard/settings → Preferences
/dashboard/billing → Subscription management
```

### State Management
- **Server state**: Fetched via `fetch()` in components
- **Auth state**: JWT stored in `localStorage`
- **UI state**: React `useState` / `useReducer`
- **No external state library** — kept simple for MVP

---

## Testing Strategy

### Test Pyramid
```
         ┌─────────┐
         │  E2E    │  (Manual verification)
        ┌┴─────────┴┐
        │ Integration │  (20 API tests)
       ┌┴─────────────┴┐
       │   Unit Tests    │  (Inline validation)
      └──────────────────┘
```

### Coverage Areas
- Authentication (register, login, profile, unauthorized access)
- Multi-tenancy (cross-tenant access blocked — 3 security tests)
- Financial math (invoice totals, decimal rounding)
- Payment workflows (partial, full, idempotency, overpayment)
- Expense CRUD with status transitions
- Dashboard computed metrics
- Approval lifecycle (create, approve, reject, expiry)
