from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session
from app.deps.auth_deps import require_admin
from app.models.article_requests import (
    ArticleAdminOut,
    ArticleCategory,
    ArticleCreate,
    ArticleUpdate,
)
from app.path_params import SLUG_PATH
from app.rate_limit import limiter
from app.repositories.article_repository import ArticleRepository
from app.utils.pagination import Page

router = APIRouter(
    prefix="/admin/articles",
    tags=["admin-articles"],
    dependencies=[Depends(require_admin)],
)


def get_article_repo(
    session: AsyncSession = Depends(get_async_session),
) -> ArticleRepository:
    return ArticleRepository(session)


@router.get("", response_model=Page[ArticleAdminOut])
@router.get("/", response_model=Page[ArticleAdminOut])
@limiter.limit("200/minute")
async def list_admin_articles(
    request: Request,
    category: ArticleCategory | None = None,
    q: str | None = Query(None, max_length=200, description="Case-insensitive search in title, slug, excerpt, body, external URL"),
    limit: int = Query(50, ge=1, le=250),
    offset: int = Query(0, ge=0),
    repo: ArticleRepository = Depends(get_article_repo),
) -> Page[ArticleAdminOut]:
    cat = category.value if category is not None else None
    search_term = q.strip() if q else None
    return await repo.admin_list_page(
        category=cat,
        offset=offset,
        limit=limit,
        search=search_term,
    )


@router.post("", response_model=ArticleAdminOut, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=ArticleAdminOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("60/minute")
async def create_article(
    request: Request,
    body: ArticleCreate,
    repo: ArticleRepository = Depends(get_article_repo),
) -> ArticleAdminOut:
    try:
        return await repo.create(body)
    except ValueError as exc:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.get("/{slug}", response_model=ArticleAdminOut)
@limiter.limit("200/minute")
async def get_admin_article(
    request: Request,
    slug: SLUG_PATH,
    repo: ArticleRepository = Depends(get_article_repo),
) -> ArticleAdminOut:
    row = await repo.get_admin_by_slug(slug)
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Not found")
    return row


@router.patch("/{slug}", response_model=ArticleAdminOut)
@limiter.limit("120/minute")
async def patch_article(
    request: Request,
    slug: SLUG_PATH,
    body: ArticleUpdate,
    repo: ArticleRepository = Depends(get_article_repo),
) -> ArticleAdminOut:
    row = await repo.update(slug, body)
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Not found")
    return row


@router.delete("/{slug}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("60/minute")
async def delete_article(
    request: Request,
    slug: SLUG_PATH,
    repo: ArticleRepository = Depends(get_article_repo),
) -> Response:
    ok = await repo.delete(slug)
    if not ok:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
