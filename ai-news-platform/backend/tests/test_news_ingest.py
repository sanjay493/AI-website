from __future__ import annotations

from app.agents.news_ingest import (
    FeedItem,
    _effective_ai_trend_needles,
    _to_article_create,
    parse_feed_xml,
    youtube_items_from_api_payload,
    youtube_trend_matches_ai_signals,
)


def test_youtube_api_payload_to_feed_items() -> None:
    payload = {
        "items": [
            {
                "id": "abc123",
                "snippet": {
                    "title": "  Model release  ",
                    "description": "Details here.",
                    "publishedAt": "2026-05-01T12:00:00Z",
                },
            }
        ],
    }
    items = youtube_items_from_api_payload(payload)
    assert len(items) == 1
    assert items[0].link == "https://www.youtube.com/watch?v=abc123"
    assert items[0].thumbnail_url
    assert "Model release" in items[0].title
    art = _to_article_create(items[0])
    assert art is not None
    assert art.slug.startswith("feed-")
    assert art.external_url == "https://www.youtube.com/watch?v=abc123"
    assert art.cover_image_url


def test_youtube_trend_ai_filter_skips_unrelated() -> None:
    needles = _effective_ai_trend_needles("")
    soccer = FeedItem(
        title="Soccer highlights weekend",
        link="http://example.com/x",
        summary="Goals",
        published=None,
    )
    ai_item = FeedItem(
        title="Weekly ChatGPT updates",
        link="http://example.com/y",
        summary="Minor patch notes",
        published=None,
    )
    assert not youtube_trend_matches_ai_signals(soccer, needles)
    assert youtube_trend_matches_ai_signals(ai_item, needles)


def test_effective_ai_trend_needles_extend_custom() -> None:
    n = _effective_ai_trend_needles(" robotics , agentic ai ")
    assert "robotics" in n
    assert "agentic ai" in n


def test_parse_rss_basic() -> None:
    xml = b"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title>Hello &amp; AI</title>
      <link>https://example.com/post-one</link>
      <description>&lt;p&gt;Summary here.&lt;/p&gt;</description>
      <pubDate>Mon, 01 Jan 2026 12:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>"""
    items = parse_feed_xml(xml, feed_url="http://test/rss")
    assert len(items) == 1
    assert items[0].title == "Hello & AI"
    assert items[0].link == "https://example.com/post-one"
    assert "Summary here" in items[0].summary
    assert items[0].published is not None


def test_parse_atom_basic() -> None:
    xml = b"""<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <title>Atom post</title>
    <link rel="alternate" href="https://example.org/a"/>
    <summary type="html">Blurb</summary>
    <published>2026-05-01T00:00:00Z</published>
  </entry>
</feed>"""
    items = parse_feed_xml(xml, feed_url="http://test/atom")
    assert len(items) == 1
    assert items[0].link == "https://example.org/a"
    assert items[0].published is not None
    art = _to_article_create(items[0])
    assert art is not None
    assert art.slug.startswith("feed-")
    assert art.title == "Atom post"
    assert art.category.value == "news"


def test_to_article_create_rejects_bad_link() -> None:
    item = parse_feed_xml(
        b"""<?xml version="1.0"?><rss version="2.0"><channel><item>
        <title>x</title><link>not-a-url</link><description>y</description>
        </item></channel></rss>""",
        feed_url="x",
    )[0]
    assert _to_article_create(item) is None
