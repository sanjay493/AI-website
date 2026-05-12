"""Test doubles for repositories and session (no database)."""

from __future__ import annotations

from datetime import date
from typing import Any, Sequence

from app.models.article import ArticlePublic
from app.repositories.article_repository import ArticleRepository
from app.utils.pagination import Page, PageMeta


class FakeArticleRepository:
    """Stub article repository for API unit tests."""

    def __init__(self, *, with_article_slug: str | None = None) -> None:
        self.with_article_slug = with_article_slug

    async def list_page(
        self,
        *,
        category: str | None,
        offset: int,
        limit: int,
    ) -> Page[Any]:
        meta = PageMeta(total=0, limit=limit, offset=offset, pages=0)
        return Page(items=[], meta=meta)

    async def get_by_slug(self, slug: str) -> ArticlePublic | None:
        if self.with_article_slug and slug == self.with_article_slug:
            return ArticlePublic(
                slug=slug,
                title="Test",
                excerpt="Excerpt",
                category="news",
                published_at=date(2024, 1, 1),
                reading_time_minutes=5,
                paragraphs=["Hello"],
                cover_image_url=None,
                external_url=None,
            )
        return None

    async def admin_list_page(
        self,
        *,
        category: str | None,
        offset: int,
        limit: int,
        search: str | None = None,
    ) -> Page[Any]:
        meta = PageMeta(total=0, limit=limit, offset=offset, pages=0)
        return Page(items=[], meta=meta)

    async def get_admin_by_slug(self, slug: str) -> Any | None:
        return None

    async def create(self, _data: Any) -> Any:
        raise RuntimeError("not used in basic tests")

    async def update(self, _slug: str, _data: Any) -> Any:
        return None

    async def delete(self, _slug: str) -> bool:
        return False

    async def bulk_delete_by_slugs(self, slugs: Sequence[str]) -> int:
        return len(slugs)


def fake_public_repo() -> ArticleRepository:
    return FakeArticleRepository()  # type: ignore[return-value]


def fake_admin_repo() -> ArticleRepository:
    return FakeArticleRepository()  # type: ignore[return-value]
