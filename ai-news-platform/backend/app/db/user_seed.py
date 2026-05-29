"""Initial admin user when DB is empty."""

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.settings import get_settings
from app.db.models.tables import User, UserRole
from app.utils.security import hash_password


async def seed_admin_user(session: AsyncSession) -> None:
    """Create initial admin user if none exist and FIRST_ADMIN_EMAIL is configured."""
    settings = get_settings()
    
    # Check if any users exist
    total = await session.scalar(select(func.count()).select_from(User))
    if total and total > 0:
        return  # Users already exist
    
    # Only proceed if admin email is configured
    if not settings.first_admin_email:
        return
    
    # Create admin user with a temporary password
    # In production, the admin should reset password on first login
    admin_email = settings.first_admin_email.strip().casefold()
    temp_password = "ChangeMe123!"  # Temporary - admin must reset on first login
    
    admin_user = User(
        email=admin_email,
        hashed_password=hash_password(temp_password),
        full_name="Admin",
        role=UserRole.admin,
        is_active=True,
    )
    
    session.add(admin_user)
    await session.flush()
