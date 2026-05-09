from math import ceil
from typing import Generic, Sequence, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class PageMeta(BaseModel):
    total: int = Field(ge=0)
    limit: int = Field(ge=1, le=100)
    offset: int = Field(ge=0)
    pages: int = Field(ge=0)


class Page(BaseModel, Generic[T]):
    items: list[T]
    meta: PageMeta


def slice_page(items: Sequence[T], *, offset: int, limit: int) -> Page[T]:
    window = list(items[offset : offset + limit])
    total = len(items)
    pages = ceil(total / limit) if limit else 0
    meta = PageMeta(total=total, limit=limit, offset=offset, pages=pages)
    return Page(items=window, meta=meta)
