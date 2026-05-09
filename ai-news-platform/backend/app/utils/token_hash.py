import hashlib


def hash_opaque(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
