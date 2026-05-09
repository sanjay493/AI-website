from app.routers import articles as articles_mod
from tests.fakes import FakeArticleRepository, fake_public_repo


def test_list_articles_returns_empty_page(client):
    response = client.get("/api/v1/articles/")
    assert response.status_code == 200
    body = response.json()
    assert body["items"] == []
    assert body["meta"]["total"] == 0


def test_list_articles_with_category_filter(client):
    response = client.get("/api/v1/articles/?category=news")
    assert response.status_code == 200


def test_get_article_not_found(client):
    response = client.get("/api/v1/articles/unknown-slug")
    assert response.status_code == 404
    assert response.json()["detail"] == "Article not found"


def test_get_article_returns_200_when_slug_exists(client, api_app):
    api_app.dependency_overrides[articles_mod.get_article_repo] = (
        lambda: FakeArticleRepository(with_article_slug="hello-world")
    )
    try:
        response = client.get("/api/v1/articles/hello-world")
    finally:
        api_app.dependency_overrides[articles_mod.get_article_repo] = fake_public_repo

    assert response.status_code == 200
    data = response.json()
    assert data["slug"] == "hello-world"
    assert data["title"] == "Test"
