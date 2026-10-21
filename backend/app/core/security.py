"""LedgerLeaf AI — Security utilities."""
from __future__ import annotations

import hashlib
import hmac
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt

from app.core.config import get_settings

settings = get_settings()


def generate_uuid() -> str:
    """Generate a new UUID4 string."""
    return str(uuid.uuid4())


def generate_idempotency_key() -> str:
    """Generate a unique idempotency key for retryable operations."""
    return f"idem_{secrets.token_urlsafe(32)}"


def generate_invitation_token() -> str:
    """Generate a secure invitation token."""
    return secrets.token_urlsafe(48)


def hash_payload(payload: str) -> str:
    """Create a SHA-256 hash of a payload for integrity verification."""
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def verify_payload_hash(payload: str, expected_hash: str) -> bool:
    """Verify a payload hash using constant-time comparison."""
    actual_hash = hash_payload(payload)
    return hmac.compare_digest(actual_hash, expected_hash)


def decode_supabase_jwt(token: str) -> dict[str, Any] | None:
    """Decode and verify a Supabase JWT token.

    Returns the decoded payload or None if invalid.
    """
    if not settings.supabase_jwt_secret:
        return None
    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
        return payload
    except JWTError:
        return None


def create_internal_token(user_id: str, org_id: str | None = None, expires_minutes: int = 60) -> str:
    """Create an internal JWT for dev/testing when Supabase is not configured."""
    payload = {
        "sub": user_id,
        "org_id": org_id,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=expires_minutes),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.secret_key, algorithm="HS256")


def decode_internal_token(token: str) -> dict[str, Any] | None:
    """Decode an internal JWT token."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        return payload
    except JWTError:
        return None
