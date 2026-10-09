import os

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./gymapp.db"
    SECRET_KEY: str = Field(default="dev-only-change-me")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS — environment-based origin list (comma-separated)
    CORS_ORIGINS: str = "http://localhost:3000"

    # Environment toggle — controls seeding and error detail in responses
    ENVIRONMENT: str = "development"

    # Rate limiting (simple in-memory, per-minute)
    LOGIN_RATE_LIMIT: int = 5
    FRONTEND_URL: str = "http://localhost:3000"

    # Seed demo data (default admin/coach/athlete credentials) on startup in
    # non-production environments. Local dev seeds by default (ENVIRONMENT
    # defaults to "development"); staging/production-like environments only
    # seed when explicitly opted in via SEED_DEMO_DATA=true, so staging never
    # gets default credentials by accident.
    SEED_DEMO_DATA: bool = False

    # Proxy trust — the login rate limiter keys on client IP. X-Forwarded-For
    # is only honored when this is true (i.e. the app really sits behind a
    # trusted reverse proxy that sets/sanitizes the header). Default false:
    # an attacker can otherwise bypass the limiter by rotating a spoofed
    # X-Forwarded-For on every request.
    TRUST_PROXY: bool = False

    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = ""
    SMTP_STARTTLS: bool = True
    SMTP_SSL: bool = False

    model_config = {"env_file": ".env", "extra": "ignore"}

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"


settings = Settings()

if settings.is_production and settings.SECRET_KEY in ("dev-only-change-me", "change-me", ""):
    raise RuntimeError("SECRET_KEY must be set to a strong random value in production")
if settings.is_production and len(settings.SECRET_KEY) < 32:
    raise RuntimeError("SECRET_KEY must be at least 32 characters in production")
