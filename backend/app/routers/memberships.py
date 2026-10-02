from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth import get_current_user, require_roles
from app.database import get_db
from app.models import Branch, Membership, MembershipPlan, User
from app.responses import error_response, paginated_response, success_response
from app.schemas import MembershipCreate, MembershipResponse, MembershipUpdate

router = APIRouter(prefix="/api/v1/memberships", tags=["Memberships"])


@router.get("")
def list_memberships(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    user_id: str | None = None,
    plan_id: str | None = None,
    branch_id: str | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Athletes can only see their own memberships
    if current_user.role == "athlete":
        user_id = user_id or current_user.id
        if user_id != current_user.id:
            return error_response("Insufficient permissions", 403)
    query = db.query(Membership)
    if user_id:
        query = query.filter(Membership.user_id == user_id)
    if plan_id:
        query = query.filter(Membership.plan_id == plan_id)
    if branch_id:
        query = query.filter(Membership.branch_id == branch_id)
    if status:
        query = query.filter(Membership.status == status)
    total = query.count()
    memberships = query.offset((page - 1) * page_size).limit(page_size).all()
    data = []
    for m in memberships:
        d = MembershipResponse.model_validate(m).model_dump(by_alias=True)
        d["sessionsRemaining"] = m.sessions_total - m.sessions_used
        data.append(d)
    return paginated_response(data=data, total=total, page=page, page_size=page_size)


@router.post("")
def create_membership(
    req: MembershipCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "receptionist")),
):
    if not db.query(User).filter(User.id == req.user_id).first():
        return error_response("User not found", 404)
    if not db.query(MembershipPlan).filter(MembershipPlan.id == req.plan_id).first():
        return error_response("Membership plan not found", 404)
    if req.branch_id and not db.query(Branch).filter(Branch.id == req.branch_id).first():
        return error_response("Branch not found", 404)
    membership = Membership(**req.model_dump(by_alias=False))
    db.add(membership)
    db.commit()
    db.refresh(membership)
    return success_response(
        data=MembershipResponse.model_validate(membership).model_dump(by_alias=True),
        message="Membership created",
    )


@router.get("/{membership_id}")
def get_membership(membership_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    membership = db.query(Membership).filter(Membership.id == membership_id).first()
    if not membership:
        return error_response("Membership not found", 404)
    if current_user.role == "athlete" and membership.user_id != current_user.id:
        return error_response("Insufficient permissions", 403)
    d = MembershipResponse.model_validate(membership).model_dump(by_alias=True)
    d["sessionsRemaining"] = membership.sessions_total - membership.sessions_used
    return success_response(data=d)


@router.put("/{membership_id}")
def update_membership(
    membership_id: str,
    req: MembershipUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "receptionist")),
):
    membership = db.query(Membership).filter(Membership.id == membership_id).first()
    if not membership:
        return error_response("Membership not found", 404)
    update_data = req.model_dump(exclude_unset=True, by_alias=False)
    for key, value in update_data.items():
        setattr(membership, key, value)
    db.commit()
    db.refresh(membership)
    d = MembershipResponse.model_validate(membership).model_dump(by_alias=True)
    d["sessionsRemaining"] = membership.sessions_total - membership.sessions_used
    return success_response(data=d, message="Membership updated")


@router.post("/{membership_id}/freeze")
def freeze_membership(
    membership_id: str,
    req: MembershipUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "receptionist")),
):
    membership = db.query(Membership).filter(Membership.id == membership_id).first()
    if not membership:
        return error_response("Membership not found", 404)
    if membership.status != "active":
        return error_response("Only active memberships can be frozen", 400)
    membership.status = "frozen"
    membership.freeze_reason = req.freeze_reason
    membership.freeze_end_date = req.freeze_end_date
    db.commit()
    db.refresh(membership)
    return success_response(
        data=MembershipResponse.model_validate(membership).model_dump(by_alias=True),
        message="Membership frozen",
    )


@router.post("/{membership_id}/unfreeze")
def unfreeze_membership(
    membership_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "receptionist")),
):
    membership = db.query(Membership).filter(Membership.id == membership_id).first()
    if not membership:
        return error_response("Membership not found", 404)
    if membership.status != "frozen":
        return error_response("Membership is not frozen", 400)
    membership.status = "active"
    membership.freeze_reason = None
    membership.freeze_end_date = None
    db.commit()
    db.refresh(membership)
    return success_response(
        data=MembershipResponse.model_validate(membership).model_dump(by_alias=True),
        message="Membership unfrozen",
    )


@router.post("/{membership_id}/deduct")
def deduct_session(
    membership_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "receptionist", "coach")),
):
    membership = db.query(Membership).filter(Membership.id == membership_id).first()
    if not membership:
        return error_response("Membership not found", 404)
    if membership.status != "active":
        return error_response("Membership is not active", 400)
    if membership.sessions_used >= membership.sessions_total:
        return error_response("No remaining sessions", 400)
    membership.sessions_used += 1
    db.commit()
    db.refresh(membership)
    d = MembershipResponse.model_validate(membership).model_dump(by_alias=True)
    d["sessionsRemaining"] = membership.sessions_total - membership.sessions_used
    return success_response(data=d, message="Session deducted")
