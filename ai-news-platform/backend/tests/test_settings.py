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
