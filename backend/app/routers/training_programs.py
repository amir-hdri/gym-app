from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import ProgramExercise, TrainingProgram, User
from app.responses import error_response, paginated_response, success_response
from app.schemas import (
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
    d["exercises"] = [
        ProgramExerciseResponse.model_validate(e).model_dump(by_alias=True)
        for e in program.exercises
    ]
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
    current_user: User = Depends(get_current_user),
):
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
    return success_response(data=_program_to_dict(program))


@router.put("/{program_id}")
def update_program(
    program_id: str,
    req: TrainingProgramUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    program = db.query(TrainingProgram).filter(TrainingProgram.id == program_id).first()
    if not program:
        return error_response("Program not found", 404)
    update_data = req.model_dump(exclude_unset=True, by_alias=False)
    for key, value in update_data.items():
        setattr(program, key, value)
    db.commit()
    db.refresh(program)
    return success_response(data=_program_to_dict(program), message="Program updated")


@router.delete("/{program_id}")
def delete_program(program_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    program = db.query(TrainingProgram).filter(TrainingProgram.id == program_id).first()
    if not program:
        return error_response("Program not found", 404)
    db.delete(program)
    db.commit()
    return success_response(message="Program deleted")


@router.post("/{program_id}/exercises")
def add_exercise_to_program(
    program_id: str,
    req: ProgramExerciseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    program = db.query(TrainingProgram).filter(TrainingProgram.id == program_id).first()
    if not program:
        return error_response("Program not found", 404)
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
    current_user: User = Depends(get_current_user),
):
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
    current_user: User = Depends(get_current_user),
):
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

    from datetime import datetime

    pe.is_completed = True
    pe.completed_at = datetime.utcnow()
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
