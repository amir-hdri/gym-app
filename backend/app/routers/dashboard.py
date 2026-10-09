from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import get_current_user, get_optional_user, require_roles
from app.database import get_db
from app.models import Branch, CheckIn, Goal, Membership, Payment, TrainingProgram, User
from app.responses import error_response, success_response
from app.schemas import (
    CheckInResponse,
    ExerciseResponse,
    GoalResponse,
    MembershipResponse,
    ProgramExerciseResponse,
    TrainingProgramResponse,
)

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])

STAFF_ROLES = {"admin", "coach"}


def _utcnow_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _shift_months(d: datetime, months: int) -> datetime:
    """Shifts a datetime by a number of calendar months without skipping
    short months (the naive `calculate + timedelta(days=30*n)` skips February
    in a 3-month view: Jan 30 + 60d lands in April). The day is clamped to the
    target month's length (Jan 31 + 1 month -> Feb 28)."""
    month_index = d.year * 12 + (d.month - 1) + months
    year, month_div = divmod(month_index, 12)
    month = month_div + 1
    # Clamp day-of-month to the target month's real length.
    import calendar as _calendar

    last_day = _calendar.monthrange(year, month)[1]
    day = min(d.day, last_day)
    return d.replace(year=year, month=month, day=day, tzinfo=None)


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


def _compute_streaks(checkins: list) -> tuple[int, int]:
    """Consecutive-day streaks from check-in timestamps (date part only)."""
    days = sorted(
        {c.check_in_time.date() for c in checkins if c.check_in_time},
        reverse=True,
    )
    if not days:
        return 0, 0
    today = _utcnow_naive().date()
    # current streak counts back from today (or yesterday if no check-in today yet)
    start = 0
    if days[0] != today:
        if days[0] != today - timedelta(days=1):
            current = 0
        else:
            current = 0
            expected = days[0]
            for d in days:
                if d == expected:
                    current += 1
                    expected -= timedelta(days=1)
                else:
                    break
        longest = current
        expected = None
        run = 0
        prev = None
        for d in sorted(days):
            if prev is None or d == prev + timedelta(days=1):
                run += 1
            else:
                longest = max(longest, run)
                run = 1
            prev = d
        return current, max(longest, run)
    for d in days:
        if d == today - timedelta(days=start):
            start += 1
        else:
            break
    longest = start
    run = 0
    prev = None
    for d in sorted(days):
        if prev is None or d == prev + timedelta(days=1):
            run += 1
        else:
            longest = max(longest, run)
            run = 1
        prev = d
    return start, max(longest, run)


@router.get("/stats")
def dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "coach", "receptionist")),
):
    today_start = _utcnow_naive().replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = today_start.replace(day=1)

    total_users = db.query(User).count()
    active_members = db.query(User).filter(User.role == "athlete", User.status == "active").count()
    today_checkins = db.query(CheckIn).filter(CheckIn.check_in_time >= today_start).count()
    active_memberships = db.query(Membership).filter(Membership.status == "active").count()

    monthly_revenue = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .filter(Payment.status == "completed", Payment.created_at >= month_start)
        .scalar()
    )

    return success_response(
        data={
            "totalUsers": total_users,
            "totalMembers": db.query(User).filter(User.role == "athlete").count(),
            "totalCoaches": db.query(User).filter(User.role == "coach").count(),
            "expiringMemberships": db.query(Membership).filter(Membership.status == "active", Membership.end_date >= today_start, Membership.end_date <= today_start + timedelta(days=7)).count(),
            "activeMembers": active_members,
            "todayCheckins": today_checkins,
            "activeMemberships": active_memberships,
            "monthlyRevenue": float(monthly_revenue),
        }
    )


@router.get("/revenue")
def revenue_data(
    period: str = Query("monthly", pattern="^(daily|monthly)$"),
    months: int = Query(6, ge=1, le=24),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "coach", "receptionist")),
):
    today = _utcnow_naive().replace(hour=0, minute=0, second=0, microsecond=0)
    labels = []
    values = []

    if period == "daily":
        for i in range(30):
            day = today - timedelta(days=29 - i)
            labels.append(day.strftime("%Y-%m-%d"))
            total = (
                db.query(func.coalesce(func.sum(Payment.amount), 0))
                .filter(
                    Payment.status == "completed",
                    func.date(Payment.created_at) == day.date(),
                )
                .scalar()
            )
            values.append(float(total))
    else:
        for i in range(months):
            first = _shift_months(today.replace(day=1), -(months - 1 - i))
            labels.append(first.strftime("%Y-%m"))
            first_of_month = first.replace(day=1)
            if first_of_month.month == 12:
                next_month = first_of_month.replace(year=first_of_month.year + 1, month=1)
            else:
                next_month = first_of_month.replace(month=first_of_month.month + 1)
            total = (
                db.query(func.coalesce(func.sum(Payment.amount), 0))
                .filter(
                    Payment.status == "completed",
                    Payment.created_at >= first_of_month,
                    Payment.created_at < next_month,
                )
                .scalar()
            )
            values.append(float(total))

    return success_response(data={"labels": labels, "values": values})


@router.get("/athlete/{athlete_id}")
def athlete_dashboard(
    athlete_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in STAFF_ROLES and current_user.id != athlete_id:
        return error_response("Insufficient permissions", 403)
    today_start = _utcnow_naive().replace(hour=0, minute=0, second=0, microsecond=0)

    user = db.query(User).filter(User.id == athlete_id).first()
    if not user:
        return error_response("Athlete not found", 404)

    all_checkins = (
        db.query(CheckIn)
        .filter(CheckIn.user_id == athlete_id)
        .order_by(CheckIn.check_in_time.desc())
        .all()
    )
    today_checkins = sum(1 for c in all_checkins if c.check_in_time and c.check_in_time >= today_start)
    recent_checkins = all_checkins[:5]

    active_membership = (
        db.query(Membership)
        .filter(
            Membership.user_id == athlete_id,
            Membership.status == "active",
        )
        .first()
    )
    membership_data = None
    if active_membership:
        membership_data = MembershipResponse.model_validate(active_membership).model_dump(by_alias=True)
        membership_data["sessionsRemaining"] = (
            active_membership.sessions_total - active_membership.sessions_used
        )

    current_program = (
        db.query(TrainingProgram)
        .filter(
            TrainingProgram.athlete_id == athlete_id,
            TrainingProgram.status == "active",
        )
        .first()
    )
    active_programs = (
        db.query(TrainingProgram)
        .filter(
            TrainingProgram.athlete_id == athlete_id,
            TrainingProgram.status == "active",
        )
        .count()
    )
    current_program_data = _program_to_dict(current_program) if current_program else None
    from zoneinfo import ZoneInfo
    today_index = (datetime.now(ZoneInfo("Asia/Tehran")).weekday() + 2) % 7
    today_exercises = [e for e in current_program_data["exercises"] if e["dayOfWeek"] == today_index] if current_program_data else []

    goals = (
        db.query(Goal)
        .filter(Goal.athlete_id == athlete_id)
        .order_by(Goal.target_date.asc())
        .all()
    )
    upcoming_goals = [
        GoalResponse.model_validate(g).model_dump(by_alias=True)
        for g in goals
        if g.status not in ("achieved", "missed")
    ][:5]

    total_sessions = len(all_checkins)
    completed_sessions = sum(1 for c in all_checkins if c.check_out_time)
    current_streak, longest_streak = _compute_streaks(all_checkins)

    recent_payload = [
        CheckInResponse.model_validate(c).model_dump(by_alias=True) for c in recent_checkins
    ]

    return success_response(
        data={
            # legacy minimal keys (backward compat)
            "todayCheckins": today_checkins,
            "activePrograms": active_programs,
            "membershipStatus": active_membership.status if active_membership else "none",
            "membershipEndDate": active_membership.end_date.isoformat() if active_membership else None,
            "recentCheckins": recent_payload,
            # rich keys matching AthleteDashboardData (mock-service shape)
            "currentProgram": current_program_data,
            "todayExercises": today_exercises,
            "upcomingGoals": upcoming_goals,
            "recentCheckIns": recent_payload,
            "membership": membership_data,
            "stats": {
                "totalSessions": total_sessions,
                "completedSessions": completed_sessions,
                "currentStreak": current_streak,
                "longestStreak": longest_streak,
            },
        }
    )


@router.get("/coach/{coach_id}")
def coach_dashboard(
    coach_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Authorization: admins may view any coach dashboard; coaches may only view
    # their own dashboard. Receptionists and others cannot view it at all.
    # Previously `STAFF_ROLES` let any coach read any other coach's roster.
    if current_user.role == "coach":
        if current_user.id != coach_id:
            return error_response("Insufficient permissions", 403)
        # All aggregations below are additionally scoped to the coach's branch.
        scope_branch_id: str | None = current_user.branch_id
        if scope_branch_id is None:
            # Single-branch deployment (LUMI only — no other branches will be
            # added): a coach without an explicit branch belongs to the sole
            # branch, so fall back to it instead of locking them out.
            sole_branch = db.query(Branch.id).all()
            if len(sole_branch) == 1:
                scope_branch_id = sole_branch[0][0]
            # Otherwise (should not happen): leave unscoped; the coach_id
            # filters below still limit data to this coach's own programs.
    elif current_user.role == "admin":
        scope_branch_id = None
    else:
        return error_response("Insufficient permissions", 403)
    today_start = _utcnow_naive().replace(hour=0, minute=0, second=0, microsecond=0)

    user = db.query(User).filter(User.id == coach_id).first()
    if not user:
        return error_response("Coach not found", 404)

    program_query = db.query(TrainingProgram).filter(TrainingProgram.coach_id == coach_id)
    session_query = db.query(CheckIn).filter(CheckIn.check_in_time >= today_start)
    goal_query = db.query(Goal).filter(Goal.coach_id == coach_id, Goal.status.in_(["not_started", "in_progress"]))
    if scope_branch_id is not None:
        # Scope every aggregate to the requesting coach's branch via the
        # athlete/user side of each join.
        program_query = program_query.join(User, TrainingProgram.athlete_id == User.id).filter(
            User.branch_id == scope_branch_id
        )
        session_query = session_query.join(User, CheckIn.user_id == User.id).filter(User.branch_id == scope_branch_id)
        goal_query = goal_query.join(User, Goal.athlete_id == User.id).filter(User.branch_id == scope_branch_id)

    coach_programs = program_query.all()
    athlete_ids = sorted({p.athlete_id for p in coach_programs})
    athletes_count = len(athlete_ids)
    today_sessions = session_query.count()
    active_programs = sum(1 for p in coach_programs if p.status == "active")
    pending_goals = goal_query.count()

    # Batch the per-athlete lookups (was: 2 queries per athlete — N+1).
    # Same rows as the per-athlete queries below, loaded in two round-trips.
    athletes_by_id = {a.id: a for a in db.query(User).filter(User.id.in_(athlete_ids)).all()} if athlete_ids else {}
    last_checkin_by_athlete: dict[str, CheckIn] = {}
    if athlete_ids:
        ordered = (
            db.query(CheckIn).filter(CheckIn.user_id.in_(athlete_ids)).order_by(CheckIn.check_in_time.desc()).all()
        )
        for c in ordered:
            # First occurrence per user is that user's latest check-in.
            last_checkin_by_athlete.setdefault(c.user_id, c)

    athletes_payload = []
    for athlete_id in athlete_ids:
        athlete = athletes_by_id.get(athlete_id)
        if not athlete:
            continue
        program = next(
            (p for p in coach_programs if p.athlete_id == athlete_id and p.status == "active"),
            next((p for p in coach_programs if p.athlete_id == athlete_id), None),
        )
        program_data = _program_to_dict(program) if program else None
        exercises = program_data["exercises"] if program_data else []
        completed = sum(1 for e in exercises if e.get("isCompleted"))
        progress = round((completed / len(exercises)) * 100) if exercises else 0
        last_checkin = last_checkin_by_athlete.get(athlete_id)
        athletes_payload.append(
            {
                "id": athlete.id,
                "name": f"{athlete.first_name} {athlete.last_name}".strip() or athlete.email,
                "avatarUrl": athlete.avatar_url,
                "currentProgram": program_data,
                "lastCheckIn": last_checkin.check_in_time.isoformat() if last_checkin else None,
                "progress": progress,
            }
        )

    return success_response(
        data={
            "athletesCount": athletes_count,
            "totalAthletes": athletes_count,
            "todaySessions": today_sessions,
            "activePrograms": active_programs,
            "pendingGoals": pending_goals,
            "pendingReviews": pending_goals,
            "athletes": athletes_payload,
        }
    )
