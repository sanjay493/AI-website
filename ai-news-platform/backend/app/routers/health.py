from fastapi import APIRouter, Request

from app.rate_limit import limiter

router = APIRouter()


@router.get("/health")
@limiter.limit("300/minute")
def health_check(request: Request) -> dict[str, str]:
    return {"status": "ok"}
