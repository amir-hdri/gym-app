from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth import get_current_user, hash_password, require_roles, verify_password
from app.database import get_db
from app.models import Branch, User
from app.responses import error_response, paginated_response, success_response
from app.schemas import (
    AdminUserCreate,
    PasswordChangeRequest,
    UserResponse,
    UserStatusUpdate,
    UserUpdate,
)

router = APIRouter(prefix="/api/v1/users", tags=["Users"])


@router.get("")
def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    role: str | None = None,
    status: str | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Athletes can only list themselves (privacy); coaches see athletes only
    if current_user.role == "athlete":
        return paginated_response(
            data=[UserResponse.model_validate(current_user).model_dump(by_alias=True)],
            total=1,
            page=page,
            page_size=page_size,
        )
    if current_user.role == "coach":
        role = "athlete"
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    if status:
        query = query.filter(User.status == status)
    if search:
        # Escape LIKE wildcards so a literal %/_ in the term can't widen the match
        escaped = search.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        like = f"%{escaped}%"
        query = query.filter(
            User.first_name.ilike(like, escape="\\")
            | User.last_name.ilike(like, escape="\\")
            | User.email.ilike(like, escape="\\")
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
    # Athletes can only view themselves; coaches can view themselves + athletes
    if current_user.role == "athlete" and user_id != current_user.id:
        return error_response("Insufficient permissions", 403)
    if current_user.role == "coach" and user_id != current_user.id and user.role != "athlete":
        return error_response("Insufficient permissions", 403)
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
    # Only self or admin/receptionist can update
    if current_user.id != user_id and current_user.role not in {"admin", "receptionist"}:
        return error_response("Insufficient permissions", 403)
    update_data = req.model_dump(exclude_unset=True, by_alias=False)
    # Privilege-adjacent fields are staff-only even on self-updates
    if current_user.role not in {"admin", "receptionist"}:
        update_data.pop("status", None)
        update_data.pop("branch_id", None)
    # Email must stay unique — pre-check to return 409 instead of a 500 IntegrityError
    new_email = update_data.get("email")
    if new_email and new_email != user.email and db.query(User).filter(User.email == new_email).first():
        return error_response("Email already registered", 409)
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
    current_user: User = Depends(require_roles("admin", "receptionist")),
):
    allowed = {"active", "inactive", "suspended", "pending"}
    if req.status not in allowed:
        return error_response(f"Invalid status. Allowed: {', '.join(sorted(allowed))}", 400)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return error_response("User not found", 404)
    user.status = req.status
    db.commit()
    db.refresh(user)
    return success_response(data=UserResponse.model_validate(user).model_dump(by_alias=True), message="Status updated")


@router.post("/{user_id}/password")
def change_password(
    user_id: str,
    req: PasswordChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.id != user_id and current_user.role != "admin":
        return error_response("Insufficient permissions", 403)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return error_response("User not found", 404)
    # Self-service must verify current password; admin bypasses
    if current_user.id == user_id and not verify_password(req.current_password, user.password_hash):
        return error_response("Current password is incorrect", 401)
    user.password_hash = hash_password(req.new_password)
    db.commit()
    return success_response(message="Password updated")


@router.post("")
def create_user(
    req: AdminUserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "receptionist")),
):
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        return error_response("Email already registered", 409)
    if req.branch_id and not db.query(Branch).filter(Branch.id == req.branch_id).first():
        return error_response("Branch not found", 404)
    allowed_roles = {"athlete", "coach", "admin", "receptionist"}
    if req.role not in allowed_roles:
        return error_response(f"Invalid role. Allowed: {', '.join(sorted(allowed_roles))}", 400)
    user = User(
        email=req.email,
        password_hash=hash_password(req.password),
        first_name=req.first_name,
        last_name=req.last_name,
        phone=req.phone or "",
        role=req.role,
        status=req.status,
        branch_id=req.branch_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return success_response(
        data=UserResponse.model_validate(user).model_dump(by_alias=True),
        message="User created",
    )


@router.delete("/{user_id}")
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin")),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return error_response("User not found", 404)
    if user.id == current_user.id:
        return error_response("Cannot delete your own account", 400)
    # Bulk delete (not session.delete): the User's selectin-loaded children
    # would otherwise get their FKs nullified by the ORM unit of work, which
    # violates the NOT NULL FK columns. DB-level ondelete="CASCADE" (enforced
    # via PRAGMA foreign_keys=ON) removes the dependent rows instead.
    db.query(User).filter(User.id == user_id).delete(synchronize_session=False)
    db.commit()
    return success_response(message="User deleted")
