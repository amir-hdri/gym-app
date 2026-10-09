from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth import get_current_user, require_roles
from app.database import get_db
from app.models import Branch, Membership, MembershipPlan, TrainingProgram, User
from app.responses import error_response, paginated_response, success_response
from app.schemas import MembershipCreate, MembershipRenew, MembershipResponse, MembershipUpdate

router = APIRouter(prefix="/api/v1/memberships", tags=["Memberships"])


@router.get("")
def list_memberships(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    user_id: str = None,
    plan_id: str = None,
    branch_id: str = None,
    status: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Athletes can only see their own memberships
    if current_user.role == "athlete":
        user_id = user_id or current_user.id
        if user_id != current_user.id:
            return error_response("Insufficient permissions", 403)
    query = db.query(Membership)
    if current_user.role == "coach":
        query = query.filter(Membership.user_id.in_(db.query(TrainingProgram.athlete_id).filter(TrainingProgram.coach_id == current_user.id)))
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
        data.append(MembershipResponse.model_validate(m).model_dump(by_alias=True))
    return paginated_response(data=data, total=total, page=page, page_size=page_size)


@router.post("")
def create_membership(
    req: MembershipCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "receptionist", "coach")),
):
    # Coaches may only enrol their own athletes (same TrainingProgram-based
    # definition the list endpoint uses) — previously a coach-created athlete
    # was stuck with no membership until an admin stepped in.
    if current_user.role == "coach":
        coached = (
            db.query(TrainingProgram.id)
            .filter(
                TrainingProgram.coach_id == current_user.id,
                TrainingProgram.athlete_id == req.user_id,
            )
            .first()
        )
        if not coached:
            return error_response("Coaches can only create memberships for their own athletes", 403)
    for model, reference in ((User, req.user_id), (MembershipPlan, req.plan_id), (Branch, req.branch_id)):
        if not db.query(model).filter(model.id == reference).first():
            return error_response(f"{model.__name__} not found", 404)
    if req.end_date <= req.start_date or req.sessions_used > req.sessions_total:
        return error_response("Invalid membership dates or session balance", 400)
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
    if current_user.role == "coach" and not db.query(TrainingProgram).filter(TrainingProgram.athlete_id == membership.user_id, TrainingProgram.coach_id == current_user.id).first():
        return error_response("Insufficient permissions", 403)
    if current_user.role == "athlete" and membership.user_id != current_user.id:
        return error_response("Insufficient permissions", 403)
    d = MembershipResponse.model_validate(membership).model_dump(by_alias=True)
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
    used = update_data.get("sessions_used", membership.sessions_used)
    total = update_data.get("sessions_total", membership.sessions_total)
    end = update_data.get("end_date", membership.end_date)
    if used is None or total is None or used > total or end is None or end.replace(tzinfo=None) <= membership.start_date:
        return error_response("Invalid membership dates or session balance", 400)
    for key, value in update_data.items():
        setattr(membership, key, value)
    db.commit()
    db.refresh(membership)
    d = MembershipResponse.model_validate(membership).model_dump(by_alias=True)
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


@router.post("/{membership_id}/renew")
def renew_membership(
    membership_id: str,
    req: MembershipRenew,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Start a new term: pushes end_date out, reactivates (clearing any
    freeze), optionally resets session counters. Staff may renew anyone;
    athletes may renew their own (payment for the term is recorded
    separately via POST /payments). Previously renewal required a staffer
    to hand-edit dates through the generic PUT."""
    membership = db.query(Membership).filter(Membership.id == membership_id).first()
    if not membership:
        return error_response("Membership not found", 404)
    if current_user.role == "athlete":
        if membership.user_id != current_user.id:
            return error_response("Insufficient permissions", 403)
    elif current_user.role not in ("admin", "receptionist"):
        return error_response("Insufficient permissions", 403)
    end = req.end_date.replace(tzinfo=None) if req.end_date.tzinfo else req.end_date
    if end <= membership.start_date:
        return error_response("New end date must be after the term start", 400)
    membership.end_date = req.end_date
    membership.status = "active"
    membership.freeze_reason = None
    membership.freeze_end_date = None
    if req.sessions_total is not None:
        membership.sessions_total = req.sessions_total
    if req.reset_sessions_used:
        membership.sessions_used = 0
    db.commit()
    db.refresh(membership)
    return success_response(
        data=MembershipResponse.model_validate(membership).model_dump(by_alias=True),
        message="Membership renewed",
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
@router.post("/{membership_id}/deduct-session")
def deduct_session(
    membership_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "receptionist", "coach")),
):
    membership = db.query(Membership).filter(Membership.id == membership_id).first()
    if not membership:
        return error_response("Membership not found", 404)
    if current_user.role == "coach" and not db.query(TrainingProgram).filter(TrainingProgram.athlete_id == membership.user_id, TrainingProgram.coach_id == current_user.id).first():
        return error_response("Insufficient permissions", 403)
    if membership.status != "active":
        return error_response("Membership is not active", 400)
    if membership.sessions_used >= membership.sessions_total:
        return error_response("No remaining sessions", 400)
    membership.sessions_used += 1
    db.commit()
    db.refresh(membership)
    d = MembershipResponse.model_validate(membership).model_dump(by_alias=True)
    return success_response(data=d, message="Session deducted")
