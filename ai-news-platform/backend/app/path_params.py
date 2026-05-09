"""Shared FastAPI path/query parameter types."""

from typing import Annotated

from fastapi import Path

SLUG_PATH = Annotated[
    str,
    Path(
        min_length=2,
        max_length=220,
        pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$",
        description="Lowercase slug: letters, numbers, single hyphens.",
    ),
]
