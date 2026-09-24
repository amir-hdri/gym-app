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
