"""Distributed rate limits (Redis) and client IP detection (supports X-Forwarded-For)."""

from __future__ import annotations

import logging

from slowapi import Limiter
from starlette.requests import Request

from app.config.settings import get_settings

logger = logging.getLogger(__name__)


def client_key(request: Request) -> str:
    """Use first X-Forwarded-For hop when behind a reverse proxy."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip() or "unknown"
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def create_limiter(*, redis_url: str | None) -> Limiter:
    kw: dict = {"key_func": client_key}
    if redis_url:
        kw["storage_uri"] = redis_url
        logger.info("Rate limiting storage: Redis")
    else:
        logger.warning("REDIS_URL empty — rate limits use in-memory storage (per process)")
    return Limiter(**kw)


settings = get_settings()
limiter = create_limiter(redis_url=settings.redis_url)
