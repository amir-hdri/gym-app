from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Optional
import hashlib
import hmac
import secrets
import time

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt
from jwt import InvalidTokenError
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Password reset grants live for 30 minutes and are single use.
PASSWORD_RESET_TTL_MINUTES = 30

# Simple in-memory rate limiter for login (per-IP)
_rate_limit_store: dict[str, list[float]] = defaultdict(list)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def generate_reset_token() -> str:
    """Raw, URL-safe reset token. Never persisted — only its SHA-256 hash is."""
    return secrets.token_urlsafe(32)


def hash_reset_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def session_stamp(user: User) -> str:
    """Invalidate issued tokens when the password changes, without exposing its hash."""
    return hmac.new(settings.SECRET_KEY.encode(), user.password_hash.encode(), hashlib.sha256).hexdigest()


def _utcnow_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def create_access_token(data: dict) -> tuple[str, datetime]:
    expiry = _utcnow_naive() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {**data, "exp": expiry, "type": "access"}
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return token, expiry


def create_refresh_token(data: dict) -> tuple[str, datetime]:
    expiry = _utcnow_naive() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {**data, "exp": expiry, "type": "refresh"}
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return token, expiry


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM], options={"require": ["exp", "user_id", "type"]})
    except InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    payload = decode_token(credentials.credentials)
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )
    user = db.query(User).filter(User.id == payload["user_id"]).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    if not secrets.compare_digest(str(payload.get("session", "")), session_stamp(user)):
        raise HTTPException(status_code=401, detail="Session expired; sign in again")
    if user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is not active",
        )
    return user


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: Session = Depends(get_db),
) -> Optional[User]:
    if credentials is None:
        return None
    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None


def require_roles(*roles: str):
    def dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user

    return dependency


def check_login_rate_limit(identifier: str) -> None:
    """Raises 429 if identifier has exceeded LOGIN_RATE_LIMIT per minute.
    Quota is consumed by callers via record_rate_limit_attempt on failure only,
    so successful logins never burn the bucket."""
    now = time.time()
    window = 60.0
    # prune
    _rate_limit_store[identifier] = [t for t in _rate_limit_store[identifier] if now - t < window]
    if len(_rate_limit_store[identifier]) >= settings.LOGIN_RATE_LIMIT:
        raise HTTPException(status_code=429, detail="Too many login attempts. Try again later.")


def record_rate_limit_attempt(identifier: str) -> None:
    """Charges one failed attempt against `identifier`. Call after the failure."""
    _rate_limit_store[identifier].append(time.time())


def get_client_ip(request) -> str:
    """Client IP for rate limiting, honoring TRUST_PROXY.

    X-Forwarded-For is the one header a caller fully controls, so it is only
    trusted when the deployment is actually behind a reverse proxy that
    sanitizes it (TRUST_PROXY=true). Default false keeps a spoofed header from
    rotating buckets and bypassing the limiter."""
    if settings.TRUST_PROXY:
        xff = request.headers.get("x-forwarded-for")
        if xff:
            return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"
