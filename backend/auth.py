from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer


def _urlsafe_b64encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("utf-8").rstrip("=")


def _urlsafe_b64decode(encoded: str) -> bytes:
    padding = "=" * (-len(encoded) % 4)
    return base64.urlsafe_b64decode(f"{encoded}{padding}")


def get_admin_username() -> str:
    return os.getenv("CLASS_ADMIN_USERNAME", "admin")


def get_admin_password() -> str:
    return os.getenv("CLASS_ADMIN_PASSWORD", "admin123")


def get_secret_key() -> str:
    return os.getenv("CLASS_APP_SECRET", "class-information-dev-secret")


def get_token_ttl_seconds() -> int:
    return int(os.getenv("CLASS_TOKEN_TTL_SECONDS", "28800"))


def verify_credentials(username: str, password: str) -> bool:
    return secrets.compare_digest(username, get_admin_username()) and secrets.compare_digest(
        password, get_admin_password()
    )


def build_expiration_time() -> datetime:
    return datetime.now(timezone.utc) + timedelta(seconds=get_token_ttl_seconds())


def create_access_token(username: str) -> str:
    payload = {
        "sub": username,
        "exp": int(build_expiration_time().timestamp()),
    }
    encoded_payload = _urlsafe_b64encode(
        json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    )
    signature = hmac.new(
        get_secret_key().encode("utf-8"),
        encoded_payload.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    encoded_signature = _urlsafe_b64encode(signature)
    return f"{encoded_payload}.{encoded_signature}"


def verify_access_token(token: str) -> str | None:
    try:
        encoded_payload, encoded_signature = token.split(".", maxsplit=1)
    except ValueError:
        return None

    expected_signature = _urlsafe_b64encode(
        hmac.new(
            get_secret_key().encode("utf-8"),
            encoded_payload.encode("utf-8"),
            hashlib.sha256,
        ).digest()
    )
    if not secrets.compare_digest(encoded_signature, expected_signature):
        return None

    try:
        payload = json.loads(_urlsafe_b64decode(encoded_payload).decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError, ValueError):
        return None

    expiration = int(payload.get("exp", 0))
    if expiration <= int(time.time()):
        return None

    subject = payload.get("sub")
    if not isinstance(subject, str) or not subject:
        return None

    return subject


bearer_scheme = HTTPBearer(auto_error=False)


def get_current_username(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> str:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="\u8bf7\u5148\u767b\u5f55\u540e\u518d\u8bbf\u95ee\u53d7\u4fdd\u62a4\u7684\u63a5\u53e3\u3002",
        )

    username = verify_access_token(credentials.credentials)
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="\u767b\u5f55\u72b6\u6001\u5df2\u5931\u6548\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55\u3002",
        )

    return username
