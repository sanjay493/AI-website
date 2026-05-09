from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.config.settings import get_settings
from app.db.session import AsyncSessionLocal, engine, init_db
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.rate_limit import limiter
from app.repositories.article_repository import seed_articles
from app.routers import api_router


@asynccontextmanager
async def app_lifespan(_app: FastAPI):
    await init_db()
    async with AsyncSessionLocal() as session:
        try:
            await seed_articles(session)
            await session.commit()
        except Exception:
            await session.rollback()
            raise
    yield
    await engine.dispose()


def create_app(*, enable_lifespan: bool = True) -> FastAPI:
    settings = get_settings()
    application = FastAPI(
        title=settings.app_name,
        lifespan=app_lifespan if enable_lifespan else None,
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
    )
    application.state.limiter = limiter
    application.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    application.add_middleware(SecurityHeadersMiddleware)
    application.add_middleware(SlowAPIMiddleware)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list or ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    if settings.allowed_host_list:
        application.add_middleware(
            TrustedHostMiddleware,
            allowed_hosts=settings.allowed_host_list,
        )

    application.include_router(api_router, prefix="/api/v1")
    return application


app = create_app()
