import time
from collections import defaultdict
from datetime import UTC, datetime, timedelta

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Simple in-memory rate limiter for login (per-IP)
_rate_limit_store: dict[str, list[float]] = defaultdict(list)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def _utcnow_naive() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


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
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from None


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
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing user_id",
        )
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    if user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is not active",
        )
    return user


def require_roles(*roles: str):
    def dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user

    return dependency


def get_client_ip(request: Request) -> str:
    """Best-effort client IP for rate limiting.

    X-Forwarded-For is only trusted when TRUST_PROXY is enabled; otherwise an
    attacker could bypass the rate limiter by rotating a spoofed header value
    on every request (each spoofed value looks like a distinct client).
    """
    if settings.TRUST_PROXY:
        forwarded = request.headers.get("x-forwarded-for", "")
        first = forwarded.split(",")[0].strip()
        if first:
            return first
    if request.client:
        return request.client.host
    return "unknown"


def check_login_rate_limit(identifier: str) -> None:
    """Raises 429 if identifier has exceeded LOGIN_RATE_LIMIT failed attempts per minute.

    Pure check: does NOT consume quota. Only failed login attempts consume
    quota (via record_rate_limit_attempt), so a burst of legitimate successful
    logins is never throttled.
    """
    now = time.time()
    window = 60.0
    # prune
    _rate_limit_store[identifier] = [t for t in _rate_limit_store[identifier] if now - t < window]
    if len(_rate_limit_store[identifier]) >= settings.LOGIN_RATE_LIMIT:
        raise HTTPException(status_code=429, detail="Too many login attempts. Try again later.")


def record_rate_limit_attempt(identifier: str) -> None:
    """Consume one unit of rate-limit quota (call after the attempt is counted).

    For login this is called only after a failed attempt; for register every
    attempt consumes quota (spam protection).
    """
    now = time.time()
    window = 60.0
    _rate_limit_store[identifier] = [t for t in _rate_limit_store[identifier] if now - t < window]
    _rate_limit_store[identifier].append(now)
