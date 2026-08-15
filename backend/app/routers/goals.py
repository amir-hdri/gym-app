from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Goal, User
from app.responses import error_response, paginated_response, success_response
from app.schemas import GoalCreate, GoalProgressUpdate, GoalResponse, GoalUpdate

router = APIRouter(prefix="/api/v1/goals", tags=["Goals"])


@router.get("")
def list_goals(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    athlete_id: str = None,
    coach_id: str = None,
    status: str = None,
    category: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Goal)
    if athlete_id:
        query = query.filter(Goal.athlete_id == athlete_id)
    if coach_id:
        query = query.filter(Goal.coach_id == coach_id)
    if status:
        query = query.filter(Goal.status == status)
    if category:
        query = query.filter(Goal.category == category)
    total = query.count()
    goals = query.offset((page - 1) * page_size).limit(page_size).all()
    return paginated_response(
        data=[GoalResponse.model_validate(g).model_dump(by_alias=True) for g in goals],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("")
def create_goal(
    req: GoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = Goal(**req.model_dump(by_alias=False))
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return success_response(
        data=GoalResponse.model_validate(goal).model_dump(by_alias=True),
        message="Goal created",
    )


@router.get("/{goal_id}")
def get_goal(goal_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        return error_response("Goal not found", 404)
    return success_response(data=GoalResponse.model_validate(goal).model_dump(by_alias=True))


@router.put("/{goal_id}")
def update_goal(
    goal_id: str,
    req: GoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        return error_response("Goal not found", 404)
    update_data = req.model_dump(exclude_unset=True, by_alias=False)
    for key, value in update_data.items():
        setattr(goal, key, value)
    db.commit()
    db.refresh(goal)
    return success_response(
        data=GoalResponse.model_validate(goal).model_dump(by_alias=True),
        message="Goal updated",
    )


@router.post("/{goal_id}/progress")
@router.patch("/{goal_id}/progress")
def update_goal_progress(
    goal_id: str,
    req: GoalProgressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        return error_response("Goal not found", 404)
    goal.current_value = req.current_value
    if goal.current_value >= goal.target_value and goal.status not in ("achieved", "missed"):
        goal.status = "achieved"
    db.commit()
    db.refresh(goal)
    return success_response(
        data=GoalResponse.model_validate(goal).model_dump(by_alias=True),
        message="Progress updated",
    )
