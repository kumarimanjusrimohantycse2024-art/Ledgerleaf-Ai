<p align="center">
  <img src="https://img.shields.io/badge/LedgerLeaf-AI-22764E?style=for-the-badge&logo=leaf&logoColor=white" alt="LedgerLeaf AI" />
</p>

<h1 align="center">🍃 LedgerLeaf AI</h1>
<h3 align="center">Less paperwork. Clearer finances. Smarter decisions.</h3>

<p align="center">
  AI-powered financial operations platform for agencies and service businesses.<br/>
  Manage invoices, track expenses, and make smarter financial decisions with AI-assisted workflows and human approval controls.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" />
  <img src="https://img.shields.io/badge/FastAPI-0.156-009688?logo=fastapi" />
  <img src="https://img.shields.io/badge/Python-3.13-3776AB?logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/SQLAlchemy-2.1-red" />
  <img src="https://img.shields.io/badge/Tests-20%20Passed-22764E" />
</p>

---

## 🚀 Live Demo

> **Frontend:** [https://ledgerleaf-ai.vercel.app](https://ledgerleaf-ai.vercel.app)  
> **Backend API:** Deploy to Railway/Render (see deployment guide below)

---

## ✨ Features

| Feature | Status | Description |
|---------|--------|-------------|
| 🔐 **Authentication** | ✅ Complete | JWT-based auth with registration, login, password hashing (bcrypt) |
| 🏢 **Multi-Tenancy** | ✅ Complete | Organization-scoped data isolation, role-based access (Owner/Manager/Member) |
| 👥 **Client Management** | ✅ Complete | Full CRUD, search, pagination, audit logging |
| 📄 **Invoices** | ✅ Complete | Create with line items, tax/discount math (Decimal-safe), issue/payment workflows |
| 💳 **Payments** | ✅ Complete | Partial/full payments, idempotency keys, overpayment prevention |
| 📊 **Financial Dashboard** | ✅ Complete | Revenue, expenses, net income, receivables, monthly trends, expense categories |
| 💰 **Expenses** | ✅ Complete | CRUD, status transitions, category-based tracking |
| 🤖 **AI Assistant** | ✅ UI Complete | Chat interface, demo mode, ready for OpenAI integration |
| ✅ **Approval Engine** | ✅ Complete | SHA-256 payload hashing, risk levels, expiry, approve/reject |
| 📈 **Reports** | ✅ Complete | P&L charts, financial summaries from real data |
| 💹 **Cash Flow** | ✅ UI Complete | Transparent methodology, rule-based projections |
| 📁 **Documents** | ✅ UI Complete | Upload interface ready for storage integration |
| 👥 **Team** | ✅ Complete | Member listing with role badges |
| ⚙️ **Settings** | ✅ Complete | Profile, workspace preferences, security |
| 💳 **Billing** | ✅ UI Complete | Subscription management placeholder |

---

## 🏗️ Architecture

```
LedgerLeaf-AI/
├── backend/                    # FastAPI Python Backend
│   ├── app/
│   │   ├── api/v1/            # REST API routes
│   │   │   ├── auth.py        # Auth & Organizations
│   │   │   ├── clients.py     # Client CRUD
│   │   │   ├── invoices.py    # Invoices & Payments
│   │   │   ├── expenses.py    # Expense Management
│   │   │   ├── dashboard.py   # Financial Analytics
│   │   │   ├── approvals.py   # Approval Engine
│   │   │   ├── transactions.py # Transaction Ledger
│   │   │   └── categories.py  # Category Management
│   │   ├── core/              # Config, DB, Security
│   │   ├── models/            # SQLAlchemy ORM Models
│   │   └── schemas/           # Pydantic Validation
│   ├── tests/                 # Pytest Test Suite (20 tests)
│   └── requirements.txt
│
├── frontend/                   # Next.js 16 Frontend
│   └── src/app/
│       ├── page.tsx           # Landing Page
│       ├── login/             # Authentication
│       ├── register/          # Registration
│       ├── onboarding/        # Workspace Setup
│       └── dashboard/         # App Dashboard
│           ├── page.tsx       # Financial Overview
│           ├── assistant/     # AI Chat Interface
│           ├── invoices/      # Invoice Management
│           ├── clients/       # Client Directory
│           ├── expenses/      # Expense Tracker
│           ├── transactions/  # Transaction Ledger
│           ├── approvals/     # Approval Queue
│           ├── receivables/   # AR Tracking
│           ├── cashflow/      # Cash Flow Forecast
│           ├── reports/       # Financial Reports
│           ├── documents/     # Document Upload
│           ├── team/          # Team Members
│           ├── billing/       # Subscription
│           └── settings/      # Preferences
│
└── .env.example               # Environment template
```

---

## 🛡️ Security Principles

- **Tenant Isolation**: Every API query is scoped to the authenticated user's organization
- **Approval Controls**: AI proposes → Humans approve → System executes
- **Payload Integrity**: SHA-256 hash verification prevents tampering with approved actions
- **Idempotency**: Payment idempotency keys prevent double-charging
- **Decimal Safety**: All monetary calculations use Python `Decimal` with `ROUND_HALF_UP`
- **No Secrets in Code**: All credentials via environment variables

---

## 🧪 Test Results

```
20 passed in 21.33s
├── test_health ✅
├── test_register_and_login ✅
├── test_register_duplicate_email ✅
├── test_get_profile ✅
├── test_unauthenticated_access ✅
├── test_create_organization ✅
├── test_list_organizations ✅
├── test_cross_tenant_client_access_blocked ✅  (Security)
├── test_cross_tenant_invoice_access_blocked ✅ (Security)
├── test_wrong_org_header_blocked ✅            (Security)
├── test_client_crud ✅
├── test_invoice_creation_with_correct_totals ✅ (Decimal Math)
├── test_invoice_issue_and_payment ✅
├── test_payment_idempotency ✅
├── test_overpayment_rejected ✅
├── test_decimal_rounding ✅
├── test_expense_crud ✅
├── test_dashboard_returns_computed_data ✅
├── test_approval_lifecycle ✅
└── test_approval_rejection ✅
```

---

## 🏃 Quick Start

### Prerequisites
- **Python 3.11+** and **Node.js 18+**

### Backend
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate     # Windows
pip install -r requirements.txt
pip install greenlet         # Required for async SQLAlchemy
cp ../.env.example .env      # Edit with your settings
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
npm run dev
```

Open **http://localhost:3000** → Register → Create Workspace → Dashboard

### Run Tests
```bash
cd backend
.\venv\Scripts\python.exe -m pytest tests/ -v
```

---

## 🔧 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | `sqlite+aiosqlite:///./ledgerleaf.db` (dev) or PostgreSQL URL |
| `JWT_SECRET_KEY` | Yes | Random secret for JWT tokens |
| `CORS_ORIGINS` | Yes | Comma-separated allowed origins |
| `OPENAI_API_KEY` | No | For AI assistant (works in demo mode without) |
| `NEXT_PUBLIC_API_URL` | Yes | Backend URL for frontend |

---

## 📜 License

MIT License — See [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with ❤️ by <strong>LedgerLeaf AI Team</strong><br/>
  <em>AI proposes. Humans approve.</em>
</p>
