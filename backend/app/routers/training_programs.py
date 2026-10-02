from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth import get_current_user, require_roles
from app.database import get_db
from app.models import ProgramExercise, TrainingProgram, User
from app.responses import error_response, paginated_response, success_response
from app.schemas import (
    ExerciseResponse,
    ProgramExerciseCreate,
    ProgramExerciseResponse,
    ProgramExerciseUpdate,
    TrainingProgramCreate,
    TrainingProgramResponse,
    TrainingProgramUpdate,
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
    return d


@router.get("")
def list_programs(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    athlete_id: str | None = None,
    coach_id: str | None = None,
    status: str | None = None,
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
    if not db.query(User).filter(User.id == req.athlete_id).first():
        return error_response("Athlete not found", 404)
    if not db.query(User).filter(User.id == req.coach_id).first():
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
def delete_program(
    program_id: str, db: Session = Depends(get_db), current_user: User = Depends(require_roles("admin", "coach"))
):
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
    req: ProgramExerciseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    program = db.query(TrainingProgram).filter(TrainingProgram.id == program_id).first()
    if not program:
        return error_response("Program not found", 404)
    # Only the program's athlete (owner), the assigned coach, or an admin may
    # mark exercises complete. Everyone else (other athletes/coaches,
    # receptionists, ...) gets 403.
    is_owner_athlete = current_user.role == "athlete" and program.athlete_id == current_user.id
    is_assigned_coach = current_user.role == "coach" and program.coach_id == current_user.id
    if not (is_owner_athlete or is_assigned_coach or current_user.role == "admin"):
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

    pe.is_completed = True
    pe.completed_at = datetime.now(UTC).replace(tzinfo=None)
    if req.actual_sets is not None:
        pe.actual_sets = req.actual_sets
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
