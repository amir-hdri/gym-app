from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth import get_current_user, require_roles
from app.database import get_db
from app.models import Exercise, ProgramExercise, TrainingProgram, User
from app.responses import error_response, paginated_response, success_response
from app.schemas import (
    ExerciseResponse,
    ProgramExerciseCreate,
    ProgramExerciseCompletion,
    ProgramExerciseResponse,
    ProgramExerciseUpdate,
    TrainingProgramCreate,
    TrainingProgramResponse,
    TrainingProgramUpdate,
    UserResponse,
)

router = APIRouter(prefix="/api/v1/training-programs", tags=["Training Programs"])


def _program_to_dict(program: TrainingProgram) -> dict:
    d = TrainingProgramResponse.model_validate(program).model_dump(by_alias=True)
    exercises = []
    for e in program.exercises or []:
        ed = ProgramExerciseResponse.model_validate(e).model_dump(by_alias=True)
        if e.exercise is not None:
            ed["exercise"] = ExerciseResponse.model_validate(e.exercise).model_dump(by_alias=True)
        exercises.append(ed)
    d["exercises"] = exercises
    for relation in ("coach", "athlete"):
        person = getattr(program, relation, None)
        if person is not None:
            d[relation] = UserResponse.model_validate(person).model_dump(by_alias=True)
    return d


@router.get("")
def list_programs(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    athlete_id: str = None,
    coach_id: str = None,
    status: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Athletes see only their own programs
    if current_user.role == "athlete":
        athlete_id = athlete_id or current_user.id
        if athlete_id != current_user.id:
            return error_response("Insufficient permissions", 403)
    query = db.query(TrainingProgram)
    if athlete_id:
        query = query.filter(TrainingProgram.athlete_id == athlete_id)
    if coach_id:
        query = query.filter(TrainingProgram.coach_id == coach_id)
    if status:
        query = query.filter(TrainingProgram.status == status)
    total = query.count()
    programs = query.offset((page - 1) * page_size).limit(page_size).all()
    return paginated_response(
        data=[_program_to_dict(p) for p in programs],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("")
def create_program(
    req: TrainingProgramCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "coach")),
):
    # Coaches can only create programs under their own coaching
    if current_user.role == "coach" and req.coach_id != current_user.id:
        return error_response("Insufficient permissions", 403)
    # Referenced parties must exist with the right roles — previously any
    # string was accepted and surfaced later as a broken program detail.
    athlete = db.query(User).filter(User.id == req.athlete_id).first()
    if not athlete or athlete.role != "athlete":
        return error_response("Athlete not found", 404)
    coach = db.query(User).filter(User.id == req.coach_id).first()
    if not coach or coach.role != "coach":
        return error_response("Coach not found", 404)
    program = TrainingProgram(**req.model_dump(by_alias=False))
    db.add(program)
    db.commit()
    db.refresh(program)
    return success_response(data=_program_to_dict(program), message="Program created")


@router.get("/{program_id}")
def get_program(program_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    program = db.query(TrainingProgram).filter(TrainingProgram.id == program_id).first()
    if not program:
        return error_response("Program not found", 404)
    if current_user.role == "athlete" and program.athlete_id != current_user.id:
        return error_response("Insufficient permissions", 403)
    return success_response(data=_program_to_dict(program))


@router.put("/{program_id}")
def update_program(
    program_id: str,
    req: TrainingProgramUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "coach")),
):
    program = db.query(TrainingProgram).filter(TrainingProgram.id == program_id).first()
    if not program:
        return error_response("Program not found", 404)
    if current_user.role == "coach" and program.coach_id != current_user.id:
        return error_response("Insufficient permissions", 403)
    update_data = req.model_dump(exclude_unset=True, by_alias=False)
    for key, value in update_data.items():
        setattr(program, key, value)
    db.commit()
    db.refresh(program)
    return success_response(data=_program_to_dict(program), message="Program updated")


@router.delete("/{program_id}")
def delete_program(program_id: str, db: Session = Depends(get_db), current_user: User = Depends(require_roles("admin", "coach"))):
    program = db.query(TrainingProgram).filter(TrainingProgram.id == program_id).first()
    if not program:
        return error_response("Program not found", 404)
    if current_user.role == "coach" and program.coach_id != current_user.id:
        return error_response("Insufficient permissions", 403)
    db.delete(program)
    db.commit()
    return success_response(message="Program deleted")


@router.post("/{program_id}/exercises")
def add_exercise_to_program(
    program_id: str,
    req: ProgramExerciseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "coach")),
):
    program = db.query(TrainingProgram).filter(TrainingProgram.id == program_id).first()
    if not program:
        return error_response("Program not found", 404)
    if current_user.role == "coach" and program.coach_id != current_user.id:
        return error_response("Insufficient permissions", 403)
    exercise = db.query(Exercise).filter(Exercise.id == req.exercise_id).first()
    if not exercise:
        return error_response("Exercise not found", 404)
    pe = ProgramExercise(program_id=program_id, **req.model_dump(by_alias=False))
    db.add(pe)
    db.commit()
    db.refresh(pe)
    return success_response(
        data=ProgramExerciseResponse.model_validate(pe).model_dump(by_alias=True),
        message="Exercise added to program",
    )


@router.put("/{program_id}/exercises/{exercise_id}")
def update_exercise_in_program(
    program_id: str,
    exercise_id: str,
    req: ProgramExerciseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "coach")),
):
    program = db.query(TrainingProgram).filter(TrainingProgram.id == program_id).first()
    if not program:
        return error_response("Program not found", 404)
    if current_user.role == "coach" and program.coach_id != current_user.id:
        return error_response("Insufficient permissions", 403)
    pe = (
        db.query(ProgramExercise)
        .filter(
            ProgramExercise.id == exercise_id,
            ProgramExercise.program_id == program_id,
        )
        .first()
    )
    if not pe:
        return error_response("Exercise not found in program", 404)
    update_data = req.model_dump(exclude_unset=True, by_alias=False)
    for key, value in update_data.items():
        setattr(pe, key, value)
    db.commit()
    db.refresh(pe)
    return success_response(
        data=ProgramExerciseResponse.model_validate(pe).model_dump(by_alias=True),
        message="Exercise updated",
    )


@router.delete("/{program_id}/exercises/{exercise_id}")
def remove_exercise_from_program(
    program_id: str,
    exercise_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "coach")),
):
    program = db.query(TrainingProgram).filter(TrainingProgram.id == program_id).first()
    if not program:
        return error_response("Program not found", 404)
    if current_user.role == "coach" and program.coach_id != current_user.id:
        return error_response("Insufficient permissions", 403)
    pe = (
        db.query(ProgramExercise)
        .filter(
            ProgramExercise.id == exercise_id,
            ProgramExercise.program_id == program_id,
        )
        .first()
    )
    if not pe:
        return error_response("Exercise not found in program", 404)
    db.delete(pe)
    db.commit()
    return success_response(message="Exercise removed from program")


@router.post("/{program_id}/exercises/{exercise_id}/complete")
@router.patch("/{program_id}/exercises/{exercise_id}/complete")
def complete_exercise(
    program_id: str,
    exercise_id: str,
    req: ProgramExerciseCompletion,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    program = db.query(TrainingProgram).filter(TrainingProgram.id == program_id).first()
    if not program:
        return error_response("Program not found", 404)
    # Athletes complete only their own program; coaches only theirs; admins
    # bypass. Every other role (receptionist, etc.) is denied explicitly —
    # previously a receptionist fell through to success.
    if current_user.role == "athlete":
        if program.athlete_id != current_user.id:
            return error_response("Insufficient permissions", 403)
    elif current_user.role == "coach":
        if program.coach_id != current_user.id:
            return error_response("Insufficient permissions", 403)
    elif current_user.role != "admin":
        return error_response("Insufficient permissions", 403)
    pe = (
        db.query(ProgramExercise)
        .filter(
            ProgramExercise.id == exercise_id,
            ProgramExercise.program_id == program_id,
        )
        .first()
    )
    if not pe:
        return error_response("Exercise not found in program", 404)

    from datetime import datetime, timezone

    pe.is_completed = req.completed
    if req.completed:
        # Every (re-)completion stamps now — a stale first-completion time
        # previously survived forever and mis-ordered history views.
        pe.completed_at = datetime.now(timezone.utc).replace(tzinfo=None)
    else:
        pe.completed_at = None
    pe.actual_sets = req.actual_sets if req.actual_sets is not None else (pe.sets if req.completed else None)
    if req.actual_reps is not None:
        pe.actual_reps = req.actual_reps
    if req.actual_weight is not None:
        pe.actual_weight = req.actual_weight

    db.commit()
    db.refresh(pe)
    return success_response(
        data=ProgramExerciseResponse.model_validate(pe).model_dump(by_alias=True),
        message="Exercise completed",
    )
