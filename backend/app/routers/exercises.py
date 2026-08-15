from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Exercise, User
from app.responses import error_response, paginated_response, success_response
from app.schemas import ExerciseCreate, ExerciseResponse, ExerciseUpdate

router = APIRouter(prefix="/api/v1/exercises", tags=["Exercises"])


@router.get("")
def list_exercises(
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    category: str = None,
    muscle_group: str = None,
    difficulty: str = None,
    search: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Exercise).filter(Exercise.is_active == True)
    if category:
        query = query.filter(Exercise.category == category)
    if muscle_group:
        query = query.filter(Exercise.muscle_group == muscle_group)
    if difficulty:
        query = query.filter(Exercise.difficulty == difficulty)
    if search:
        query = query.filter(
            Exercise.name.ilike(f"%{search}%")
            | Exercise.name_en.ilike(f"%{search}%")
        )
    total = query.count()
    exercises = query.offset((page - 1) * page_size).limit(page_size).all()
    return paginated_response(
        data=[ExerciseResponse.model_validate(e).model_dump(by_alias=True) for e in exercises],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("")
def create_exercise(
    req: ExerciseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    exercise = Exercise(**req.model_dump(by_alias=False))
    db.add(exercise)
    db.commit()
    db.refresh(exercise)
    return success_response(
        data=ExerciseResponse.model_validate(exercise).model_dump(by_alias=True),
        message="Exercise created",
    )


@router.get("/{exercise_id}")
def get_exercise(exercise_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not exercise:
        return error_response("Exercise not found", 404)
    return success_response(data=ExerciseResponse.model_validate(exercise).model_dump(by_alias=True))


@router.put("/{exercise_id}")
def update_exercise(
    exercise_id: str,
    req: ExerciseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not exercise:
        return error_response("Exercise not found", 404)
    update_data = req.model_dump(exclude_unset=True, by_alias=False)
    for key, value in update_data.items():
        setattr(exercise, key, value)
    db.commit()
    db.refresh(exercise)
    return success_response(
        data=ExerciseResponse.model_validate(exercise).model_dump(by_alias=True),
        message="Exercise updated",
    )
