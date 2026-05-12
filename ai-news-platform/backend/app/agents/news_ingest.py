"""Fetch AI-related items from RSS/Atom feeds (blogs, arXiv, YouTube channel feeds, etc.)."""

from __future__ import annotations

import hashlib
import html
import logging
import re
from collections.abc import Iterable
from dataclasses import dataclass
from datetime import date, datetime, timezone
from email.utils import parsedate_to_datetime
from xml.etree import ElementTree as ET

import httpx

from app.config.settings import get_settings
from app.models.article_requests import ArticleCategory, ArticleCreate
from app.repositories.article_repository import ArticleRepository

log = logging.getLogger(__name__)

_ATOM = "{http://www.w3.org/2005/Atom}"
_TAG = re.compile(r"<[^>]+>")


def _strip_html(raw: str) -> str:
    text = html.unescape(_TAG.sub(" ", raw))
    return re.sub(r"\s+", " ", text).strip()


def _slug_for_url(source_url: str) -> str:
    digest = hashlib.sha256(source_url.encode("utf-8")).hexdigest()[:24]
    return f"feed-{digest}"


def _estimate_reading_minutes(text: str) -> int:
    words = len(re.findall(r"\b\w+\b", text))
    minutes = max(1, (words + 199) // 200)
    return min(240, minutes)


def _parse_date_atom(s: str | None) -> date | None:
    if not s:
        return None
    s = s.strip()
    try:
        if s.endswith("Z"):
            s = s[:-1] + "+00:00"
        return datetime.fromisoformat(s).date()
    except ValueError:
        return None


def _parse_date_rss(s: str | None) -> date | None:
    if not s:
        return None
    try:
        dt = parsedate_to_datetime(s.strip())
        if dt.tzinfo:
            dt = dt.astimezone(timezone.utc)
        return dt.date()
    except (TypeError, ValueError):
        return None


@dataclass
class FeedItem:
    title: str
    link: str
    summary: str
    published: date | None
    thumbnail_url: str | None = None


def parse_feed_xml(xml_bytes: bytes, *, feed_url: str) -> list[FeedItem]:
    try:
        root = ET.fromstring(xml_bytes)
    except ET.ParseError as exc:
        log.warning("XML parse error for %s: %s", feed_url, exc)
        return []

    tag = root.tag.split("}", 1)[-1]

    if tag == "feed":
        return _parse_atom(root)
    if tag == "rss":
        return _parse_rss(root)
    log.warning("Unknown feed root <%s> for %s", tag, feed_url)
    return []


def _parse_atom(feed_el: ET.Element) -> list[FeedItem]:
    out: list[FeedItem] = []
    for entry in feed_el.findall(f"{_ATOM}entry"):
        title_el = entry.find(f"{_ATOM}title")
        title = _strip_html(title_el.text or "") if title_el is not None else ""
        link = ""
        for lk in entry.findall(f"{_ATOM}link"):
            rel = (lk.get("rel") or "alternate").lower()
            href = lk.get("href") or ""
            if rel == "alternate" and href:
                link = href
                break
        if not link:
            for lk in entry.findall(f"{_ATOM}link"):
                href = lk.get("href") or ""
                if href:
                    link = href
                    break
        summary_el = entry.find(f"{_ATOM}summary")
        content_el = entry.find(f"{_ATOM}content")
        raw_summary = ""
        if summary_el is not None and (summary_el.text or summary_el.tail):
            raw_summary = summary_el.text or ""
        elif content_el is not None and content_el.text:
            raw_summary = content_el.text or ""
        summary = _strip_html(raw_summary)[:8000]
        pub_raw = None
        for cand in (entry.find(f"{_ATOM}published"), entry.find(f"{_ATOM}updated")):
            if cand is not None and cand.text:
                pub_raw = cand.text
                break
        pub = _parse_date_atom(pub_raw)
        if title or link:
            out.append(
                FeedItem(
                    title=title or "Untitled",
                    link=link,
                    summary=summary,
                    published=pub,
                ),
            )
    return out


def _parse_rss(rss_el: ET.Element) -> list[FeedItem]:
    out: list[FeedItem] = []
    channel = rss_el.find("channel")
    if channel is None:
        return out
    for item in channel.findall("item"):
        title_el = item.find("title")
        link_el = item.find("link")
        desc_el = item.find("description")
        pub_el = item.find("pubDate")

        title = _strip_html(title_el.text or "") if title_el is not None else ""
        link = (link_el.text or "").strip() if link_el is not None else ""
        desc = _strip_html(desc_el.text or "") if desc_el is not None else ""
        pub = _parse_date_rss(pub_el.text if pub_el is not None else None)
        summary = desc[:8000]
        if title or link:
            out.append(
                FeedItem(
                    title=title or "Untitled",
                    link=link,
                    summary=summary,
                    published=pub,
                ),
            )
    return out


def _is_youtube_watch(url: str) -> bool:
    u = url.lower()
    return "youtube.com/watch" in u or "youtu.be/" in u


def _youtube_thumbnail_from_snippet(sn: dict) -> str | None:
    thumbs = sn.get("thumbnails")
    if not isinstance(thumbs, dict):
        return None
    for key in ("maxres", "standard", "high", "medium", "default"):
        t = thumbs.get(key)
        if isinstance(t, dict) and t.get("url"):
            return str(t["url"])[:2048]
    return None


def _compact_youtube_description(desc: str, max_len: int = 320) -> str:
    """First meaningful lines; avoid full description / credits wall."""
    if not desc or not desc.strip():
        return ""
    lines_out: list[str] = []
    for raw in desc.splitlines():
        s = raw.strip()
        if not s:
            if lines_out:
                break
            continue
        low = s.lower()
        if s.startswith(("#", "@", "▶")) or s.startswith(("http://", "https://")):
            if lines_out:
                break
            continue
        if "subscribe" in low and len(s) < 140:
            break
        lines_out.append(s)
        if len(" ".join(lines_out)) >= max_len:
            break
    text = " ".join(lines_out).strip()
    if len(text) > max_len:
        text = text[: max_len - 1].rsplit(" ", 1)[0] + "…"
    return text


def _short_card_excerpt(text: str, fallback: str, max_chars: int = 360) -> str:
    t = (text or "").strip()
    if not t:
        t = fallback.strip()
    if len(t) <= max_chars:
        return t
    return t[: max_chars - 1].rsplit(" ", 1)[0] + "…"


def _clean_youtube_title(title: str) -> str:
    return re.sub(r"^\[YouTube trending\]\s*", "", title, flags=re.I).strip() or title


def _to_article_create(item: FeedItem) -> ArticleCreate | None:
    if not item.link or not item.link.startswith(("http://", "https://")):
        return None
    slug = _slug_for_url(item.link)
    title = _clean_youtube_title(item.title.strip()[:500]) or "Untitled"
    is_yt = _is_youtube_watch(item.link)

    if is_yt:
        excerpt = _short_card_excerpt(item.summary.strip(), title, 360)
        if not excerpt:
            excerpt = title
        excerpt = excerpt[:5000]
        paras = [
            excerpt,
            f"Watch on YouTube: {item.link}",
        ]
        rtm = max(1, min(5, _estimate_reading_minutes("\n\n".join(paras))))
        return ArticleCreate(
            slug=slug,
            title=title,
            excerpt=excerpt,
            category=ArticleCategory.news,
            published_at=item.published or date.today(),
            reading_time_minutes=rtm,
            paragraphs=paras,
            cover_image_url=item.thumbnail_url,
            external_url=item.link,
        )

    summary = item.summary.strip()
    if not summary:
        summary = title
    excerpt = summary[:4900]
    pub = item.published or date.today()
    body_text = f"{summary}\n\n{item.link}"
    rtm = _estimate_reading_minutes(body_text)
    paras = [
        summary if summary else title,
        f"Open the original: {item.link}",
    ]
    return ArticleCreate(
        slug=slug,
        title=title,
        excerpt=excerpt,
        category=ArticleCategory.news,
        published_at=pub,
        reading_time_minutes=rtm,
        paragraphs=paras,
        cover_image_url=item.thumbnail_url,
        external_url=None,
    )


def _split_feed_urls(raw: str) -> list[str]:
    parts: list[str] = []
    for chunk in re.split(r"[\n,]", raw):
        u = chunk.strip()
        if u:
            parts.append(u)
    return parts


_BUILTIN_YOUTUBE_AI_SUBSTRINGS: tuple[str, ...] = tuple(
    needle.casefold()
    for needle in (
        "artificial intelligence",
        "machine learning",
        "deep learning",
        "neural network",
        "large language model",
        "language model",
        "generative ai",
        "generative artificial",
        "gen ai",
        "foundation model",
        "multimodal model",
        "computer vision",
        "natural language",
        "nlp",
        "semi-supervised",
        "unsupervised learning",
        "reinforcement learning",
        "diffusion model",
        "openai",
        "chatgpt",
        "gpt-4",
        "gpt 4",
        "gpt-3",
        "gpt 3",
        "anthropic",
        "google deepmind",
        "deepmind",
        "mistral ai",
        "mistral",
        "meta ai",
        "llama ",
        "llama2",
        "llama 2",
        "copilot ai",
        "gemini ",
        "pytorch",
        "tensorflow",
    )
)


def _effective_ai_trend_needles(extra_keywords: str) -> tuple[str, ...]:
    """Built-in AI-related substrings plus optional env extra list (case-folded)."""
    custom = tuple(
        p.strip().casefold()
        for p in re.split(r"[\n,]+", extra_keywords.strip())
        if p.strip()
    )
    return _BUILTIN_YOUTUBE_AI_SUBSTRINGS + custom


def youtube_trend_matches_ai_signals(item: FeedItem, needles: Iterable[str]) -> bool:
    """True if title or compact summary matches any needle (needles already lowercased)."""
    blob = f"{item.title}\n{item.summary}".casefold()
    return any(n and n in blob for n in needles)


def youtube_items_from_api_payload(payload: dict) -> list[FeedItem]:
    """Map YouTube Data API `videos.list` JSON to FeedItem (test hook)."""
    out: list[FeedItem] = []
    for vid in payload.get("items", []):
        if not isinstance(vid, dict):
            continue
        vid_id = vid.get("id")
        sn = vid.get("snippet")
        if not vid_id or not isinstance(sn, dict):
            continue
        title = (sn.get("title") or "").strip()
        desc_raw = (sn.get("description") or "").strip()
        short = _compact_youtube_description(desc_raw) or (title or "YouTube video")
        thumb = _youtube_thumbnail_from_snippet(sn) or (
            f"https://i.ytimg.com/vi/{vid_id}/hqdefault.jpg"
        )
        pub_raw = sn.get("publishedAt")
        pub = _parse_date_atom(pub_raw) if isinstance(pub_raw, str) else None
        link = f"https://www.youtube.com/watch?v={vid_id}"
        display_title = title or "YouTube video"
        out.append(
            FeedItem(
                title=display_title[:500],
                link=link,
                summary=short,
                published=pub,
                thumbnail_url=thumb,
            ),
        )
    return out


async def _fetch_youtube_trending(
    client: httpx.AsyncClient,
    *,
    api_key: str,
    region_code: str,
    video_category_id: str | None,
    max_results: int,
) -> tuple[list[FeedItem], str | None]:
    """videos.list chart=mostPopular — regional trending (optional category, e.g. Tech)."""
    n = min(50, max(1, max_results))
    params: dict[str, str | int] = {
        "part": "snippet",
        "chart": "mostPopular",
        "regionCode": region_code.strip().upper()[:8] or "US",
        "maxResults": n,
        "key": api_key,
    }
    if video_category_id:
        params["videoCategoryId"] = video_category_id
    try:
        response = await client.get(
            "https://www.googleapis.com/youtube/v3/videos",
            params=params,
        )
        payload = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        return [], str(exc)

    if response.status_code != 200:
        err = payload.get("error", {}) if isinstance(payload, dict) else {}
        msg = err.get("message") if isinstance(err, dict) else None
        return [], msg or response.text[:500]

    return youtube_items_from_api_payload(payload), None


async def _persist_feed_items(
    repo: ArticleRepository,
    items: list[FeedItem],
) -> tuple[list[str], int]:
    created_slugs: list[str] = []
    skipped = 0
    for it in items:
        data = _to_article_create(it)
        if data is None:
            continue
        existing = await repo.get_by_slug(data.slug)
        if existing is not None:
            skipped += 1
            continue
        try:
            await repo.create(data)
            created_slugs.append(data.slug)
        except ValueError:
            skipped += 1
    return created_slugs, skipped


async def run_news_ingest(
    repo: ArticleRepository,
    *,
    feed_urls: list[str] | None,
    max_per_feed: int,
    include_youtube_trending: bool = True,
    youtube_trending_max: int | None = None,
) -> dict[str, object]:
    settings = get_settings()
    notes: list[str] = []
    if feed_urls is not None:
        urls = list(feed_urls)
    else:
        urls = _split_feed_urls(settings.news_ingest_feed_urls)

    yt_cap = (
        youtube_trending_max
        if youtube_trending_max is not None
        else settings.youtube_trending_max_results
    )
    want_youtube = (
        include_youtube_trending
        and bool(settings.youtube_api_key)
        and yt_cap > 0
    )
    if include_youtube_trending and not settings.youtube_api_key:
        notes.append(
            "YouTube trending skipped: set YOUTUBE_API_KEY for chart=mostPopular "
            "(channel uploads still work via RSS without a key).",
        )

    timeout = httpx.Timeout(25.0)
    headers = {"User-Agent": settings.news_ingest_user_agent}

    created_slugs: list[str] = []
    skipped_total = 0
    errors: list[str] = []

    async with httpx.AsyncClient(timeout=timeout, headers=headers) as client:
        candidates: list[FeedItem] = []

        if want_youtube:
            yt_items, yt_err = await _fetch_youtube_trending(
                client,
                api_key=settings.youtube_api_key or "",
                region_code=settings.youtube_trending_region,
                video_category_id=settings.youtube_trending_video_category_id,
                max_results=yt_cap,
            )
            if yt_err:
                errors.append(f"YouTube trending API: {yt_err}")
            elif settings.youtube_trending_ai_only:
                needles = _effective_ai_trend_needles(settings.youtube_trending_ai_keywords)
                before_n = len(yt_items)
                yt_items = [
                    it
                    for it in yt_items
                    if youtube_trend_matches_ai_signals(it, needles)
                ]
                dropped = before_n - len(yt_items)
                if dropped and not yt_items:
                    notes.append(
                        "YouTube trending: API returned videos but none matched "
                        "AI keyword filters — raise max results or widen "
                        "`YOUTUBE_TRENDING_AI_KEYWORDS`.",
                    )
                elif dropped:
                    notes.append(
                        "YouTube trending: filtered "
                        f"{dropped}/{before_n} non-AI-related video(s); "
                        f"kept {len(yt_items)}.",
                    )
            candidates.extend(yt_items)

        for feed_url in urls:
            try:
                response = await client.get(feed_url, follow_redirects=True)
                response.raise_for_status()
            except httpx.HTTPError as exc:
                errors.append(f"{feed_url}: {exc}")
                continue

            parsed = parse_feed_xml(response.content, feed_url=feed_url)[
                :max_per_feed
            ]
            candidates.extend(parsed)

        if not candidates:
            err_msg = "No items from feeds or YouTube."
            if not urls and not want_youtube:
                err_msg = (
                    "No feed URLs and YouTube trending disabled "
                    "(empty NEWS_INGEST_FEED_URLS or no API key)."
                )
            return {
                "created_slugs": [],
                "skipped_duplicates": 0,
                "errors": errors + [err_msg],
                "notes": notes,
            }

        created_slugs, skipped_total = await _persist_feed_items(repo, candidates)

    return {
        "created_slugs": created_slugs,
        "skipped_duplicates": skipped_total,
        "errors": errors,
        "notes": notes,
    }
