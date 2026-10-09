from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Goal, User
from app.responses import error_response, paginated_response, success_response
from app.schemas import GoalCreate, GoalProgressUpdate, GoalResponse, GoalUpdate

router = APIRouter(prefix="/api/v1/goals", tags=["Goals"])


def _check_goal_assignment(goal: Goal, current_user: User):
    """The single rule for acting on a goal (update / progress / delete).

    - Athlete: only their own goal.
    - Coach: only their assigned goal, or an unassigned one (claim).
    - Admin: any.
    - Any other role (receptionist, ...): denied — goals are coaching
      domain, matching the DELETE contract below. Previously PUT/progress
      let a receptionist edit any goal while DELETE 403'd them.
    Returns an error_response to return, or None when allowed.
    """
    if current_user.role == "athlete" and goal.athlete_id != current_user.id:
        return error_response("Insufficient permissions", 403)
    if current_user.role == "coach" and goal.coach_id != current_user.id and goal.coach_id is not None:
        return error_response("Insufficient permissions", 403)
    if current_user.role not in ("athlete", "coach", "admin"):
        return error_response("Insufficient permissions", 403)
    return None


@router.get("")
def list_goals(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    athlete_id: str = None,
    athleteId: str = None,
    coach_id: str = None,
    coachId: str = None,
    status: str = None,
    category: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Accept both camelCase and snake_case filter spellings (the frontend mixes them).
    athlete_id = athlete_id or athleteId
    coach_id = coach_id or coachId
    # Athletes see only their own goals
    if current_user.role == "athlete":
        athlete_id = athlete_id or current_user.id
        if athlete_id != current_user.id:
            return error_response("Insufficient permissions", 403)
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
    # Athletes can only create goals for themselves
    if current_user.role == "athlete" and req.athlete_id != current_user.id:
        return error_response("Insufficient permissions", 403)
    # The goal owner must be an actual athlete, and an assigned coach an
    # actual coach — previously any user id (even a coach or admin) was
    # accepted as the athlete side.
    athlete = db.query(User).filter(User.id == req.athlete_id).first()
    if not athlete or athlete.role != "athlete":
        return error_response("Athlete not found", 404)
    if req.coach_id is not None:
        coach = db.query(User).filter(User.id == req.coach_id).first()
        if not coach or coach.role != "coach":
            return error_response("Coach not found", 404)
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
    if current_user.role == "athlete" and goal.athlete_id != current_user.id:
        return error_response("Insufficient permissions", 403)
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
    denied = _check_goal_assignment(goal, current_user)
    if denied:
        return denied
    update_data = req.model_dump(exclude_unset=True, by_alias=False)
    for key, value in update_data.items():
        setattr(goal, key, value)
    db.commit()
    db.refresh(goal)
    return success_response(
        data=GoalResponse.model_validate(goal).model_dump(by_alias=True),
        message="Goal updated",
    )


@router.delete("/{goal_id}")
def delete_goal(
    goal_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        return error_response("Goal not found", 404)
    # Owner athlete, the assigned coach, or an admin.
    if current_user.role == "athlete":
        if goal.athlete_id != current_user.id:
            return error_response("Insufficient permissions", 403)
    elif current_user.role == "coach":
        if goal.coach_id is not None and goal.coach_id != current_user.id:
            return error_response("Insufficient permissions", 403)
    elif current_user.role != "admin":
        return error_response("Insufficient permissions", 403)
    db.delete(goal)
    db.commit()
    return success_response(message="Goal deleted")


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
    denied = _check_goal_assignment(goal, current_user)
    if denied:
        return denied
    goal.current_value = req.current_value
    if goal.current_value >= goal.target_value and goal.status not in ("achieved", "missed"):
        goal.status = "achieved"
    db.commit()
    db.refresh(goal)
    return success_response(
        data=GoalResponse.model_validate(goal).model_dump(by_alias=True),
        message="Progress updated",
    )
