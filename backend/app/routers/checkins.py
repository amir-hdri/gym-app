from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import CheckIn, User
from app.responses import error_response, paginated_response, success_response
from app.schemas import CheckInCreate, CheckInResponse, CheckOutUpdate, QRCheckInRequest, QRCheckInResponse

router = APIRouter(prefix="/api/v1/check-ins", tags=["Check-Ins"])


@router.get("")
def list_checkins(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    user_id: str = None,
    branch_id: str = None,
    date_from: str = None,
    date_to: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(CheckIn)
    if user_id:
        query = query.filter(CheckIn.user_id == user_id)
    if branch_id:
        query = query.filter(CheckIn.branch_id == branch_id)
    if date_from:
        try:
            parsed_from = datetime.fromisoformat(date_from)
        except ValueError:
            return error_response("Invalid date_from format. Use ISO format (e.g. 2024-01-01T00:00:00)", 400)
        query = query.filter(CheckIn.check_in_time >= parsed_from)
    if date_to:
        try:
            parsed_to = datetime.fromisoformat(date_to)
        except ValueError:
            return error_response("Invalid date_to format. Use ISO format (e.g. 2024-01-01T00:00:00)", 400)
        query = query.filter(CheckIn.check_in_time <= parsed_to)
    query = query.order_by(CheckIn.check_in_time.desc())
    total = query.count()
    checkins = query.offset((page - 1) * page_size).limit(page_size).all()

    data = []
    for c in checkins:
        d = CheckInResponse.model_validate(c).model_dump(by_alias=True)
        if c.check_out_time and c.check_in_time:
            duration = int((c.check_out_time - c.check_in_time).total_seconds() / 60)
            d["durationMinutes"] = duration
        data.append(d)
    return paginated_response(data=data, total=total, page=page, page_size=page_size)


@router.post("")
def check_in(
    req: CheckInCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    checkin = CheckIn(
        user_id=req.user_id,
        branch_id=req.branch_id,
        check_in_time=req.check_in_time or datetime.utcnow(),
    )
    db.add(checkin)
    db.commit()
    db.refresh(checkin)
    return success_response(
        data=CheckInResponse.model_validate(checkin).model_dump(by_alias=True),
        message="Checked in",
    )


from pydantic import BaseModel, Field


class CheckOutRequest(BaseModel):
    checkin_id: str = Field(..., alias="checkInId")

    model_config = {"populate_by_name": True}


@router.post("/check-out")
def check_out_post(
    req: CheckOutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    checkin = db.query(CheckIn).filter(CheckIn.id == req.checkin_id).first()
    if not checkin:
        return error_response("Check-in not found", 404)
    if checkin.check_out_time:
        return error_response("Already checked out", 400)
    checkin.check_out_time = datetime.utcnow()
    db.commit()
    db.refresh(checkin)
    d = CheckInResponse.model_validate(checkin).model_dump(by_alias=True)
    duration = int((checkin.check_out_time - checkin.check_in_time).total_seconds() / 60)
    d["durationMinutes"] = duration
    return success_response(data=d, message="Checked out")


@router.put("/{checkin_id}/checkout")
def check_out(
    checkin_id: str,
    req: CheckOutUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    checkin = db.query(CheckIn).filter(CheckIn.id == checkin_id).first()
    if not checkin:
        return error_response("Check-in not found", 404)
    if checkin.check_out_time:
        return error_response("Already checked out", 400)

    checkin.check_out_time = req.check_out_time
    db.commit()
    db.refresh(checkin)

    d = CheckInResponse.model_validate(checkin).model_dump(by_alias=True)
    duration = int((checkin.check_out_time - checkin.check_in_time).total_seconds() / 60)
    d["durationMinutes"] = duration
    return success_response(data=d, message="Checked out")


STAFF_ROLES = {"admin", "coach"}


@router.post("/qr/check-in")
def qr_check_in(
    req: QRCheckInRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in STAFF_ROLES:
        return error_response("Forbidden: Only staff can check in members via QR", 403)

    member = db.query(User).filter(User.id == req.code).first()
    if not member:
        return error_response("Member not found", 404)

    branch_id = current_user.branch_id
    if not branch_id:
        return error_response("Staff member has no assigned branch", 400)

    checkin = CheckIn(
        user_id=member.id,
        branch_id=branch_id,
        check_in_time=datetime.utcnow(),
    )
    db.add(checkin)
    db.commit()
    db.refresh(checkin)

    return success_response(
        data=QRCheckInResponse(
            id=checkin.id,
            user_id=checkin.user_id,
            branch_id=checkin.branch_id,
            check_in_time=checkin.check_in_time,
            message=f"Member {member.first_name} {member.last_name} checked in successfully",
        ).model_dump(by_alias=True),
        message="QR check-in successful",
    )
