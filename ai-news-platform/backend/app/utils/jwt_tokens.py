from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

import jwt
from jwt import InvalidTokenError

from app.config.settings import Settings


class AuthTokenError(ValueError):
    pass


def create_access_token(
    settings: Settings,
    *,
    user_id: uuid.UUID,
    email: str,
    role: str,
) -> tuple[str, int]:
    now = datetime.now(timezone.utc)
    exp = now + timedelta(minutes=settings.access_token_expire_minutes)
    ttl = settings.access_token_expire_minutes * 60
    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "typ": "access",
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }
    encoded = jwt.encode(
        payload,
        settings.secret_key,
        algorithm=settings.jwt_algorithm,
    )
    return encoded, ttl


def decode_access_token(settings: Settings, token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.jwt_algorithm],
            options={"require": ["exp", "iat", "sub", "typ"]},
        )
    except InvalidTokenError as exc:
        raise AuthTokenError("Invalid access token") from exc
    if payload.get("typ") != "access":
        raise AuthTokenError("Not an access token")
    return payload
