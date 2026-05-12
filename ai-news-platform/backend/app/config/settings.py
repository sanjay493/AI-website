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

    #: Comma- or newline-separated RSS/Atom URLs (YouTube channel:
    #: https://www.youtube.com/feeds/videos.xml?channel_id=...).
    #: YouTube *trending* (region chart) needs YOUTUBE_API_KEY — see `fetch_youtube_trending`.
    news_ingest_feed_urls: str = (
        "https://arxiv.org/rss/cs.AI,"
        "https://blog.google/technology/ai/rss/,"
        "https://news.google.com/rss/search?q=artificial+intelligence&hl=en-US&gl=US&ceid=US:en,"
        "https://www.youtube.com/feeds/videos.xml?channel_id=UCbfYPyITQ-7l4upoX8nvctg"
    )
    news_ingest_user_agent: str = (
        "AISignalNewsAgent/1.0 (+https://github.com/sanjay493/AI-Website)"
    )

    #: YouTube Data API v3 — enables **regional trending** (chart=mostPopular), not channel RSS.
    youtube_api_key: str | None = None
    youtube_trending_region: str = "US"
    #: Max videos per ingest; set 0 in request to skip trending even if key is set.
    youtube_trending_max_results: int = Field(default=40, ge=0, le=50)
    #: e.g. "28" = Science & Technology; empty / unset = all categories in chart.
    youtube_trending_video_category_id: str | None = Field(default="28")
    #: If True (default), only trending videos whose title/snippet matches AI keywords stay.
    youtube_trending_ai_only: bool = Field(default=True)
    #: Extra comma-/newline-separated substrings matched case-insensitively against
    #: title + short description (after built-in defaults). Empty = defaults only — see ingest.
    youtube_trending_ai_keywords: str = Field(default="")

    #: Shared secret for POST /admin/news-agent/ingest/scheduled (weekly cron on VPS).
    news_ingest_cron_secret: str | None = None

    @field_validator("youtube_api_key", "news_ingest_cron_secret", mode="before")
    @classmethod
    def empty_optional_secret(cls, value: object) -> str | None:
        if value is None:
            return None
        if isinstance(value, str) and value.strip() == "":
            return None
        return str(value).strip()

    @field_validator("youtube_trending_video_category_id", mode="before")
    @classmethod
    def empty_category_id(cls, value: object) -> str | None:
        if value is None:
            return None
        if isinstance(value, str) and value.strip() == "":
            return None
        return str(value).strip()

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
