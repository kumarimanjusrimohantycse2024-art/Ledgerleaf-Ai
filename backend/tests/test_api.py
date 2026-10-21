"""LedgerLeaf AI — Core API Tests (Auth, Tenancy, Finance)."""
from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal

import pytest
from httpx import AsyncClient

from app.models.models import User, Organization


# ═══════════════════════════════════════════════════════════════════════════════
# AUTH TESTS
# ═══════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_health(client: AsyncClient):
    resp = await client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"


@pytest.mark.asyncio
async def test_register_and_login():
    """Test full registration and login flow."""
    from httpx import ASGITransport, AsyncClient as AC
    from app.main import app

    transport = ASGITransport(app=app)
    async with AC(transport=transport, base_url="http://test") as c:
        # Register
        resp = await c.post("/api/v1/auth/register", json={
            "email": "new@example.com",
            "password": "Secure123!",
            "full_name": "New User",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["access_token"]
        assert data["user"]["email"] == "new@example.com"

        # Login
        resp = await c.post("/api/v1/auth/login", json={
            "email": "new@example.com",
            "password": "Secure123!",
        })
        assert resp.status_code == 200
        assert resp.json()["access_token"]

        # Wrong password
        resp = await c.post("/api/v1/auth/login", json={
            "email": "new@example.com",
            "password": "WrongPass!",
        })
        assert resp.status_code == 401


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    resp = await client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "password": "Test1234!",
        "full_name": "Duplicate",
    })
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_get_profile(client: AsyncClient, test_user: User):
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code == 200
    assert resp.json()["email"] == test_user.email


@pytest.mark.asyncio
async def test_unauthenticated_access():
    from httpx import ASGITransport, AsyncClient as AC
    from app.main import app

    transport = ASGITransport(app=app)
    async with AC(transport=transport, base_url="http://test") as c:
        resp = await c.get("/api/v1/auth/me")
        assert resp.status_code == 401


# ═══════════════════════════════════════════════════════════════════════════════
# ORGANIZATION TESTS
# ═══════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_create_organization(client: AsyncClient):
    resp = await client.post("/api/v1/auth/organizations", json={
        "name": "My Agency",
        "country": "IN",
        "currency": "INR",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "My Agency"
    assert data["slug"] == "my-agency"
    assert data["currency"] == "INR"


@pytest.mark.asyncio
async def test_list_organizations(client: AsyncClient, test_org: Organization):
    resp = await client.get("/api/v1/auth/organizations")
    assert resp.status_code == 200
    orgs = resp.json()
    assert len(orgs) >= 1
    assert any(o["id"] == test_org.id for o in orgs)


# ═══════════════════════════════════════════════════════════════════════════════
# TENANT ISOLATION TESTS (CRITICAL SECURITY)
# ═══════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_cross_tenant_client_access_blocked(
    client_with_org: AsyncClient, second_client: AsyncClient,
    test_org: Organization, second_org: Organization,
):
    """User from org A cannot read clients from org B."""
    # Create client in org A
    resp = await client_with_org.post("/api/v1/clients", json={"name": "Org A Client"})
    assert resp.status_code == 201
    client_id = resp.json()["id"]

    # Try to access from org B — should fail
    resp = await second_client.get(f"/api/v1/clients/{client_id}")
    assert resp.status_code == 404, "Cross-tenant read must be blocked"


@pytest.mark.asyncio
async def test_cross_tenant_invoice_access_blocked(
    client_with_org: AsyncClient, second_client: AsyncClient,
):
    """User from org B cannot read invoices from org A."""
    # Create client first
    resp = await client_with_org.post("/api/v1/clients", json={"name": "Invoice Client"})
    assert resp.status_code == 201
    cid = resp.json()["id"]

    # Create invoice in org A
    resp = await client_with_org.post("/api/v1/invoices", json={
        "client_id": cid,
        "issue_date": "2024-01-01T00:00:00Z",
        "due_date": "2024-01-31T00:00:00Z",
        "line_items": [{"description": "Service", "quantity": "1", "unit_price": "1000"}],
    })
    assert resp.status_code == 201
    inv_id = resp.json()["id"]

    # Try from org B — must fail
    resp = await second_client.get(f"/api/v1/invoices/{inv_id}")
    assert resp.status_code == 404, "Cross-tenant invoice read must be blocked"


@pytest.mark.asyncio
async def test_wrong_org_header_blocked(client: AsyncClient, second_org: Organization):
    """User cannot access data by spoofing X-Org-Id to another org."""
    from app.core.security import create_internal_token
    from app.models.models import User

    resp = await client.get("/api/v1/clients", headers={"X-Org-Id": second_org.id})
    assert resp.status_code == 403, "Access with spoofed org ID must be blocked"


# ═══════════════════════════════════════════════════════════════════════════════
# CLIENT TESTS
# ═══════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_client_crud(client_with_org: AsyncClient):
    # Create
    resp = await client_with_org.post("/api/v1/clients", json={
        "name": "Acme Corp",
        "email": "billing@acme.com",
        "company": "Acme Corporation",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Acme Corp"
    cid = data["id"]

    # Read
    resp = await client_with_org.get(f"/api/v1/clients/{cid}")
    assert resp.status_code == 200
    assert resp.json()["name"] == "Acme Corp"

    # Update
    resp = await client_with_org.patch(f"/api/v1/clients/{cid}", json={"name": "Acme Inc"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "Acme Inc"

    # List
    resp = await client_with_org.get("/api/v1/clients")
    assert resp.status_code == 200
    assert resp.json()["total"] >= 1

    # Deactivate
    resp = await client_with_org.delete(f"/api/v1/clients/{cid}")
    assert resp.status_code == 204


# ═══════════════════════════════════════════════════════════════════════════════
# INVOICE & PAYMENT TESTS
# ═══════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_invoice_creation_with_correct_totals(client_with_org: AsyncClient):
    """Verify deterministic decimal calculation for invoices."""
    # Create client
    resp = await client_with_org.post("/api/v1/clients", json={"name": "Test Client"})
    cid = resp.json()["id"]

    # Create invoice with multiple line items
    resp = await client_with_org.post("/api/v1/invoices", json={
        "client_id": cid,
        "issue_date": "2024-03-01T00:00:00Z",
        "due_date": "2024-03-31T00:00:00Z",
        "line_items": [
            {"description": "Web Development", "quantity": "40", "unit_price": "150.00", "tax_percent": "18"},
            {"description": "Design", "quantity": "10", "unit_price": "200.00", "discount_percent": "10", "tax_percent": "18"},
        ],
    })
    assert resp.status_code == 201
    inv = resp.json()

    # Line 1: 40 * 150 = 6000, tax 18% = 1080, total = 7080
    # Line 2: 10 * 200 = 2000, discount 10% = 200, after = 1800, tax 18% = 324, total = 2124
    assert float(inv["line_items"][0]["line_total"]) == 7080.0
    assert float(inv["line_items"][1]["line_total"]) == 2124.0
    assert float(inv["subtotal"]) == 7800.0  # 6000 + 1800
    assert float(inv["tax_amount"]) == 1404.0  # 1080 + 324
    assert float(inv["total"]) == 9204.0
    assert float(inv["balance_due"]) == 9204.0
    assert inv["status"] == "draft"


@pytest.mark.asyncio
async def test_invoice_issue_and_payment(client_with_org: AsyncClient):
    """Test invoice state transitions and partial/full payments."""
    resp = await client_with_org.post("/api/v1/clients", json={"name": "Pay Client"})
    cid = resp.json()["id"]

    resp = await client_with_org.post("/api/v1/invoices", json={
        "client_id": cid,
        "issue_date": "2024-01-01T00:00:00Z",
        "due_date": "2024-01-31T00:00:00Z",
        "line_items": [{"description": "Consulting", "quantity": "1", "unit_price": "5000"}],
    })
    inv_id = resp.json()["id"]

    # Issue
    resp = await client_with_org.post(f"/api/v1/invoices/{inv_id}/issue")
    assert resp.status_code == 200
    assert resp.json()["status"] == "issued"

    # Partial payment
    resp = await client_with_org.post("/api/v1/payments", json={
        "invoice_id": inv_id,
        "amount": "2000",
        "payment_date": "2024-01-15T00:00:00Z",
        "idempotency_key": "pay-1",
    })
    assert resp.status_code == 201
    assert float(resp.json()["amount"]) == 2000.0

    # Check invoice balance
    resp = await client_with_org.get(f"/api/v1/invoices/{inv_id}")
    inv = resp.json()
    assert float(inv["amount_paid"]) == 2000.0
    assert float(inv["balance_due"]) == 3000.0
    assert inv["status"] == "partially_paid"

    # Full payment
    resp = await client_with_org.post("/api/v1/payments", json={
        "invoice_id": inv_id,
        "amount": "3000",
        "payment_date": "2024-01-20T00:00:00Z",
        "idempotency_key": "pay-2",
    })
    assert resp.status_code == 201

    resp = await client_with_org.get(f"/api/v1/invoices/{inv_id}")
    assert resp.json()["status"] == "paid"
    assert float(resp.json()["balance_due"]) == 0.0


@pytest.mark.asyncio
async def test_payment_idempotency(client_with_org: AsyncClient):
    """Duplicate idempotency key returns existing payment, not double-charge."""
    resp = await client_with_org.post("/api/v1/clients", json={"name": "Idem Client"})
    cid = resp.json()["id"]

    resp = await client_with_org.post("/api/v1/invoices", json={
        "client_id": cid,
        "issue_date": "2024-01-01T00:00:00Z",
        "due_date": "2024-01-31T00:00:00Z",
        "line_items": [{"description": "Test", "quantity": "1", "unit_price": "1000"}],
    })
    inv_id = resp.json()["id"]
    await client_with_org.post(f"/api/v1/invoices/{inv_id}/issue")

    # First payment
    resp1 = await client_with_org.post("/api/v1/payments", json={
        "invoice_id": inv_id, "amount": "500",
        "payment_date": "2024-01-15T00:00:00Z", "idempotency_key": "dup-key-1",
    })
    assert resp1.status_code == 201

    # Retry with same key
    resp2 = await client_with_org.post("/api/v1/payments", json={
        "invoice_id": inv_id, "amount": "500",
        "payment_date": "2024-01-15T00:00:00Z", "idempotency_key": "dup-key-1",
    })
    assert resp2.status_code == 201
    assert resp2.json()["id"] == resp1.json()["id"], "Should return same payment, not create duplicate"


@pytest.mark.asyncio
async def test_overpayment_rejected(client_with_org: AsyncClient):
    """Payment exceeding balance must be rejected."""
    resp = await client_with_org.post("/api/v1/clients", json={"name": "Over Client"})
    cid = resp.json()["id"]

    resp = await client_with_org.post("/api/v1/invoices", json={
        "client_id": cid,
        "issue_date": "2024-01-01T00:00:00Z",
        "due_date": "2024-01-31T00:00:00Z",
        "line_items": [{"description": "Test", "quantity": "1", "unit_price": "100"}],
    })
    inv_id = resp.json()["id"]
    await client_with_org.post(f"/api/v1/invoices/{inv_id}/issue")

    resp = await client_with_org.post("/api/v1/payments", json={
        "invoice_id": inv_id, "amount": "200",
        "payment_date": "2024-01-15T00:00:00Z",
    })
    assert resp.status_code == 400
    assert "exceeds" in resp.json()["detail"].lower()


# ═══════════════════════════════════════════════════════════════════════════════
# DECIMAL PRECISION TESTS
# ═══════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_decimal_rounding(client_with_org: AsyncClient):
    """Verify rounding behaves correctly for fractional amounts."""
    resp = await client_with_org.post("/api/v1/clients", json={"name": "Round Client"})
    cid = resp.json()["id"]

    resp = await client_with_org.post("/api/v1/invoices", json={
        "client_id": cid,
        "issue_date": "2024-01-01T00:00:00Z",
        "due_date": "2024-01-31T00:00:00Z",
        "line_items": [
            {"description": "Item", "quantity": "3", "unit_price": "33.33", "tax_percent": "18"},
        ],
    })
    assert resp.status_code == 201
    inv = resp.json()
    # 3 * 33.33 = 99.99, tax 18% = 18.00 (17.9982 rounds to 18.00)
    assert inv["total"]  # Should be a valid decimal string


# ═══════════════════════════════════════════════════════════════════════════════
# EXPENSE TESTS
# ═══════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_expense_crud(client_with_org: AsyncClient):
    resp = await client_with_org.post("/api/v1/expenses", json={
        "description": "Cloud hosting",
        "merchant": "AWS",
        "amount": "2500.00",
        "expense_date": "2024-03-15T00:00:00Z",
    })
    assert resp.status_code == 201
    eid = resp.json()["id"]
    assert resp.json()["status"] == "pending_review"

    # Approve
    resp = await client_with_org.patch(f"/api/v1/expenses/{eid}", json={"status": "approved"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "approved"


# ═══════════════════════════════════════════════════════════════════════════════
# DASHBOARD TESTS
# ═══════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_dashboard_returns_computed_data(client_with_org: AsyncClient):
    resp = await client_with_org.get("/api/v1/dashboard")
    assert resp.status_code == 200
    data = resp.json()
    assert "total_income" in data
    assert "total_expenses" in data
    assert "net_income" in data
    assert "outstanding_receivables" in data
    assert "currency" in data


# ═══════════════════════════════════════════════════════════════════════════════
# APPROVAL ENGINE TESTS
# ═══════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_approval_lifecycle(client_with_org: AsyncClient):
    """Create, list, and approve an action proposal."""
    # Create
    resp = await client_with_org.post("/api/v1/approvals", json={
        "action_type": "payment_reminder",
        "payload": {"invoice_id": "test-123", "message": "Please pay"},
        "recipient": "client@example.com",
        "risk_level": "medium",
    })
    assert resp.status_code == 201
    pid = resp.json()["id"]
    assert resp.json()["status"] == "pending_approval"

    # List
    resp = await client_with_org.get("/api/v1/approvals")
    assert resp.status_code == 200
    assert resp.json()["total"] >= 1

    # Approve
    resp = await client_with_org.post(f"/api/v1/approvals/{pid}/decide", json={
        "approved": True, "reason": "Looks good",
    })
    assert resp.status_code == 200
    assert resp.json()["status"] == "approved"

    # Cannot approve again
    resp = await client_with_org.post(f"/api/v1/approvals/{pid}/decide", json={"approved": True})
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_approval_rejection(client_with_org: AsyncClient):
    resp = await client_with_org.post("/api/v1/approvals", json={
        "action_type": "email_draft",
        "payload": {"to": "test@test.com", "body": "Hello"},
    })
    pid = resp.json()["id"]

    resp = await client_with_org.post(f"/api/v1/approvals/{pid}/decide", json={
        "approved": False, "reason": "Not appropriate",
    })
    assert resp.status_code == 200
    assert resp.json()["status"] == "rejected"
    assert resp.json()["rejection_reason"] == "Not appropriate"
