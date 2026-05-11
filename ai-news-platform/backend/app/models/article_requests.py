from __future__ import annotations

import re
import uuid
from datetime import date
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

_SLUG_RX = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


class ArticleCategory(str, Enum):
    news = "news"
    articles = "articles"
    tutorials = "tutorials"
    trends = "trends"


_MAX_PARAS = 150
_MAX_PARA_CHARS = 50_000


class ArticleCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    slug: str = Field(min_length=2, max_length=220)
    title: str = Field(min_length=1, max_length=500)
    excerpt: str = Field(min_length=1, max_length=5000)
    category: ArticleCategory
    published_at: date
    reading_time_minutes: int = Field(ge=1, le=240)
    paragraphs: list[str] = Field(min_length=1)
    cover_image_url: str | None = Field(default=None, max_length=2048)
    external_url: str | None = Field(default=None, max_length=2048)

    @field_validator("slug")
    @classmethod
    def slug_format(cls, value: str) -> str:
        v = value.strip().casefold()
        if not _SLUG_RX.fullmatch(v):
            raise ValueError(
                "Slug must be lowercase letters, numbers, and single hyphens",
            )
        return v

    @field_validator("category", mode="before")
    @classmethod
    def category_lowercase(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip().casefold()
        return value

    @field_validator("paragraphs")
    @classmethod
    def paragraphs_valid(cls, value: list[str]) -> list[str]:
        cleaned = [p.strip() for p in value if p.strip()]
        if not cleaned:
            raise ValueError("At least one non-empty paragraph is required")
        if len(cleaned) > _MAX_PARAS:
            raise ValueError(f"At most {_MAX_PARAS} paragraphs allowed")
        for i, p in enumerate(cleaned):
            if len(p) > _MAX_PARA_CHARS:
                raise ValueError(
                    f"Paragraph {i + 1} exceeds maximum length ({_MAX_PARA_CHARS} characters)",
                )
        return cleaned


class ArticleUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    title: str | None = Field(default=None, min_length=1, max_length=500)
    excerpt: str | None = Field(default=None, min_length=1, max_length=5000)
    category: ArticleCategory | None = None
    published_at: date | None = None
    reading_time_minutes: int | None = Field(default=None, ge=1, le=240)
    paragraphs: list[str] | None = None
    cover_image_url: str | None = Field(default=None, max_length=2048)
    external_url: str | None = Field(default=None, max_length=2048)

    @model_validator(mode="after")
    def at_least_one_field(self) -> ArticleUpdate:
        if not self.model_fields_set:
            raise ValueError("Provide at least one field to update")
        return self

    @field_validator("category", mode="before")
    @classmethod
    def category_lowercase_optional(cls, value: object) -> object:
        if value is None:
            return None
        if isinstance(value, str):
            return value.strip().casefold()
        return value

    @field_validator("paragraphs")
    @classmethod
    def paragraphs_optional(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return None
        cleaned = [p.strip() for p in value if p.strip()]
        if not cleaned:
            raise ValueError("paragraphs cannot be empty when provided")
        if len(cleaned) > _MAX_PARAS:
            raise ValueError(f"At most {_MAX_PARAS} paragraphs allowed")
        for i, p in enumerate(cleaned):
            if len(p) > _MAX_PARA_CHARS:
                raise ValueError(
                    f"Paragraph {i + 1} exceeds maximum length ({_MAX_PARA_CHARS} characters)",
                )
        return cleaned


class ArticleAdminOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    slug: str
    title: str
    excerpt: str
    category: str
    published_at: date
    reading_time_minutes: int
    paragraphs: list[str]
    cover_image_url: str | None = None
    external_url: str | None = None
