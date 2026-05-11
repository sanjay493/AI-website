from fastapi import APIRouter

from app.routers import admin, admin_articles, admin_news_agent, articles, auth, health

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router)
api_router.include_router(admin.router)
api_router.include_router(admin_news_agent.router)
api_router.include_router(admin_articles.router)
api_router.include_router(articles.router, prefix="/articles", tags=["articles"])

__all__ = ["api_router"]
