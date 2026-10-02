from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.auth import (
    check_login_rate_limit,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_client_ip,
    get_current_user,
    hash_password,
    record_rate_limit_attempt,
    verify_password,
)
from app.database import get_db
from app.models import User
from app.responses import error_response, success_response
from app.schemas import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenData,
    UserResponse,
)

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])


@router.post("/login")
def login(req: LoginRequest, request: Request, db: Session = Depends(get_db)):
    # Rate limit by client IP (X-Forwarded-For only when TRUST_PROXY is enabled).
    # The check runs first (still 429s when over quota); quota is consumed only
    # by failed attempts, so successful logins never burn the bucket.
    ip = get_client_ip(request)
    check_login_rate_limit(ip)
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        record_rate_limit_attempt(ip)
        return error_response("Invalid email or password", 401)

    if user.status != "active":
        return error_response("User account is not active", 403)

    user.last_login_at = datetime.now(UTC).replace(tzinfo=None)
    db.commit()

    access_token, access_exp = create_access_token({"user_id": user.id, "role": user.role})
    refresh_token, refresh_exp = create_refresh_token({"user_id": user.id, "role": user.role})

    return success_response(
        data={
            "user": UserResponse.model_validate(user).model_dump(by_alias=True),
            "tokens": TokenData(
                accessToken=access_token,
                refreshToken=refresh_token,
                accessTokenExpiry=access_exp,
                refreshTokenExpiry=refresh_exp,
            ).model_dump(),
        },
        message="Login successful",
    )


@router.post("/register")
def register(req: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    # Registration spam protection: same in-memory limiter as login but with a
    # distinct identifier so signups don't compete with login quota. Every
    # registration attempt (success or duplicate-email) consumes quota.
    ip = get_client_ip(request)
    register_id = f"register:{ip}"
    check_login_rate_limit(register_id)
    try:
        existing = db.query(User).filter(User.email == req.email).first()
        if not existing:
            # Self-registration is always athlete — role is not accepted from client
            # to prevent privilege escalation. Admins use POST /users with AdminUserCreate.
            user = User(
                email=req.email,
                password_hash=hash_password(req.password),
                first_name=req.first_name,
                last_name=req.last_name,
                phone=req.phone,
                role="athlete",
            )
            db.add(user)
            db.commit()
    finally:
        record_rate_limit_attempt(register_id)

    # Anti-enumeration: the response is identical whether or not the email
    # already existed, so it reveals nothing about account existence. No tokens
    # are minted on this path — the user must log in explicitly via /auth/login.
    return success_response(
        message="If this email is not already registered, your account has been created. Please log in to continue.",
    )


@router.post("/refresh")
def refresh(req: RefreshRequest, db: Session = Depends(get_db)):
    try:
        payload = decode_token(req.refreshToken)
    except HTTPException:
        return error_response("Invalid or expired refresh token", 401)

    if payload.get("type") != "refresh":
        return error_response("Invalid token type", 401)

    user_id = payload.get("user_id")
    if not user_id:
        return error_response("Invalid token: missing user_id", 401)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return error_response("User not found", 401)
    if user.status != "active":
        return error_response("User account is not active", 403)

    access_token, access_exp = create_access_token({"user_id": user.id, "role": user.role})
    refresh_token, refresh_exp = create_refresh_token({"user_id": user.id, "role": user.role})

    return success_response(
        data=TokenData(
            accessToken=access_token,
            refreshToken=refresh_token,
            accessTokenExpiry=access_exp,
            refreshTokenExpiry=refresh_exp,
        ).model_dump(),
        message="Token refreshed",
    )


@router.post("/logout")
def logout():
    return success_response(message="Logged out successfully")


@router.get("/profile")
def profile(current_user: User = Depends(get_current_user)):
    return success_response(
        data=UserResponse.model_validate(current_user).model_dump(by_alias=True),
        message="Profile retrieved",
    )
