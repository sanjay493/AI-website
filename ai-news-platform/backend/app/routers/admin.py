from fastapi import APIRouter, Depends, Request

from app.deps.auth_deps import require_admin
from app.db.models.tables import User
from app.rate_limit import limiter

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/status")
@limiter.limit("120/minute")
async def admin_status(
    request: Request,
    admin: User = Depends(require_admin),
) -> dict[str, bool | str]:
    return {"ok": True, "email": admin.email, "role": admin.role.value}
