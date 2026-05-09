def test_articles_list_rejects_negative_offset(client):
    response = client.get("/api/v1/articles/?offset=-1")
    assert response.status_code == 422


def test_articles_list_respects_limit_bound(client):
    response = client.get("/api/v1/articles/?limit=500")
    assert response.status_code == 422


def test_invalid_slug_path(client):
    # Underscores are not allowed by slug pattern (hyphens only)
    response = client.get("/api/v1/articles/not_valid_slug")
    assert response.status_code == 422


def test_register_rejects_invalid_email(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "not-an-email",
            "password": "password123",
            "full_name": "Test",
        },
    )
    assert response.status_code == 422
