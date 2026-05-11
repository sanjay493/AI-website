"""Article persistence.

All SQL uses SQLAlchemy Core / ORM bound parameters — never interpolate user input into
SQL text. Filters (slug, category, pagination) are passed as bound parameters to avoid
SQL injection.
"""

from __future__ import annotations

import math
from collections.abc import Sequence

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.article_seed import SEED_ROWS
from app.db.models.tables import Article
from app.models.article import ArticlePublic
from app.models.article_requests import ArticleAdminOut, ArticleCreate, ArticleUpdate
from app.utils.pagination import Page, PageMeta


def _split_paragraphs(body: str) -> list[str]:
    chunks = body.split("\n\n")
    return [c.strip() for c in chunks if c.strip()]


def _join_paragraphs(lines: Sequence[str]) -> str:
    return "\n\n".join(p.strip() for p in lines if p.strip())


def _to_public(row: Article) -> ArticlePublic:
    return ArticlePublic(
        slug=row.slug,
        title=row.title,
        excerpt=row.excerpt,
        category=row.category,
        published_at=row.published_at,
        reading_time_minutes=row.reading_time_minutes,
        cover_image_url=row.cover_image_url,
        external_url=row.external_url,
        paragraphs=_split_paragraphs(row.body),
    )


def _to_admin(row: Article) -> ArticleAdminOut:
    pub = _to_public(row)
    return ArticleAdminOut(id=row.id, **pub.model_dump())


class ArticleRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def seed_if_empty(self) -> None:
        total = await self.session.scalar(select(func.count()).select_from(Article))
        if total and total > 0:
            return
        for raw in SEED_ROWS:
            self.session.add(
                Article(
                    slug=str(raw["slug"]),
                    title=str(raw["title"]),
                    excerpt=str(raw["excerpt"]),
                    category=str(raw["category"]),
                    published_at=raw["published_at"],  # type: ignore[arg-type]
                    reading_time_minutes=int(raw["reading_time_minutes"]),
                    body=str(raw["body"]),
                ),
            )

    async def list_page(
        self,
        *,
        category: str | None,
        offset: int,
        limit: int,
    ) -> Page[ArticlePublic]:
        base = select(Article)
        count_sq = select(func.count()).select_from(Article)
        if category is not None:
            base = base.where(Article.category == category)
            count_sq = count_sq.where(Article.category == category)
        total = int(await self.session.scalar(count_sq) or 0)
        pages = math.ceil(total / limit) if limit else 0

        stmt = (
            base.order_by(Article.published_at.desc())
            .offset(offset)
            .limit(limit)
        )
        rows = list((await self.session.scalars(stmt)).all())

        meta = PageMeta(total=total, limit=limit, offset=offset, pages=pages)
        return Page(items=[_to_public(r) for r in rows], meta=meta)

    async def admin_list_page(
        self,
        *,
        category: str | None,
        offset: int,
        limit: int,
    ) -> Page[ArticleAdminOut]:
        base = select(Article)
        count_sq = select(func.count()).select_from(Article)
        if category is not None:
            base = base.where(Article.category == category)
            count_sq = count_sq.where(Article.category == category)
        total = int(await self.session.scalar(count_sq) or 0)
        pages = math.ceil(total / limit) if limit else 0
        stmt = (
            base.order_by(Article.published_at.desc())
            .offset(offset)
            .limit(limit)
        )
        rows = list((await self.session.scalars(stmt)).all())
        meta = PageMeta(total=total, limit=limit, offset=offset, pages=pages)
        return Page(items=[_to_admin(r) for r in rows], meta=meta)

    async def get_by_slug(self, slug: str) -> ArticlePublic | None:
        row = await self.session.scalar(select(Article).where(Article.slug == slug))
        if row is None:
            return None
        return _to_public(row)

    async def get_admin_by_slug(self, slug: str) -> ArticleAdminOut | None:
        row = await self.session.scalar(select(Article).where(Article.slug == slug))
        if row is None:
            return None
        return _to_admin(row)

    async def create(self, data: ArticleCreate) -> ArticleAdminOut:
        row = Article(
            slug=data.slug,
            title=data.title,
            excerpt=data.excerpt,
            category=data.category.value,
            published_at=data.published_at,
            reading_time_minutes=data.reading_time_minutes,
            body=_join_paragraphs(data.paragraphs),
            cover_image_url=data.cover_image_url,
            external_url=data.external_url,
        )
        self.session.add(row)
        try:
            await self.session.flush()
        except IntegrityError as exc:
            raise ValueError("Slug already exists") from exc
        return _to_admin(row)

    async def update(self, slug: str, data: ArticleUpdate) -> ArticleAdminOut | None:
        row = await self.session.scalar(select(Article).where(Article.slug == slug))
        if row is None:
            return None
        if data.title is not None:
            row.title = data.title
        if data.excerpt is not None:
            row.excerpt = data.excerpt
        if data.category is not None:
            row.category = data.category.value
        if data.published_at is not None:
            row.published_at = data.published_at
        if data.reading_time_minutes is not None:
            row.reading_time_minutes = data.reading_time_minutes
        if data.paragraphs is not None:
            row.body = _join_paragraphs(data.paragraphs)
        if data.cover_image_url is not None:
            row.cover_image_url = data.cover_image_url
        if data.external_url is not None:
            row.external_url = data.external_url
        await self.session.flush()
        return _to_admin(row)

    async def delete(self, slug: str) -> bool:
        row = await self.session.scalar(select(Article).where(Article.slug == slug))
        if row is None:
            return False
        await self.session.delete(row)
        await self.session.flush()
        return True


async def seed_articles(session: AsyncSession) -> None:
    repo = ArticleRepository(session)
    await repo.seed_if_empty()
