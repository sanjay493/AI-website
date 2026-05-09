from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "AI Signal API"
    environment: str = "development"
    debug: bool = False
    host: str = "0.0.0.0"
    port: int = 8000
    allowed_hosts: str = Field(
        default="",
        description="Comma-separated hostnames for TrustedHostMiddleware (e.g. api.example.com). Empty disables.",
    )

    cors_origins: str = "http://localhost:3000"

    database_url: str = (
        "postgresql+asyncpg://user:password@localhost:5432/ai_signal"
    )
    redis_url: str = "redis://localhost:6379/0"
    secret_key: str = "change-me-in-development"

    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    password_reset_expire_minutes: int = 60

    frontend_base_url: str = "http://localhost:3000"
    first_admin_email: str | None = None

    jwt_algorithm: str = "HS256"

    @field_validator("first_admin_email", mode="before")
    @classmethod
    def empty_admin_email(cls, value: object) -> str | None:
        if value is None:
            return None
        if isinstance(value, str) and value.strip() == "":
            return None
        if isinstance(value, str):
            return value.strip()
        return str(value)

    @field_validator("environment")
    @classmethod
    def normalize_environment(cls, value: str) -> str:
        return value.strip().lower()

    @property
    def cors_origin_list(self) -> list[str]:
        raw = [chunk.strip() for chunk in self.cors_origins.split(",")]
        return [x for x in raw if x]

    @property
    def allowed_host_list(self) -> list[str]:
        raw = [chunk.strip() for chunk in self.allowed_hosts.split(",")]
        return [x for x in raw if x]


@lru_cache
def get_settings() -> Settings:
    return Settings()
