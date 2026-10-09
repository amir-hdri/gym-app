from datetime import datetime, timedelta, timezone
import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.auth import (
    PASSWORD_RESET_TTL_MINUTES,
    check_login_rate_limit,
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_reset_token,
    get_client_ip,
    get_current_user,
    hash_password,
    hash_reset_token,
    record_rate_limit_attempt,
    session_stamp,
    verify_password,
)
from app.config import settings
from app.database import get_db
from app.models import PasswordResetToken, User
from app.mail import send_password_reset
from app.responses import error_response, success_response
from app.schemas import (
    LoginRequest,
    PasswordChangeRequest,
    PasswordResetConfirm,
    PasswordResetRequest,
    ProfileUpdate,
    RefreshRequest,
    RegisterRequest,
    TokenData,
    UserResponse,
)

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])

logger = logging.getLogger("gym-app")


def _utcnow_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


@router.post("/login")
def login(req: LoginRequest, request: Request, db: Session = Depends(get_db)):
    # Rate limit by client IP (X-Forwarded-For only honored when TRUST_PROXY is
    # set, per auth.get_client_ip). The check runs first so an over-quota IP is
    # still 429'd, but the quota is consumed by failed attempts only — a
    # successful login never burns the bucket (test_successful_logins_do_not_consume_quota).
    client_ip = get_client_ip(request)
    check_login_rate_limit(client_ip)
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        record_rate_limit_attempt(client_ip)
        return error_response("Invalid email or password", 401)

    if user.status != "active":
        return error_response("User account is not active", 403)

    user.last_login_at = datetime.now(timezone.utc).replace(tzinfo=None)
    db.commit()

    claims = {"user_id": user.id, "role": user.role, "session": session_stamp(user)}
    access_token, access_exp = create_access_token(claims)
    refresh_token, refresh_exp = create_refresh_token(claims)

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
    # Registration spam protection: same in-memory limiter as login but under a
    # distinct identifier so signups compete with other signups, not with login
    # quota. Every registration attempt consumes quota regardless of outcome —
    # if a future switch to anti-enumeration stops returning tokens on this path,
    # the limiter still protects it.
    client_ip = get_client_ip(request)
    register_id = f"register:{client_ip}"
    check_login_rate_limit(register_id)
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        record_rate_limit_attempt(register_id)
        return error_response("Email already registered", 400)

    # Self-registration is always athlete — role is not accepted from client
    # to prevent privilege escalation. Admins use POST /users with AdminUserCreate.
    # An optional branch pick is honoured only when the branch exists; an
    # unknown id is ignored rather than failing signup.
    branch_id = None
    if req.branch_id:
        from app.models import Branch as _Branch

        if db.query(_Branch).filter(_Branch.id == req.branch_id).first():
            branch_id = req.branch_id
    user = User(
        email=req.email,
        password_hash=hash_password(req.password),
        first_name=req.first_name,
        last_name=req.last_name,
        phone=req.phone,
        role="athlete",
        branch_id=branch_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    record_rate_limit_attempt(register_id)

    claims = {"user_id": user.id, "role": user.role, "session": session_stamp(user)}
    access_token, access_exp = create_access_token(claims)
    refresh_token, refresh_exp = create_refresh_token(claims)

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
        message="Registration successful",
    )


@router.post("/refresh")
def refresh(req: RefreshRequest, db: Session = Depends(get_db)):
    try:
        payload = decode_token(req.refreshToken)
    except Exception:
        return error_response("Invalid or expired refresh token", 401)

    if payload.get("type") != "refresh":
        return error_response("Invalid token type", 401)

    user = db.query(User).filter(User.id == payload["user_id"]).first()
    if not user:
        return error_response("User not found", 401)
    import secrets
    if not secrets.compare_digest(str(payload.get("session", "")), session_stamp(user)):
        return error_response("Session expired; sign in again", 401)
    if user.status != "active":
        return error_response("User account is not active", 403)

    claims = {"user_id": user.id, "role": user.role, "session": session_stamp(user)}
    access_token, access_exp = create_access_token(claims)
    refresh_token, refresh_exp = create_refresh_token(claims)

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


@router.put("/profile")
def update_profile(
    req: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    update_data = req.model_dump(exclude_unset=True, by_alias=False)
    for key, value in update_data.items():
        setattr(current_user, key, value)
    db.commit()
    db.refresh(current_user)
    return success_response(
        data=UserResponse.model_validate(current_user).model_dump(by_alias=True),
        message="Profile updated",
    )


# ---- Password reset ----
#
# SMTP delivers the real link. Development can also return a local test token.


@router.post("/forgot-password")
def forgot_password(req: PasswordResetRequest, request: Request, db: Session = Depends(get_db)):
    # Every request consumes quota (like registration): the response never
    # reveals whether the email exists, so per-attempt charging cannot leak
    # enumeration signal — and without it this check could never fire.
    reset_id = f"reset:{get_client_ip(request)}"
    check_login_rate_limit(reset_id)
    record_rate_limit_attempt(reset_id)
    if settings.is_production and (not settings.SMTP_HOST or not settings.SMTP_FROM):
        return error_response("Password reset delivery is not configured", 503)
    user = db.query(User).filter(User.email == req.email).first()
    data = {"sent": True}

    if user is not None:
        now = _utcnow_naive()
        # Prune dead grants (used or expired) so the table cannot grow
        # unboundedly, then invalidate every outstanding one for this user.
        db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id,
            ((PasswordResetToken.used_at.is_not(None)) | (PasswordResetToken.expires_at <= now)),
        ).delete(synchronize_session="fetch")
        db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used_at.is_(None),
        ).update({"used_at": now}, synchronize_session="fetch")

        raw_token = generate_reset_token()
        db.add(
            PasswordResetToken(
                user_id=user.id,
                token_hash=hash_reset_token(raw_token),
                expires_at=now + timedelta(minutes=PASSWORD_RESET_TTL_MINUTES),
            )
        )
        if settings.SMTP_HOST and settings.SMTP_FROM:
            try:
                send_password_reset(user.email, raw_token)
            except Exception:
                db.rollback()
                # Do not include exception details: SMTP diagnostics can carry
                # recipient addresses or the message body containing the token.
                logger.error("Password reset delivery failed")
                return error_response("Password reset delivery failed. Try again later", 503)
        db.commit()
        if not settings.is_production:
            data["devToken"] = raw_token

    # Always 200 with the same shape: never reveal whether the email exists.
    return success_response(data=data, message="If the email exists, a reset link has been sent")


@router.post("/reset-password")
def reset_password(req: PasswordResetConfirm, request: Request, db: Session = Depends(get_db)):
    # Token-guessing protection: failed consumptions burn quota. A success
    # consumes the single-use grant itself, so it needs no extra charge.
    consume_id = f"consume:{get_client_ip(request)}"
    check_login_rate_limit(consume_id)

    def _reject():
        record_rate_limit_attempt(consume_id)
        return error_response("Invalid or expired reset token", 400)

    record = (
        db.query(PasswordResetToken)
        .filter(PasswordResetToken.token_hash == hash_reset_token(req.token))
        .first()
    )
    if record is None or record.used_at is not None:
        return _reject()
    if record.expires_at <= _utcnow_naive():
        return _reject()

    user = db.query(User).filter(User.id == record.user_id).first()
    if user is None:
        return _reject()

    user.password_hash = hash_password(req.password)
    # Single-use: remove the consumed grant instead of accumulating rows.
    db.delete(record)
    db.commit()
    return success_response(data={"reset": True}, message="Password reset")


@router.post("/change-password")
def change_password(
    req: PasswordChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(req.current_password, current_user.password_hash):
        return error_response("Current password is incorrect", 400)
    current_user.password_hash = hash_password(req.new_password)
    db.commit()
    return success_response(data={"changed": True}, message="Password changed")
