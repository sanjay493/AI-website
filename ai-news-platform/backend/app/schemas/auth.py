import uuid
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, EmailStr, Field


class UserRoleOut(str, Enum):
    user = "user"
    admin = "admin"


class UserPublic(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    email: EmailStr
    full_name: str | None = None
    role: UserRoleOut
    is_active: bool
    created_at: datetime


class MessageResponse(BaseModel):
    detail: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    full_name: str | None = Field(default=None, max_length=200)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=72)


class TokenPairResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=10, max_length=2048)
    new_password: str = Field(min_length=8, max_length=72)


class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=10, max_length=2048)


class LogoutRequest(BaseModel):
    refresh_token: str = Field(min_length=10, max_length=2048)
