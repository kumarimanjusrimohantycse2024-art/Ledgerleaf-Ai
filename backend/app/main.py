"""LedgerLeaf AI — FastAPI Application Entry Point."""
from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.database import init_db

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    # Create tables (dev only; use Alembic in prod)
    if not settings.is_production:
        await init_db()
    yield


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="AI-powered financial operations platform",
    lifespan=lifespan,
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health Check ─────────────────────────────────────────────────────────────


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "version": "0.1.0",
        "database": "connected",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# ── Global Error Handler ────────────────────────────────────────────────────


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Don't leak internal errors in production
    if settings.is_production:
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})
    return JSONResponse(status_code=500, content={"detail": str(exc)})


# ── Register Routers ────────────────────────────────────────────────────────


from app.api.v1.auth import router as auth_router
from app.api.v1.clients import router as clients_router
from app.api.v1.invoices import router as invoices_router, payments_router
from app.api.v1.expenses import router as expenses_router
from app.api.v1.transactions import router as transactions_router
from app.api.v1.categories import router as categories_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.approvals import router as approvals_router

app.include_router(auth_router, prefix="/api/v1")
app.include_router(clients_router, prefix="/api/v1")
app.include_router(invoices_router, prefix="/api/v1")
app.include_router(payments_router, prefix="/api/v1")
app.include_router(expenses_router, prefix="/api/v1")
app.include_router(transactions_router, prefix="/api/v1")
app.include_router(categories_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")
app.include_router(approvals_router, prefix="/api/v1")
