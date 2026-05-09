from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class ArticleListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    slug: str
    title: str
    excerpt: str
    category: str
    published_at: date
    reading_time_minutes: int = Field(ge=1)


class ArticlePublic(ArticleListItem):
    paragraphs: list[str] = Field(default_factory=list)
