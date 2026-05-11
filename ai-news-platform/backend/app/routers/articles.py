from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session
from app.models.article import ArticleListItem, ArticlePublic
from app.models.article_requests import ArticleCategory
from app.path_params import SLUG_PATH
from app.rate_limit import limiter
from app.repositories.article_repository import ArticleRepository
from app.utils.pagination import Page

router = APIRouter()


def get_article_repo(
    session: AsyncSession = Depends(get_async_session),
) -> ArticleRepository:
    return ArticleRepository(session)


@router.get("", response_model=Page[ArticleListItem])
@router.get("/", response_model=Page[ArticleListItem])
@limiter.limit("120/minute")
async def list_articles(
    request: Request,
    category: ArticleCategory | None = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    repo: ArticleRepository = Depends(get_article_repo),
) -> Page[ArticleListItem]:
    cat = category.value if category is not None else None
    page = await repo.list_page(category=cat, offset=offset, limit=limit)
    return Page(
        items=[
            ArticleListItem.model_validate(a.model_dump(exclude={"paragraphs"}))
            for a in page.items
        ],
        meta=page.meta,
    )


@router.get("/{slug}", response_model=ArticlePublic)
@limiter.limit("120/minute")
async def get_article(
    request: Request,
    slug: SLUG_PATH,
    repo: ArticleRepository = Depends(get_article_repo),
) -> ArticlePublic:
    article = await repo.get_by_slug(slug)
    if article is None:
        raise HTTPException(status_code=404, detail="Article not found")
    return article
