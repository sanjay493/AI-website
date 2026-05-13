"""Fetch AI-related items from RSS/Atom feeds (blogs, arXiv, YouTube channel feeds, etc.).

YouTube strategy (in order, all deduplicated by video_id before persist):
  1. chart=mostPopular  — regional trending, filtered to AI signals
  2. AI-targeted search  — curated queries via videos/search endpoint (Shorts included)
  3. Shorts-specific     — search with videoDuration=short for bite-sized AI content
  4. Channel RSS feeds   — zero-quota channel uploads from top AI creators/orgs
"""

from __future__ import annotations

import hashlib
import html
import logging
import re
from collections.abc import Iterable
from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from email.utils import parsedate_to_datetime
from typing import Literal
from xml.etree import ElementTree as ET

import httpx

from app.config.settings import get_settings
from app.models.article_requests import ArticleCategory, ArticleCreate
from app.repositories.article_repository import ArticleRepository

log = logging.getLogger(__name__)

_ATOM = "{http://www.w3.org/2005/Atom}"
_TAG = re.compile(r"<[^>]+>")

# ─── Content types ────────────────────────────────────────────────────────────

ContentType = Literal["video", "short", "live", "article"]

# ─── AI-focused YouTube channel RSS feeds (no API key required) ──────────────
# Format: https://www.youtube.com/feeds/videos.xml?channel_id=<CHANNEL_ID>

AI_CHANNEL_RSS_FEEDS: list[str] = [
    # Research / Labs
    "https://www.youtube.com/feeds/videos.xml?channel_id=UCP4bf6IHJJQehibu6ai__cg",  # Google DeepMind
    "https://www.youtube.com/feeds/videos.xml?channel_id=UCbmNph6atAoGfqLoCL_duAg",  # Anthropic
    "https://www.youtube.com/feeds/videos.xml?channel_id=UCXZCJLdBC09xxGZ6gcdrc6A",  # OpenAI
    "https://www.youtube.com/feeds/videos.xml?channel_id=UCWX3yGbODI3HLMhcFiSiGaQ",  # Meta AI
    "https://www.youtube.com/feeds/videos.xml?channel_id=UCY2ifv8iH1Dsgjrz-h3lWLQ",  # Mistral AI
    # Educators / Practitioners
    "https://www.youtube.com/feeds/videos.xml?channel_id=UCWX3yGbODI3HLMhcFiSiGaQ",  # Andrej Karpathy
    "https://www.youtube.com/feeds/videos.xml?channel_id=UCH-_hzb2ILSCo9ftVSnrCIQ",  # Two Minute Papers
    "https://www.youtube.com/feeds/videos.xml?channel_id=UCWX3yGbODI3HLMhcFiSiGaQ",  # Yannic Kilcher
    "https://www.youtube.com/feeds/videos.xml?channel_id=UCZHmQk67mSJgfCCTn7xBfew",  # AI Explained
    "https://www.youtube.com/feeds/videos.xml?channel_id=UCnUYZLuoy1rq1aVMwx4aTzw",  # 3Blue1Brown (math/ML)
    # News / Analysis
    "https://www.youtube.com/feeds/videos.xml?channel_id=UCbmNph6atAoGfqLoCL_duAg",  # The AI Breakdown
    "https://www.youtube.com/feeds/videos.xml?channel_id=UC0RhatS1pyxInC00YKjjBqQ",  # Matt Wolfe
    "https://www.youtube.com/feeds/videos.xml?channel_id=UCVls1GmFKf6WlTraIb_IaJg",  # Fireship (AI dev)
]

# Curated search queries for the YouTube Search API (AI-targeted)
_YT_AI_SEARCH_QUERIES: tuple[str, ...] = (
    "artificial intelligence news 2025",
    "large language model tutorial",
    "AI agents automation",
    "ChatGPT GPT-4 update",
    "Google Gemini AI",
    "Anthropic Claude AI",
    "open source AI models",
    "AI coding assistant",
    "machine learning explained",
    "AI safety alignment",
)

# ─── Utilities ────────────────────────────────────────────────────────────────


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


def _extract_youtube_video_id(url: str) -> str | None:
    """Extract the video ID from any YouTube URL format."""
    # youtube.com/shorts/<id>
    m = re.search(r"youtube\.com/shorts/([A-Za-z0-9_-]{11})", url)
    if m:
        return m.group(1)
    # youtu.be/<id>
    m = re.search(r"youtu\.be/([A-Za-z0-9_-]{11})", url)
    if m:
        return m.group(1)
    # youtube.com/watch?v=<id>
    m = re.search(r"[?&]v=([A-Za-z0-9_-]{11})", url)
    if m:
        return m.group(1)
    return None


# ─── FeedItem ─────────────────────────────────────────────────────────────────


@dataclass
class FeedItem:
    title: str
    link: str
    summary: str
    published: date | None
    thumbnail_url: str | None = None
    #: YouTube snippet tags; used only for AI filtering — not shown in excerpt.
    tag_list: tuple[str, ...] = ()
    #: Content type to drive card rendering and reading-time capping.
    content_type: ContentType = "article"
    #: Raw video_id used for cross-source deduplication (YouTube only).
    video_id: str | None = None


# ─── Feed parsing (RSS / Atom) ────────────────────────────────────────────────


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

        # Detect YouTube Shorts from the channel feed URL itself
        vid_id = _extract_youtube_video_id(link)
        is_short = "/shorts/" in link.lower()
        ctype: ContentType = "short" if is_short else ("video" if vid_id else "article")

        if title or link:
            out.append(
                FeedItem(
                    title=title or "Untitled",
                    link=link,
                    summary=summary,
                    published=pub,
                    content_type=ctype,
                    video_id=vid_id,
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

        vid_id = _extract_youtube_video_id(link)
        ctype: ContentType = "video" if vid_id else "article"

        if title or link:
            out.append(
                FeedItem(
                    title=title or "Untitled",
                    link=link,
                    summary=summary,
                    published=pub,
                    content_type=ctype,
                    video_id=vid_id,
                ),
            )
    return out


# ─── YouTube helpers ──────────────────────────────────────────────────────────


def _is_youtube_watch(url: str) -> bool:
    u = url.lower()
    return "youtube.com/watch" in u or "youtu.be/" in u or "youtube.com/shorts/" in u


def _is_youtube_short_url(url: str) -> bool:
    return "youtube.com/shorts/" in url.lower()


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
    """Return only the first meaningful paragraph; skip credits / link walls."""
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
    return re.sub(r"^\[YouTube[^\]]*\]\s*", "", title, flags=re.I).strip() or title


def _format_short_title(title: str) -> str:
    """Prefix Shorts titles so they're distinguishable in card lists."""
    clean = _clean_youtube_title(title)
    if not clean.lower().startswith("#short"):
        return f"[Short] {clean}"
    return clean


# ─── FeedItem → ArticleCreate ─────────────────────────────────────────────────


def _to_article_create(item: FeedItem) -> ArticleCreate | None:
    if not item.link or not item.link.startswith(("http://", "https://")):
        return None
    slug = _slug_for_url(item.link)
    is_yt = _is_youtube_watch(item.link)
    is_short = item.content_type == "short" or _is_youtube_short_url(item.link)

    if is_short:
        title = _format_short_title(item.title.strip()[:500]) or "Untitled Short"
        excerpt = _short_card_excerpt(item.summary.strip(), title, 280)
        if not excerpt:
            excerpt = title
        excerpt = excerpt[:5000]
        paras = [excerpt, f"Watch on YouTube Shorts: {item.link}"]
        # Shorts are ≤60 s; always 1 reading-minute
        return ArticleCreate(
            slug=slug,
            title=title,
            excerpt=excerpt,
            category=ArticleCategory.news,
            published_at=item.published or date.today(),
            reading_time_minutes=1,
            paragraphs=paras,
            cover_image_url=item.thumbnail_url,
            external_url=item.link,
        )

    if is_yt:
        title = _clean_youtube_title(item.title.strip()[:500]) or "Untitled"
        excerpt = _short_card_excerpt(item.summary.strip(), title, 360)
        if not excerpt:
            excerpt = title
        excerpt = excerpt[:5000]
        paras = [excerpt, f"Watch on YouTube: {item.link}"]
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

    # ── Regular article / blog post ────────────────────────────────────────
    title = item.title.strip()[:500] or "Untitled"
    summary = item.summary.strip()
    if not summary:
        summary = title
    excerpt = summary[:4900]
    pub = item.published or date.today()
    body_text = f"{summary}\n\n{item.link}"
    rtm = _estimate_reading_minutes(body_text)
    paras = [summary if summary else title, f"Open the original: {item.link}"]
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


# ─── Feed URL helper ──────────────────────────────────────────────────────────


def _split_feed_urls(raw: str) -> list[str]:
    parts: list[str] = []
    for chunk in re.split(r"[\n,]", raw):
        u = chunk.strip()
        if u:
            parts.append(u)
    return parts


# ─── AI signal matching ───────────────────────────────────────────────────────

_BUILTIN_YOUTUBE_AI_SUBSTRINGS: tuple[str, ...] = tuple(
    needle.casefold()
    for needle in (
        # Concepts
        "artificial intelligence",
        "machine learning",
        "deep learning",
        "neural network",
        "neural net",
        "neural",
        "large language model",
        "language model",
        "generative ai",
        "generative artificial",
        "gen ai",
        "foundation model",
        "multimodal model",
        "multimodal",
        "multi-modal",
        "computer vision",
        "natural language",
        "speech recognition",
        "voice assistant",
        "text to speech",
        "chatbot",
        "chat bot",
        "chatbots",
        "reasoning model",
        "token context",
        "context window",
        "fine-tuning",
        "fine tuning",
        "finetuning",
        "prompt engineering",
        "synthetic media",
        "deepfake",
        "deep fake",
        "diffusion model",
        "transformer model",
        "embedding model",
        "vector search",
        "retrieval augmented",
        "rag pipeline",
        "ai agent",
        "ai agents",
        "agentic ai",
        "agentic workflow",
        "model context protocol",
        "mcp server",
        "tool use",
        "function calling",
        "ai automation",
        "inference speed",
        "quantization",
        # Labs / Companies
        "nvidia",
        "openai",
        "anthropic",
        "google deepmind",
        "deepmind",
        "mistral ai",
        "mistral",
        "deepseek",
        "meta ai",
        "xai grok",
        "inflection ai",
        "cohere",
        "hugging face",
        "stability ai",
        "runway ml",
        "midjourney",
        "perplexity",
        "groq",
        # Models
        "chatgpt",
        "gpt-4o",
        "gpt-4",
        "gpt-3",
        "gpt 4",
        "gpt 3",
        "o1 model",
        "o3 model",
        "claude 3",
        "claude 4",
        "claude sonnet",
        "claude opus",
        "claude haiku",
        "gemini 2",
        "gemini 1.5",
        "gemini ultra",
        "gemini flash",
        "llama 3",
        "llama3",
        "llama2",
        "llama 2",
        "llama ",
        "mistral large",
        "mixtral",
        "grok 2",
        "grok-2",
        "phi-3",
        "phi 3",
        "command r",
        "notebooklm",
        "copilot ai",
        "microsoft copilot",
        "github copilot",
        "cursor ai",
        # Tools / Frameworks
        "whisper",
        "sora",
        "veo 2",
        "veo2",
        "imagen",
        "dall-e",
        "stable diffusion",
        "pytorch",
        "tensorflow",
        "langchain",
        "llamaindex",
        "autogen",
        "crewai",
        # ML Topics
        "unsupervised learning",
        "reinforcement learning",
        "rlhf",
        "semi-supervised",
        "knowledge distillation",
        "model alignment",
        "ai safety",
        "ai ethics",
        "ai regulation",
        "responsible ai",
    )
)

# Token-level regex for short terms that can't be substring-matched safely ("ai", "agi", etc.)
_AI_TREND_TOKEN_OR_TAG_RE = re.compile(
    r"(?iu)(?:"
    r"\b(?:"
    r"a\.i\.|"
    r"ai|"
    r"agi|"
    r"asi|"
    r"llm|"
    r"llms|"
    r"slm|"
    r"chatgpt|"
    r"openai|"
    r"anthropic|"
    r"deepseek|"
    r"mistral|"
    r"gpt|"
    r"nlp|"
    r"genai|"
    r"copilot|"
    r"gemini|"
    r"grok|"
    r"notebooklm|"
    r"rag|"
    r"mcp"
    r")\b"
    r"|(?:^|[\s>#(])#(?:ai|gpt|llms?|genai|agi|ml)(?:[-_/a-z0-9]{0,48})?(?=[\s)#>,]|$))",
)


def _effective_ai_trend_needles(extra_keywords: str) -> tuple[str, ...]:
    """Built-in AI substrings + optional env-configured extras (case-folded)."""
    custom = tuple(
        p.strip().casefold()
        for p in re.split(r"[\n,]+", extra_keywords.strip())
        if p.strip()
    )
    return _BUILTIN_YOUTUBE_AI_SUBSTRINGS + custom


def youtube_trend_matches_ai_signals(item: FeedItem, needles: Iterable[str]) -> bool:
    """True if title, summary, or tags contain any AI signal (substring or token)."""
    parts = [item.title, item.summary]
    if item.tag_list:
        parts.append(" ".join(item.tag_list))
    text = "\n".join(parts)
    cf = text.casefold()
    if any(n and n in cf for n in needles):
        return True
    return bool(_AI_TREND_TOKEN_OR_TAG_RE.search(text))


# ─── YouTube API → FeedItem mapper ────────────────────────────────────────────


def youtube_items_from_api_payload(
    payload: dict,
    *,
    force_content_type: ContentType | None = None,
) -> list[FeedItem]:
    """Map YouTube Data API ``videos.list`` or ``search.list`` JSON to FeedItem."""
    out: list[FeedItem] = []
    for vid in payload.get("items", []):
        if not isinstance(vid, dict):
            continue

        # search.list wraps id differently
        raw_id = vid.get("id")
        if isinstance(raw_id, dict):
            vid_id = raw_id.get("videoId") or raw_id.get("id") or ""
        else:
            vid_id = str(raw_id) if raw_id else ""

        if not vid_id:
            continue

        sn = vid.get("snippet")
        if not isinstance(sn, dict):
            continue

        title = (sn.get("title") or "").strip()
        desc_raw = (sn.get("description") or "").strip()
        short_desc = _compact_youtube_description(desc_raw) or (title or "YouTube video")

        thumb = _youtube_thumbnail_from_snippet(sn) or (
            f"https://i.ytimg.com/vi/{vid_id}/hqdefault.jpg"
        )
        pub_raw = sn.get("publishedAt")
        pub = _parse_date_atom(pub_raw) if isinstance(pub_raw, str) else None

        # Determine content type
        # search results carry liveBroadcastContent; also detect Shorts by duration
        live_status = (sn.get("liveBroadcastContent") or "").lower()
        if live_status == "live":
            ctype: ContentType = "live"
            link = f"https://www.youtube.com/watch?v={vid_id}"
        elif force_content_type == "short":
            ctype = "short"
            link = f"https://www.youtube.com/shorts/{vid_id}"
        else:
            ctype = force_content_type or "video"
            link = f"https://www.youtube.com/watch?v={vid_id}"

        display_title = title or "YouTube video"
        tags_raw = sn.get("tags")
        tag_list: tuple[str, ...] = ()
        if isinstance(tags_raw, list):
            tag_list = tuple(
                str(t).strip()
                for t in tags_raw[:50]
                if isinstance(t, str) and str(t).strip()
            )

        # Channel name as extra context signal
        channel_name = (sn.get("channelTitle") or "").strip()
        enriched_summary = short_desc
        if channel_name and channel_name.lower() not in enriched_summary.lower():
            enriched_summary = f"{short_desc} — {channel_name}" if short_desc else channel_name

        out.append(
            FeedItem(
                title=display_title[:500],
                link=link,
                summary=enriched_summary,
                published=pub,
                thumbnail_url=thumb,
                tag_list=tag_list,
                content_type=ctype,
                video_id=vid_id,
            ),
        )
    return out


# ─── YouTube API fetch functions ──────────────────────────────────────────────


async def _fetch_youtube_trending(
    client: httpx.AsyncClient,
    *,
    api_key: str,
    region_code: str,
    video_category_id: str | None,
    max_results: int,
) -> tuple[list[FeedItem], str | None]:
    """videos.list chart=mostPopular — regional trending (optional category)."""
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


async def _fetch_youtube_ai_search(
    client: httpx.AsyncClient,
    *,
    api_key: str,
    queries: tuple[str, ...],
    max_per_query: int,
    region_code: str,
) -> tuple[list[FeedItem], list[str]]:
    """search.list for each AI query — returns regular videos (not Shorts)."""
    all_items: list[FeedItem] = []
    errors: list[str] = []
    n = min(25, max(1, max_per_query))

    for query in queries:
        params: dict[str, str | int] = {
            "part": "snippet",
            "q": query,
            "type": "video",
            "videoDuration": "medium",   # 4–20 min — avoids micro-clips and hour-long lectures
            "order": "relevance",
            "relevanceLanguage": "en",
            "regionCode": region_code.strip().upper()[:8] or "US",
            "maxResults": n,
            "key": api_key,
        }
        try:
            response = await client.get(
                "https://www.googleapis.com/youtube/v3/search",
                params=params,
            )
            payload = response.json()
        except (httpx.HTTPError, ValueError) as exc:
            errors.append(f"YouTube search [{query!r}]: {exc}")
            continue

        if response.status_code != 200:
            err = payload.get("error", {}) if isinstance(payload, dict) else {}
            msg = err.get("message") if isinstance(err, dict) else None
            errors.append(f"YouTube search [{query!r}]: {msg or response.text[:300]}")
            continue

        items = youtube_items_from_api_payload(payload, force_content_type="video")
        all_items.extend(items)
        log.debug("YouTube search %r → %d items", query, len(items))

    return all_items, errors


async def _fetch_youtube_ai_shorts(
    client: httpx.AsyncClient,
    *,
    api_key: str,
    queries: tuple[str, ...],
    max_per_query: int,
    region_code: str,
) -> tuple[list[FeedItem], list[str]]:
    """search.list with videoDuration=short — AI Shorts (≤4 min, usually ≤60 s)."""
    all_items: list[FeedItem] = []
    errors: list[str] = []
    n = min(15, max(1, max_per_query))

    # Use a subset of the most viral-friendly queries for Shorts
    shorts_queries = tuple(
        q for q in queries
        if any(kw in q.lower() for kw in ("news", "explained", "update", "ai", "chatgpt", "gemini"))
    ) or queries[:3]

    for query in shorts_queries:
        params: dict[str, str | int] = {
            "part": "snippet",
            "q": f"{query} shorts",
            "type": "video",
            "videoDuration": "short",   # ≤4 minutes
            "order": "viewCount",
            "relevanceLanguage": "en",
            "regionCode": region_code.strip().upper()[:8] or "US",
            "maxResults": n,
            "key": api_key,
        }
        try:
            response = await client.get(
                "https://www.googleapis.com/youtube/v3/search",
                params=params,
            )
            payload = response.json()
        except (httpx.HTTPError, ValueError) as exc:
            errors.append(f"YouTube Shorts search [{query!r}]: {exc}")
            continue

        if response.status_code != 200:
            err = payload.get("error", {}) if isinstance(payload, dict) else {}
            msg = err.get("message") if isinstance(err, dict) else None
            errors.append(f"YouTube Shorts search [{query!r}]: {msg or response.text[:300]}")
            continue

        items = youtube_items_from_api_payload(payload, force_content_type="short")
        all_items.extend(items)
        log.debug("YouTube Shorts search %r → %d items", query, len(items))

    return all_items, errors


# ─── Deduplication ────────────────────────────────────────────────────────────


def _deduplicate_feed_items(items: list[FeedItem]) -> list[FeedItem]:
    """Remove duplicate YouTube videos by video_id; preserve non-YouTube items."""
    seen_ids: set[str] = set()
    seen_links: set[str] = set()
    out: list[FeedItem] = []
    for it in items:
        if it.video_id:
            if it.video_id in seen_ids:
                continue
            seen_ids.add(it.video_id)
        else:
            link_key = it.link.lower().rstrip("/")
            if link_key in seen_links:
                continue
            seen_links.add(link_key)
        out.append(it)
    return out


# ─── Persist helpers ──────────────────────────────────────────────────────────


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


# ─── Main entry point ─────────────────────────────────────────────────────────


async def run_news_ingest(
    repo: ArticleRepository,
    *,
    feed_urls: list[str] | None,
    max_per_feed: int,
    include_youtube_trending: bool = True,
    include_youtube_ai_search: bool = True,
    include_youtube_shorts: bool = True,
    include_ai_channel_feeds: bool = True,
    youtube_trending_max: int | None = None,
    youtube_search_max_per_query: int = 10,
    youtube_shorts_max_per_query: int = 8,
) -> dict[str, object]:
    """Ingest news + YouTube AI content into the article repository.

    YouTube is fetched from up to four sources (all AI-filtered):
      1. chart=mostPopular  trending videos
      2. AI-targeted search queries (medium-duration videos)
      3. AI-targeted Shorts search (short-duration videos)
      4. Hand-curated AI channel RSS feeds (no API quota used)

    All YouTube results are deduplicated by video_id before persistence.
    """
    settings = get_settings()
    notes: list[str] = []

    if feed_urls is not None:
        urls = list(feed_urls)
    else:
        urls = _split_feed_urls(settings.news_ingest_feed_urls)

    # Merge in the AI channel RSS feeds if enabled
    if include_ai_channel_feeds:
        channel_urls = [u for u in AI_CHANNEL_RSS_FEEDS if u not in urls]
        urls = channel_urls + urls  # channel feeds first so they rank high
        notes.append(f"Included {len(channel_urls)} AI channel RSS feeds.")

    yt_cap = (
        youtube_trending_max
        if youtube_trending_max is not None
        else settings.youtube_trending_max_results
    )
    has_api_key = bool(settings.youtube_api_key)
    want_trending = include_youtube_trending and has_api_key and yt_cap > 0
    want_search = include_youtube_ai_search and has_api_key
    want_shorts = include_youtube_shorts and has_api_key

    if (include_youtube_trending or include_youtube_ai_search or include_youtube_shorts) and not has_api_key:
        notes.append(
            "YouTube API features skipped: set YOUTUBE_API_KEY to enable "
            "chart=mostPopular, AI search, and Shorts. "
            "Channel uploads still work via RSS without a key."
        )

    timeout = httpx.Timeout(30.0)
    headers = {"User-Agent": settings.news_ingest_user_agent}

    created_slugs: list[str] = []
    skipped_total = 0
    errors: list[str] = []

    async with httpx.AsyncClient(timeout=timeout, headers=headers) as client:
        candidates: list[FeedItem] = []
        needles = _effective_ai_trend_needles(
            getattr(settings, "youtube_trending_ai_keywords", "")
        )

        # ── 1. Trending chart ──────────────────────────────────────────────
        if want_trending:
            yt_items, yt_err = await _fetch_youtube_trending(
                client,
                api_key=settings.youtube_api_key or "",
                region_code=settings.youtube_trending_region,
                video_category_id=settings.youtube_trending_video_category_id,
                max_results=yt_cap,
            )
            if yt_err:
                errors.append(f"YouTube trending API: {yt_err}")
            else:
                if getattr(settings, "youtube_trending_ai_only", True):
                    before = len(yt_items)
                    yt_items = [it for it in yt_items if youtube_trend_matches_ai_signals(it, needles)]
                    dropped = before - len(yt_items)
                    if dropped and not yt_items:
                        notes.append(
                            "YouTube trending: none matched AI filters — "
                            "try raising YOUTUBE_TRENDING_MAX_RESULTS or widening "
                            "YOUTUBE_TRENDING_AI_KEYWORDS."
                        )
                    elif dropped:
                        notes.append(
                            f"YouTube trending: filtered {dropped}/{before} non-AI videos; "
                            f"kept {len(yt_items)}."
                        )
                candidates.extend(yt_items)
                log.info("YouTube trending: %d AI items", len(yt_items))

        # ── 2. AI-targeted search (regular videos) ─────────────────────────
        if want_search:
            search_items, search_errs = await _fetch_youtube_ai_search(
                client,
                api_key=settings.youtube_api_key or "",
                queries=_YT_AI_SEARCH_QUERIES,
                max_per_query=youtube_search_max_per_query,
                region_code=getattr(settings, "youtube_trending_region", "US"),
            )
            errors.extend(search_errs)
            # Search results are already AI-targeted; still run signal filter as safety net
            ai_search = [it for it in search_items if youtube_trend_matches_ai_signals(it, needles)]
            candidates.extend(ai_search)
            log.info("YouTube AI search: %d items (from %d raw)", len(ai_search), len(search_items))
            notes.append(f"YouTube AI search: fetched {len(ai_search)} relevant videos.")

        # ── 3. AI Shorts ───────────────────────────────────────────────────
        if want_shorts:
            shorts_items, shorts_errs = await _fetch_youtube_ai_shorts(
                client,
                api_key=settings.youtube_api_key or "",
                queries=_YT_AI_SEARCH_QUERIES,
                max_per_query=youtube_shorts_max_per_query,
                region_code=getattr(settings, "youtube_trending_region", "US"),
            )
            errors.extend(shorts_errs)
            ai_shorts = [it for it in shorts_items if youtube_trend_matches_ai_signals(it, needles)]
            candidates.extend(ai_shorts)
            log.info("YouTube AI Shorts: %d items (from %d raw)", len(ai_shorts), len(shorts_items))
            notes.append(f"YouTube AI Shorts: fetched {len(ai_shorts)} relevant shorts.")

        # ── 4. RSS / Atom feeds (channel feeds + external blogs) ───────────
        for feed_url in urls:
            try:
                response = await client.get(feed_url, follow_redirects=True)
                response.raise_for_status()
            except httpx.HTTPError as exc:
                errors.append(f"{feed_url}: {exc}")
                continue

            parsed = parse_feed_xml(response.content, feed_url=feed_url)[:max_per_feed]

            # Filter channel-feed YouTube videos to AI signals too
            if "youtube.com/feeds" in feed_url.lower():
                before = len(parsed)
                parsed = [it for it in parsed if youtube_trend_matches_ai_signals(it, needles)]
                dropped = before - len(parsed)
                if dropped:
                    log.debug("Channel feed %s: dropped %d non-AI items", feed_url, dropped)

            candidates.extend(parsed)

        # ── 5. Cross-source deduplication ─────────────────────────────────
        before_dedup = len(candidates)
        candidates = _deduplicate_feed_items(candidates)
        duped = before_dedup - len(candidates)
        if duped:
            notes.append(f"Removed {duped} cross-source duplicate(s).")
        log.info("Candidates after dedup: %d", len(candidates))

        if not candidates:
            err_msg = "No items from feeds or YouTube."
            if not urls and not (want_trending or want_search or want_shorts):
                err_msg = (
                    "No feed URLs and all YouTube sources disabled "
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
