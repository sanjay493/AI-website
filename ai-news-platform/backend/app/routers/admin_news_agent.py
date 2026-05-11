import hmac

from fastapi import APIRouter, Body, Depends, Header, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.news_ingest import run_news_ingest
from app.db.models.tables import User
from app.db.session import get_async_session
from app.deps.auth_deps import require_admin
from app.config.settings import get_settings
from app.rate_limit import limiter
from app.repositories.article_repository import ArticleRepository

router = APIRouter(
    prefix="/admin/news-agent",
    tags=["admin-news-agent"],
)


def get_article_repo(
    session: AsyncSession = Depends(get_async_session),
) -> ArticleRepository:
    return ArticleRepository(session)


class IngestRequestBody(BaseModel):
    """Optional overrides; when empty, server uses env defaults."""

    feed_urls: list[str] | None = None
    max_per_feed: int = Field(default=10, ge=1, le=40)
    include_youtube_trending: bool = True
    #: Cap trending videos (YouTube Data API). 0 = skip trending this run. None = use server default.
    youtube_trending_max: int | None = Field(default=None, ge=0, le=50)


@router.post("/ingest")
@limiter.limit("12/hour")
async def ingest_external_news(
    request: Request,
    body: IngestRequestBody = Body(),
    repo: ArticleRepository = Depends(get_article_repo),
    _admin: User = Depends(require_admin),
) -> dict[str, object]:
    return await run_news_ingest(
        repo,
        feed_urls=body.feed_urls,
        max_per_feed=body.max_per_feed,
        include_youtube_trending=body.include_youtube_trending,
        youtube_trending_max=body.youtube_trending_max,
    )


@router.post("/ingest/scheduled")
@limiter.limit("60/day")
async def ingest_scheduled(
    request: Request,
    body: IngestRequestBody = Body(),
    repo: ArticleRepository = Depends(get_article_repo),
    x_news_ingest_secret: str | None = Header(None, alias="X-News-Ingest-Secret"),
) -> dict[str, object]:
    """Weekly/daily cron: set NEWS_INGEST_CRON_SECRET and call with the same header value."""
    settings = get_settings()
    if not settings.news_ingest_cron_secret:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Not found")
    if x_news_ingest_secret is None or not hmac.compare_digest(
        x_news_ingest_secret,
        settings.news_ingest_cron_secret,
    ):
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Invalid secret")
    return await run_news_ingest(
        repo,
        feed_urls=body.feed_urls,
        max_per_feed=body.max_per_feed,
        include_youtube_trending=body.include_youtube_trending,
        youtube_trending_max=body.youtube_trending_max,
    )
