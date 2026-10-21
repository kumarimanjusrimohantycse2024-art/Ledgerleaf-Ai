"""LedgerLeaf AI — Application Configuration."""
from __future__ import annotations

import os
from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_name: str = "LedgerLeaf AI"
    app_env: Literal["development", "staging", "production"] = "development"
    debug: bool = True
    secret_key: str = "dev-secret-change-in-production"
    cors_origins: str = "http://localhost:3000"

    # Database
    database_url: str = "sqlite+aiosqlite:///./ledgerleaf.db"

    # Supabase Auth
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""

    # AI
    openai_api_key: str = ""
    ai_model: str = "gpt-4o"
    ai_max_tokens: int = 4096
    ai_temperature: float = 0.1
    ai_monthly_limit_per_org: int = 1000

    # Storage
    storage_backend: Literal["local", "s3"] = "local"
    local_storage_path: str = "./uploads"
    s3_bucket: str = ""
    s3_region: str = ""

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Email
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    email_from: str = "noreply@ledgerleaf.ai"

    # Stripe
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def is_sqlite(self) -> bool:
        return "sqlite" in self.database_url


@lru_cache()
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()
