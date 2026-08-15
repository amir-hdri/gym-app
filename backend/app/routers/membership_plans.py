from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import MembershipPlan, User
from app.responses import error_response, success_response
from app.schemas import MembershipPlanCreate, MembershipPlanResponse, MembershipPlanUpdate

router = APIRouter(prefix="/api/v1/membership-plans", tags=["Membership Plans"])


@router.get("")
def list_plans(
    branch_id: str = None,
    is_active: bool = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(MembershipPlan)
    if branch_id:
        query = query.filter(MembershipPlan.branch_id == branch_id)
    if is_active is not None:
        query = query.filter(MembershipPlan.is_active == is_active)
    plans = query.all()
    return success_response(
        data=[MembershipPlanResponse.model_validate(p).model_dump(by_alias=True) for p in plans]
    )


@router.post("")
def create_plan(
    req: MembershipPlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = MembershipPlan(**req.model_dump(by_alias=False))
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return success_response(
        data=MembershipPlanResponse.model_validate(plan).model_dump(by_alias=True),
        message="Plan created",
    )


@router.get("/{plan_id}")
def get_plan(plan_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    plan = db.query(MembershipPlan).filter(MembershipPlan.id == plan_id).first()
    if not plan:
        return error_response("Plan not found", 404)
    return success_response(data=MembershipPlanResponse.model_validate(plan).model_dump(by_alias=True))


@router.put("/{plan_id}")
def update_plan(
    plan_id: str,
    req: MembershipPlanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = db.query(MembershipPlan).filter(MembershipPlan.id == plan_id).first()
    if not plan:
        return error_response("Plan not found", 404)
    update_data = req.model_dump(exclude_unset=True, by_alias=False)
    for key, value in update_data.items():
        setattr(plan, key, value)
    db.commit()
    db.refresh(plan)
    return success_response(
        data=MembershipPlanResponse.model_validate(plan).model_dump(by_alias=True),
        message="Plan updated",
    )
