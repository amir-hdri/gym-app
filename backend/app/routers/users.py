from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth import get_current_user, hash_password
from app.database import get_db
from app.models import User
from app.responses import error_response, paginated_response, success_response
from app.schemas import RegisterRequest, UserCreate, UserResponse, UserStatusUpdate, UserUpdate

router = APIRouter(prefix="/api/v1/users", tags=["Users"])


@router.get("")
def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    role: str = None,
    status: str = None,
    search: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    if status:
        query = query.filter(User.status == status)
    if search:
        query = query.filter(
            User.first_name.ilike(f"%{search}%")
            | User.last_name.ilike(f"%{search}%")
            | User.email.ilike(f"%{search}%")
        )
    total = query.count()
    users = query.offset((page - 1) * page_size).limit(page_size).all()
    return paginated_response(
        data=[UserResponse.model_validate(u).model_dump(by_alias=True) for u in users],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{user_id}")
def get_user(user_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return error_response("User not found", 404)
    return success_response(data=UserResponse.model_validate(user).model_dump(by_alias=True))


@router.put("/{user_id}")
def update_user(
    user_id: str,
    req: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return error_response("User not found", 404)

    update_data = req.model_dump(exclude_unset=True, by_alias=False)
    if "password" in update_data:
        update_data["password_hash"] = hash_password(update_data.pop("password"))

    for key, value in update_data.items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)
    return success_response(data=UserResponse.model_validate(user).model_dump(by_alias=True), message="User updated")


@router.patch("/{user_id}/status")
def update_user_status(
    user_id: str,
    req: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return error_response("User not found", 404)
    user.status = req.status
    db.commit()
    db.refresh(user)
    return success_response(data=UserResponse.model_validate(user).model_dump(by_alias=True), message="Status updated")


@router.post("")
def create_user(
    req: RegisterRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        return error_response("Email already registered", 409)
    user = User(
        email=req.email,
        password_hash=hash_password(req.password),
        first_name=req.first_name,
        last_name=req.last_name,
        phone=req.phone or "",
        role=req.role or "athlete",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return success_response(
        data=UserResponse.model_validate(user).model_dump(by_alias=True),
        message="User created",
    )


@router.delete("/{user_id}")
def delete_user(user_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return error_response("User not found", 404)
    db.delete(user)
    db.commit()
    return success_response(message="User deleted")
