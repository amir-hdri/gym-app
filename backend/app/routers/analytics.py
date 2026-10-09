"""Analytics series for the staff dashboard (API contract v2, section 5).

Every series is **dense** and **ascending**: buckets with no data are emitted
with zero values, so charts never have to interpolate. Bucketing is done in
Python over an explicit date range rather than with SQL date functions, which
keeps this portable (the app runs on SQLite — no window functions, no
``DISTINCT ON``, no ``date_trunc``).
"""

from datetime import date, datetime, time, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth import get_current_user, require_roles
from app.database import get_db
from app.models import (
    CheckIn,
    Membership,
    MembershipPlan,
    Payment,
    ProgramExercise,
    TrainingProgram,
    User,
)
from app.responses import error_response, success_response
from app.schemas import (
    AthleteActivityPoint,
    AttendanceTrendPoint,
    MembershipDistributionSlice,
    PeakHourPoint,
    RevenueTrendPoint,
)

# Same prefix as the dashboard router: these are additional dashboard reads.
router = APIRouter(prefix="/api/v1/dashboard", tags=["Analytics"])

OWNER_OVERRIDE_ROLES = {"admin", "coach"}


def _utcnow_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _day_buckets(days: int) -> list[date]:
    """`days` dates ending today, ascending."""
    today = _utcnow_naive().date()
    return [today - timedelta(days=days - 1 - i) for i in range(days)]


def _day_window(day_list: list[date]) -> tuple[datetime, datetime]:
    """Naive-UTC [start, end) covering the whole bucket list."""
    return (
        datetime.combine(day_list[0], time.min),
        datetime.combine(day_list[-1], time.min) + timedelta(days=1),
    )


def _month_buckets(months: int) -> list[tuple[int, int]]:
    """`months` (year, month) pairs ending with the current month, ascending."""
    now = _utcnow_naive()
    ordinal = now.year * 12 + (now.month - 1)
    out = []
    for offset in range(months - 1, -1, -1):
        value = ordinal - offset
        out.append((value // 12, value % 12 + 1))
    return out


def _month_window(month_list: list[tuple[int, int]]) -> tuple[datetime, datetime]:
    first_year, first_month = month_list[0]
    last_year, last_month = month_list[-1]
    start = datetime(first_year, first_month, 1)
    if last_month == 12:
        end = datetime(last_year + 1, 1, 1)
    else:
        end = datetime(last_year, last_month + 1, 1)
    return start, end


@router.get("/attendance-trend")
def attendance_trend(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "receptionist")),
):
    day_list = _day_buckets(days)
    start, end = _day_window(day_list)

    rows = (
        db.query(CheckIn.check_in_time, CheckIn.user_id)
        .filter(CheckIn.check_in_time >= start, CheckIn.check_in_time < end)
        .all()
    )

    counts: dict[date, int] = {d: 0 for d in day_list}
    members: dict[date, set] = {d: set() for d in day_list}
    for check_in_time, user_id in rows:
        if check_in_time is None:
            continue
        bucket = check_in_time.date()
        if bucket in counts:
            counts[bucket] += 1
            members[bucket].add(user_id)

    return success_response(
        data=[
            AttendanceTrendPoint(
                date=d.isoformat(),
                check_ins=counts[d],
                unique_members=len(members[d]),
            ).model_dump(by_alias=True)
            for d in day_list
        ]
    )


@router.get("/revenue-trend")
def revenue_trend(
    months: int = Query(6, ge=1, le=24),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "receptionist")),
):
    month_list = _month_buckets(months)
    start, end = _month_window(month_list)

    rows = (
        db.query(Payment.created_at, Payment.amount)
        .filter(
            Payment.status == "completed",
            Payment.created_at >= start,
            Payment.created_at < end,
        )
        .all()
    )

    revenue: dict[tuple[int, int], float] = {key: 0.0 for key in month_list}
    counts: dict[tuple[int, int], int] = {key: 0 for key in month_list}
    for created_at, amount in rows:
        if created_at is None:
            continue
        bucket = (created_at.year, created_at.month)
        if bucket in revenue:
            revenue[bucket] += float(amount or 0)
            counts[bucket] += 1

    return success_response(
        data=[
            RevenueTrendPoint(
                month=f"{year:04d}-{month:02d}",
                revenue=revenue[(year, month)],
                payments=counts[(year, month)],
            ).model_dump(by_alias=True)
            for year, month in month_list
        ]
    )


@router.get("/membership-distribution")
def membership_distribution(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "receptionist")),
):
    plans = db.query(MembershipPlan).all()
    rows = db.query(Membership.plan_id, Membership.final_price).all()

    counts: dict[str, int] = {}
    revenue: dict[str, float] = {}
    for plan_id, final_price in rows:
        counts[plan_id] = counts.get(plan_id, 0) + 1
        revenue[plan_id] = revenue.get(plan_id, 0.0) + float(final_price or 0)

    slices = [
        MembershipDistributionSlice(
            plan_id=plan.id,
            plan_name=plan.name,
            count=counts.get(plan.id, 0),
            revenue=revenue.get(plan.id, 0.0),
        )
        # Retired (soft-deleted) plans only show up while they still hold members.
        for plan in plans
        if plan.is_active or counts.get(plan.id, 0) > 0
    ]
    slices.sort(key=lambda s: (-s.count, s.plan_name))

    return success_response(data=[s.model_dump(by_alias=True) for s in slices])


@router.get("/peak-hours")
def peak_hours(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "receptionist")),
):
    day_list = _day_buckets(days)
    start, end = _day_window(day_list)

    rows = (
        db.query(CheckIn.check_in_time)
        .filter(CheckIn.check_in_time >= start, CheckIn.check_in_time < end)
        .all()
    )

    by_hour = {hour: 0 for hour in range(24)}
    for (check_in_time,) in rows:
        if check_in_time is None:
            continue
        by_hour[check_in_time.hour] += 1

    return success_response(
        data=[
            PeakHourPoint(hour=hour, check_ins=by_hour[hour]).model_dump(by_alias=True)
            for hour in range(24)
        ]
    )


@router.get("/athlete/{athlete_id}/activity")
def athlete_activity(
    athlete_id: str,
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in OWNER_OVERRIDE_ROLES and current_user.id != athlete_id:
        return error_response("Insufficient permissions", 403)

    athlete = db.query(User).filter(User.id == athlete_id).first()
    if not athlete:
        return error_response("Athlete not found", 404)

    day_list = _day_buckets(days)
    start, end = _day_window(day_list)

    checked_in: dict[date, bool] = {d: False for d in day_list}
    duration: dict[date, int] = {d: 0 for d in day_list}
    completed: dict[date, int] = {d: 0 for d in day_list}

    checkin_rows = (
        db.query(CheckIn.check_in_time, CheckIn.check_out_time)
        .filter(
            CheckIn.user_id == athlete_id,
            CheckIn.check_in_time >= start,
            CheckIn.check_in_time < end,
        )
        .all()
    )
    for check_in_time, check_out_time in checkin_rows:
        if check_in_time is None:
            continue
        bucket = check_in_time.date()
        if bucket not in checked_in:
            continue
        checked_in[bucket] = True
        if check_out_time is not None and check_out_time > check_in_time:
            duration[bucket] += int((check_out_time - check_in_time).total_seconds() // 60)

    exercise_rows = (
        db.query(ProgramExercise.completed_at)
        .join(TrainingProgram, ProgramExercise.program_id == TrainingProgram.id)
        .filter(
            TrainingProgram.athlete_id == athlete_id,
            ProgramExercise.is_completed == True,  # noqa: E712 — SQLAlchemy needs ==
            ProgramExercise.completed_at.isnot(None),
            ProgramExercise.completed_at >= start,
            ProgramExercise.completed_at < end,
        )
        .all()
    )
    for (completed_at,) in exercise_rows:
        bucket = completed_at.date()
        if bucket in completed:
            completed[bucket] += 1

    return success_response(
        data=[
            AthleteActivityPoint(
                date=d.isoformat(),
                checked_in=checked_in[d],
                duration_minutes=duration[d],
                exercises_completed=completed[d],
            ).model_dump(by_alias=True)
            for d in day_list
        ]
    )
