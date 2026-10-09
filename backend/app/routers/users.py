from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth import get_current_user, hash_password, require_roles
from app.database import get_db
from app.models import Branch, CheckIn, DailyReadiness, Goal, Membership, Notification, PasswordResetToken, User
from app.responses import error_response, paginated_response, success_response
from app.schemas import AdminUserCreate, PasswordSetRequest, UserResponse, UserRoleUpdate, UserStatusUpdate, UserUpdate

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
    # Athletes can only view themselves; coaches can view themselves + athletes
    if current_user.role == "athlete" and user_id != current_user.id:
        return error_response("Insufficient permissions", 403)
    if (
        current_user.role == "coach"
        and user_id != current_user.id
        and user.role != "athlete"
    ):
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
    if req.email is not None and req.email != user.email:
        taken = db.query(User).filter(User.email == req.email, User.id != user_id).first()
        if taken:
            return error_response("Email already registered", 409)
    update_data = req.model_dump(exclude_unset=True, by_alias=False)
    # Privilege-adjacent fields are staff-only even on self-updates, with one
    # exception: a member with no branch yet may pick their own (onboarding).
    # Retracting or switching branches stays a staff action.
    if current_user.role not in {"admin", "receptionist"}:
        update_data.pop("status", None)
        if user.branch_id is not None or update_data.get("branch_id") is None:
            update_data.pop("branch_id", None)
        elif not db.query(Branch).filter(Branch.id == update_data["branch_id"]).first():
            return error_response("Branch not found", 404)
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


@router.patch("/{user_id}/role")
def update_user_role(
    user_id: str,
    req: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin")),
):
    """The dedicated role-change endpoint: roles are immutable through the
    generic PUT (which strips them) and through self-registration (hardcoded
    athlete), so this admin-only path is the single way roles change."""
    allowed = {"athlete", "coach", "admin", "receptionist"}
    if req.role not in allowed:
        return error_response(f"Invalid role. Allowed: {', '.join(sorted(allowed))}", 400)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return error_response("User not found", 404)
    if user.id == current_user.id:
        return error_response("Cannot change your own role", 400)
    user.role = req.role
    db.commit()
    db.refresh(user)
    return success_response(data=UserResponse.model_validate(user).model_dump(by_alias=True), message="Role updated")


@router.post("/{user_id}/password")
def change_password(
    user_id: str,
    req: PasswordSetRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.id != user_id and current_user.role != "admin":
        return error_response("Insufficient permissions", 403)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return error_response("User not found", 404)
    # Self-service must verify current password; admin bypasses
    if current_user.id == user_id:
        from app.auth import verify_password

        if not req.current_password or not verify_password(req.current_password, user.password_hash):
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
    allowed_roles = {"athlete", "coach", "admin", "receptionist"}
    if req.role not in allowed_roles:
        return error_response(f"Invalid role. Allowed: {', '.join(sorted(allowed_roles))}", 400)
    if req.branch_id is not None:
        from app.models import Branch as _Branch

        if not db.query(_Branch).filter(_Branch.id == req.branch_id).first():
            return error_response("Branch not found", 404)
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
    # Cascade the user's directly-owned operational rows so no orphans
    # remain. Payments, training programs and messages are intentionally
    # kept: they are financial/historical/shared records with other parties,
    # and destroying them would rewrite the gym's audit trail.
    db.query(Membership).filter(Membership.user_id == user_id).delete(synchronize_session="fetch")
    db.query(CheckIn).filter(CheckIn.user_id == user_id).delete(synchronize_session="fetch")
    db.query(Goal).filter(Goal.athlete_id == user_id).delete(synchronize_session="fetch")
    db.query(Goal).filter(Goal.coach_id == user_id).update({"coach_id": None}, synchronize_session="fetch")
    db.query(Notification).filter(Notification.user_id == user_id).delete(synchronize_session="fetch")
    db.query(PasswordResetToken).filter(PasswordResetToken.user_id == user_id).delete(synchronize_session="fetch")
    db.query(DailyReadiness).filter(DailyReadiness.user_id == user_id).delete(synchronize_session="fetch")
    db.delete(user)
    db.commit()
    return success_response(message="User deleted")
