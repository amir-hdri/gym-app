from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import get_current_user, get_optional_user, require_roles
from app.database import get_db
from app.models import CheckIn, Goal, Membership, Payment, TrainingProgram, User
from app.responses import error_response, success_response

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])

STAFF_ROLES = {"admin", "coach"}


@router.get("/stats")
def dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "coach")),
):
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
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
            "activeMembers": active_members,
            "todayCheckins": today_checkins,
            "activeMemberships": active_memberships,
            "monthlyRevenue": float(monthly_revenue),
        }
    )


@router.get("/revenue")
def revenue_data(
    period: str = Query("monthly", regex="^(daily|monthly)$"),
    months: int = Query(6, ge=1, le=24),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "coach")),
):
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
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
            first = today.replace(day=1) - timedelta(days=30 * (months - 1 - i))
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
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    user = db.query(User).filter(User.id == athlete_id).first()
    if not user:
        return error_response("Athlete not found", 404)

    today_checkins = (
        db.query(CheckIn)
        .filter(CheckIn.user_id == athlete_id, CheckIn.check_in_time >= today_start)
        .count()
    )
    active_membership = (
        db.query(Membership)
        .filter(
            Membership.user_id == athlete_id,
            Membership.status == "active",
        )
        .first()
    )
    recent_checkins = (
        db.query(CheckIn)
        .filter(CheckIn.user_id == athlete_id)
        .order_by(CheckIn.check_in_time.desc())
        .limit(5)
        .all()
    )
    active_programs = (
        db.query(TrainingProgram)
        .filter(
            TrainingProgram.athlete_id == athlete_id,
            TrainingProgram.status == "active",
        )
        .count()
    )

    return success_response(
        data={
            "todayCheckins": today_checkins,
            "activePrograms": active_programs,
            "membershipStatus": active_membership.status if active_membership else "none",
            "membershipEndDate": active_membership.end_date.isoformat() if active_membership else None,
            "recentCheckins": [
                {
                    "id": c.id,
                    "checkInTime": c.check_in_time.isoformat(),
                    "checkOutTime": c.check_out_time.isoformat() if c.check_out_time else None,
                }
                for c in recent_checkins
            ],
        }
    )


@router.get("/coach/{coach_id}")
def coach_dashboard(
    coach_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in STAFF_ROLES and current_user.id != coach_id:
        return error_response("Insufficient permissions", 403)
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    user = db.query(User).filter(User.id == coach_id).first()
    if not user:
        return error_response("Coach not found", 404)

    athletes_count = (
        db.query(TrainingProgram.athlete_id)
        .filter(TrainingProgram.coach_id == coach_id)
        .distinct()
        .count()
    )
    today_sessions = (
        db.query(CheckIn)
        .filter(CheckIn.check_in_time >= today_start)
        .count()
    )
    active_programs = (
        db.query(TrainingProgram)
        .filter(TrainingProgram.coach_id == coach_id, TrainingProgram.status == "active")
        .count()
    )
    pending_goals = (
        db.query(Goal)
        .filter(Goal.coach_id == coach_id, Goal.status.in_(["not_started", "in_progress"]))
        .count()
    )

    return success_response(
        data={
            "athletesCount": athletes_count,
            "todaySessions": today_sessions,
            "activePrograms": active_programs,
            "pendingGoals": pending_goals,
        }
    )
