"""Pytest fixtures: test app without DB lifespan, optional dependency overrides."""

from __future__ import annotations

import os
from collections.abc import Iterator
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

# Encourage in-memory rate limits and avoid TrustedHost surprises before app imports.
os.environ.setdefault("REDIS_URL", "")
os.environ.setdefault("ALLOWED_HOSTS", "")

from app.config.settings import get_settings  # noqa: E402
from app.db.session import get_async_session  # noqa: E402
from app.main import create_app  # noqa: E402
from app.routers import admin_articles, articles  # noqa: E402
from tests.fakes import fake_admin_repo, fake_public_repo  # noqa: E402


@pytest.fixture(autouse=True)
def _clear_settings_cache() -> Iterator[None]:
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
def api_app(monkeypatch: pytest.MonkeyPatch):
    """FastAPI app with DB lifespan disabled and fake article repositories."""
    monkeypatch.setenv("REDIS_URL", "")
    monkeypatch.setenv("ALLOWED_HOSTS", "")
    get_settings.cache_clear()

    application = create_app(enable_lifespan=False)
    application.dependency_overrides[articles.get_article_repo] = fake_public_repo
    application.dependency_overrides[admin_articles.get_article_repo] = fake_admin_repo
    try:
        yield application
    finally:
        application.dependency_overrides.clear()


@pytest.fixture
def client(api_app):
    """Sync TestClient against the ASGI app (no live server)."""
    with TestClient(api_app, base_url="http://test") as test_client:
        yield test_client


async def _noop_session() -> Any:
    mock = MagicMock(spec=AsyncSession)
    mock.get = AsyncMock(return_value=None)
    yield mock  # type: ignore[misc]


@pytest.fixture
def client_with_mock_session(api_app):
    """Client with async DB session mocked (for auth routes that resolve the session)."""
    api_app.dependency_overrides[get_async_session] = _noop_session
    try:
        with TestClient(api_app, base_url="http://test") as test_client:
            yield test_client
    finally:
        api_app.dependency_overrides.pop(get_async_session, None)
