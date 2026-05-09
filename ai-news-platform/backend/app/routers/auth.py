from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.settings import Settings, get_settings
from app.deps.auth_deps import get_current_user
from app.db.models.tables import User
from app.db.session import get_async_session
from app.rate_limit import limiter
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    LogoutRequest,
    MessageResponse,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenPairResponse,
    UserPublic,
    UserRoleOut,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


def get_auth_service(
    session: AsyncSession = Depends(get_async_session),
    settings: Settings = Depends(get_settings),
) -> AuthService:
    return AuthService(session, settings)


def _user_public(row: User) -> UserPublic:
    return UserPublic(
        id=row.id,
        email=row.email,
        full_name=row.full_name,
        role=UserRoleOut(row.role.value),
        is_active=row.is_active,
        created_at=row.created_at,
    )


@router.post("/register", response_model=TokenPairResponse, status_code=201)
@limiter.limit("10/hour")
async def register(
    request: Request,
    body: RegisterRequest,
    auth: AuthService = Depends(get_auth_service),
) -> TokenPairResponse:
    try:
        return await auth.register(
            email=body.email,
            password=body.password,
            full_name=body.full_name,
        )
    except ValueError as exc:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.post("/login", response_model=TokenPairResponse)
@limiter.limit("30/minute")
async def login(
    request: Request,
    body: LoginRequest,
    auth: AuthService = Depends(get_auth_service),
) -> TokenPairResponse:
    try:
        return await auth.login(email=body.email, password=body.password)
    except ValueError as exc:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc
    except PermissionError as exc:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc


@router.post("/refresh", response_model=TokenPairResponse)
@limiter.limit("60/minute")
async def refresh_token(
    request: Request,
    body: RefreshRequest,
    auth: AuthService = Depends(get_auth_service),
) -> TokenPairResponse:
    try:
        return await auth.refresh(refresh_token=body.refresh_token)
    except ValueError as exc:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc
    except PermissionError as exc:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc


@router.post("/logout", response_model=MessageResponse)
@limiter.limit("120/minute")
async def logout(
    request: Request,
    body: LogoutRequest,
    auth: AuthService = Depends(get_auth_service),
) -> MessageResponse:
    await auth.logout(refresh_token=body.refresh_token)
    return MessageResponse(detail="Signed out")


@router.post("/forgot-password", response_model=MessageResponse)
@limiter.limit("5/minute")
async def forgot_password(
    request: Request,
    body: ForgotPasswordRequest,
    auth: AuthService = Depends(get_auth_service),
) -> MessageResponse:
    await auth.forgot_password(email=body.email)
    return MessageResponse(
        detail="If an account exists for that email, a reset link was generated.",
    )


@router.post("/reset-password", response_model=MessageResponse)
@limiter.limit("10/minute")
async def reset_password(
    request: Request,
    body: ResetPasswordRequest,
    auth: AuthService = Depends(get_auth_service),
) -> MessageResponse:
    try:
        await auth.reset_password(token=body.token, new_password=body.new_password)
    except ValueError as exc:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    return MessageResponse(detail="Password updated. Please sign in again.")


@router.get("/me", response_model=UserPublic)
@limiter.limit("120/minute")
async def read_me(
    request: Request,
    current: User = Depends(get_current_user),
) -> UserPublic:
    return _user_public(current)
