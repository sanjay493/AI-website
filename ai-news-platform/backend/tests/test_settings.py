from app.config.settings import Settings


def test_empty_smtp_env_values_are_treated_as_unset(monkeypatch):
    # docker-compose passes unset vars as empty strings.
    for name in ("SMTP_HOST", "SMTP_PORT", "SMTP_USE_TLS", "SMTP_FROM_EMAIL"):
        monkeypatch.setenv(name, "")
    settings = Settings()
    assert settings.smtp_host is None
    assert settings.smtp_port is None
    assert settings.smtp_use_tls is True
    assert settings.smtp_configured is False


def test_empty_feed_urls_env_falls_back_to_default_feeds(monkeypatch):
    monkeypatch.setenv("NEWS_INGEST_FEED_URLS", "")
    settings = Settings()
    assert settings.news_ingest_feed_urls == Settings.model_fields["news_ingest_feed_urls"].default
    assert "arxiv.org" in settings.news_ingest_feed_urls


def test_custom_feed_urls_env_is_kept(monkeypatch):
    monkeypatch.setenv("NEWS_INGEST_FEED_URLS", "https://example.com/feed.xml")
    assert Settings().news_ingest_feed_urls == "https://example.com/feed.xml"
