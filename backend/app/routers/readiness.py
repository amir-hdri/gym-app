from datetime import datetime
from typing import Literal
from zoneinfo import ZoneInfo
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.auth import get_current_user
from app.database import get_db
from app.models import DailyReadiness, TrainingProgram, User
from app.responses import error_response, success_response
from app.schemas import BaseSchema

router = APIRouter(prefix="/api/v1/readiness", tags=["Readiness"])

class ReadinessInput(BaseSchema):
    state: Literal["energized", "pumped", "sore", "recovered", "fatigued"]


def today():
    return datetime.now(ZoneInfo("Asia/Tehran")).date().isoformat()


@router.get("")
def get_readiness(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    row = db.get(DailyReadiness, (user.id, today()))
    return success_response(data={"day": today(), "state": row.state if row else None})


@router.put("")
def save_readiness(req: ReadinessInput, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    row = db.get(DailyReadiness, (user.id, today()))
    if row is None:
        row = DailyReadiness(user_id=user.id, day=today(), state=req.state)
        db.add(row)
    else:
        row.state = req.state
    db.commit()
    return success_response(data={"day": row.day, "state": row.state})


@router.get("/history")
def readiness_history(
    days: int = Query(14, ge=1, le=60),
    user_id: str = Query(default=None),
    userId: str = Query(default=None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Recent readiness rows, newest first. Athletes read their own; coaches
    read their own athletes' (powers the coach dashboard energy view);
    admins read anyone's. Previously only today's row was reachable."""
    target_id = user_id or userId or user.id
    if target_id != user.id:
        if user.role == "coach":
            coached = (
                db.query(TrainingProgram.id)
                .filter(
                    TrainingProgram.coach_id == user.id,
                    TrainingProgram.athlete_id == target_id,
                )
                .first()
            )
            if not coached:
                return error_response("Insufficient permissions", 403)
        elif user.role != "admin":
            return error_response("Insufficient permissions", 403)
    rows = (
        db.query(DailyReadiness)
        .filter(DailyReadiness.user_id == target_id)
        .order_by(DailyReadiness.day.desc())
        .limit(days)
        .all()
    )
    return success_response(
        data=[{"day": r.day, "state": r.state} for r in rows],
    )
