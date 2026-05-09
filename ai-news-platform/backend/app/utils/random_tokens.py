import secrets


def issue_opaque_token(bytes_length: int = 48) -> str:
    return secrets.token_urlsafe(bytes_length)
