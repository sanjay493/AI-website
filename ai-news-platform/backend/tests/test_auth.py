def test_me_without_token_returns_401(client_with_mock_session):
    response = client_with_mock_session.get("/api/v1/auth/me")
    assert response.status_code == 401
