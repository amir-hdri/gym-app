from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
    hash_password,
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
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        return error_response("Invalid email or password", 401)

    if user.status != "active":
        return error_response("User account is not active", 403)

    user.last_login_at = datetime.utcnow()
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
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        return error_response("Email already registered", 400)

    user = User(
        email=req.email,
        password_hash=hash_password(req.password),
        first_name=req.first_name,
        last_name=req.last_name,
        phone=req.phone,
        role=req.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

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
