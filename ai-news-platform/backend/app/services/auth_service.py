from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.settings import Settings
from app.db.models.tables import (
    PasswordResetToken,
    RefreshToken,
    User,
    UserRole,
)
from app.schemas.auth import TokenPairResponse, UserPublic, UserRoleOut
from app.utils.jwt_tokens import AuthTokenError, create_access_token, decode_access_token
from app.utils.random_tokens import issue_opaque_token
from app.utils.security import hash_password, verify_password
from app.utils.token_hash import hash_opaque

logger = logging.getLogger(__name__)


class AuthService:
    def __init__(self, session: AsyncSession, settings: Settings):
        self.session = session
        self.settings = settings

    async def register(
        self, *, email: str, password: str, full_name: str | None
    ) -> TokenPairResponse:
        normalized = email.strip().casefold()
        existing = await self.session.scalar(
            select(User.id).where(User.email == normalized)
        )
        if existing:
            raise ValueError("Email already registered")

        role = UserRole.user
        raw_admin = self.settings.first_admin_email
        if raw_admin and normalized == raw_admin.strip().casefold():
            role = UserRole.admin

        user = User(
            email=normalized,
            hashed_password=hash_password(password),
            full_name=(full_name.strip() if full_name else None),
            role=role,
            is_active=True,
        )
        self.session.add(user)

        try:
            await self.session.flush()
        except IntegrityError as exc:
            await self.session.rollback()
            raise ValueError("Email already registered") from exc

        return await self._issue_tokens(user)

    async def login(self, *, email: str, password: str) -> TokenPairResponse:
        normalized = email.strip().casefold()
        user = await self.session.scalar(
            select(User).where(User.email == normalized),
        )
        if user is None or not verify_password(password, user.hashed_password):
            raise ValueError("Invalid email or password")
        if not user.is_active:
            raise PermissionError("Account inactive")

        await self._revoke_refresh_tokens(user.id)
        return await self._issue_tokens(user)

    async def refresh(self, *, refresh_token: str) -> TokenPairResponse:
        token_hash = hash_opaque(refresh_token)

        row = await self.session.scalar(
            select(RefreshToken).where(
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked_at.is_(None),
                RefreshToken.expires_at > datetime.now(timezone.utc),
            ),
        )
        if row is None:
            raise ValueError("Invalid refresh token")

        user = await self.session.get(User, row.user_id)
        if user is None or not user.is_active:
            raise PermissionError("Account inactive")

        await self.session.delete(row)
        await self.session.flush()

        return await self._issue_tokens(user)

    async def logout(self, *, refresh_token: str) -> None:
        token_hash = hash_opaque(refresh_token)
        now = datetime.now(timezone.utc)
        await self.session.execute(
            update(RefreshToken)
            .where(
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked_at.is_(None),
            )
            .values(revoked_at=now),
        )

    async def forgot_password(self, *, email: str) -> None:
        normalized = email.strip().casefold()
        user = await self.session.scalar(select(User).where(User.email == normalized))
        if user is None:
            return

        await self.session.execute(
            delete(PasswordResetToken).where(PasswordResetToken.user_id == user.id),
        )

        raw = issue_opaque_token(48)
        expires = datetime.now(timezone.utc) + timedelta(
            minutes=self.settings.password_reset_expire_minutes,
        )

        reset = PasswordResetToken(
            user_id=user.id,
            token_hash=hash_opaque(raw),
            expires_at=expires,
            used_at=None,
        )
        self.session.add(reset)
        await self.session.flush()

        reset_url = (
            f"{self.settings.frontend_base_url.rstrip('/')}"
            f"/auth/reset-password?token={raw}"
        )
        if self.settings.debug:
            logger.warning(
                "Password reset URL for %s (development — add SMTP before prod): %s",
                normalized,
                reset_url,
            )

    async def reset_password(self, *, token: str, new_password: str) -> None:
        token_hash = hash_opaque(token)
        now = datetime.now(timezone.utc)

        row = await self.session.scalar(
            select(PasswordResetToken).where(
                PasswordResetToken.token_hash == token_hash,
                PasswordResetToken.used_at.is_(None),
                PasswordResetToken.expires_at > now,
            ),
        )
        if row is None:
            raise ValueError("Invalid or expired reset token")

        user = await self.session.get(User, row.user_id)
        if user is None:
            raise ValueError("Invalid or expired reset token")

        user.hashed_password = hash_password(new_password)
        row.used_at = now
        await self._revoke_refresh_tokens(user.id)
        await self.session.flush()

    async def get_user(self, user_id: uuid.UUID) -> User | None:
        return await self.session.get(User, user_id)

    async def me_from_access_token(self, access_token: str) -> UserPublic:
        try:
            payload = decode_access_token(self.settings, access_token)
        except AuthTokenError as exc:
            raise ValueError("Invalid access token") from exc

        user_id = uuid.UUID(payload["sub"])
        user = await self.get_user(user_id)
        if user is None or not user.is_active:
            raise ValueError("User not found")

        return UserPublic(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=UserRoleOut(user.role.value),
            is_active=user.is_active,
            created_at=user.created_at,
        )

    async def _issue_tokens(self, user: User) -> TokenPairResponse:
        access, ttl = create_access_token(
            self.settings,
            user_id=user.id,
            email=user.email,
            role=user.role.value,
        )

        refresh_raw = issue_opaque_token(64)
        refresh_expires = datetime.now(timezone.utc) + timedelta(
            days=self.settings.refresh_token_expire_days,
        )

        self.session.add(
            RefreshToken(
                user_id=user.id,
                token_hash=hash_opaque(refresh_raw),
                expires_at=refresh_expires,
                revoked_at=None,
            ),
        )
        await self.session.flush()

        return TokenPairResponse(
            access_token=access,
            refresh_token=refresh_raw,
            expires_in=ttl,
        )

    async def _revoke_refresh_tokens(self, user_id: uuid.UUID) -> None:
        now = datetime.now(timezone.utc)
        await self.session.execute(
            update(RefreshToken)
            .where(
                RefreshToken.user_id == user_id,
                RefreshToken.revoked_at.is_(None),
            )
            .values(revoked_at=now),
        )
