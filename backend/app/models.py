import uuid
from datetime import UTC, datetime
from typing import Any, Optional

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _utcnow_naive() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    first_name: Mapped[str] = mapped_column(String, nullable=False)
    last_name: Mapped[str] = mapped_column(String, nullable=False)
    phone: Mapped[str] = mapped_column(String, default="")
    role: Mapped[str] = mapped_column(String, default="athlete")
    status: Mapped[str] = mapped_column(String, default="active")
    avatar_url: Mapped[str | None] = mapped_column(String, nullable=True)
    branch_id: Mapped[str | None] = mapped_column(String, ForeignKey("branches.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow_naive)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow_naive, onupdate=_utcnow_naive)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    branch: Mapped[Optional["Branch"]] = relationship(
        "Branch", foreign_keys=[branch_id], back_populates="users", lazy="selectin"
    )
    memberships: Mapped[list["Membership"]] = relationship("Membership", back_populates="user", lazy="selectin")
    training_programs_athlete: Mapped[list["TrainingProgram"]] = relationship(
        "TrainingProgram", foreign_keys="TrainingProgram.athlete_id", back_populates="athlete", lazy="selectin"
    )
    training_programs_coach: Mapped[list["TrainingProgram"]] = relationship(
        "TrainingProgram", foreign_keys="TrainingProgram.coach_id", back_populates="coach", lazy="selectin"
    )
    goals: Mapped[list["Goal"]] = relationship(
        "Goal", foreign_keys="Goal.athlete_id", back_populates="athlete", lazy="selectin"
    )
    checkins: Mapped[list["CheckIn"]] = relationship("CheckIn", back_populates="user", lazy="selectin")
    payments: Mapped[list["Payment"]] = relationship("Payment", back_populates="user", lazy="selectin")
    notifications: Mapped[list["Notification"]] = relationship("Notification", back_populates="user", lazy="selectin")


class Branch(Base):
    __tablename__ = "branches"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String, nullable=False)
    address: Mapped[str] = mapped_column(String, default="")
    phone: Mapped[str] = mapped_column(String, default="")
    email: Mapped[str] = mapped_column(String, default="")
    manager_id: Mapped[str | None] = mapped_column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow_naive)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow_naive, onupdate=_utcnow_naive)

    users: Mapped[list["User"]] = relationship(
        "User", foreign_keys="User.branch_id", back_populates="branch", lazy="selectin"
    )
    membership_plans: Mapped[list["MembershipPlan"]] = relationship(
        "MembershipPlan", back_populates="branch", lazy="selectin"
    )
    memberships: Mapped[list["Membership"]] = relationship("Membership", back_populates="branch", lazy="selectin")
    checkins: Mapped[list["CheckIn"]] = relationship("CheckIn", back_populates="branch", lazy="selectin")


class MembershipPlan(Base):
    __tablename__ = "membership_plans"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    duration_days: Mapped[int] = mapped_column(Integer, nullable=False)
    sessions_count: Mapped[int] = mapped_column(Integer, default=0)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    discount_percent: Mapped[float] = mapped_column(Float, default=0)
    features: Mapped[Any] = mapped_column(JSON, default=list)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    branch_id: Mapped[str | None] = mapped_column(String, ForeignKey("branches.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow_naive)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow_naive, onupdate=_utcnow_naive)

    branch: Mapped[Optional["Branch"]] = relationship("Branch", back_populates="membership_plans", lazy="selectin")
    memberships: Mapped[list["Membership"]] = relationship("Membership", back_populates="plan", lazy="selectin")


class Membership(Base):
    __tablename__ = "memberships"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    plan_id: Mapped[str] = mapped_column(String, ForeignKey("membership_plans.id", ondelete="CASCADE"), nullable=False)
    branch_id: Mapped[str] = mapped_column(String, ForeignKey("branches.id", ondelete="CASCADE"), nullable=False)
    start_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    sessions_total: Mapped[int] = mapped_column(Integer, default=0)
    sessions_used: Mapped[int] = mapped_column(Integer, default=0)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    discount_amount: Mapped[float] = mapped_column(Float, default=0)
    final_price: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String, default="active")
    freeze_reason: Mapped[str | None] = mapped_column(String, nullable=True)
    freeze_end_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow_naive)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow_naive, onupdate=_utcnow_naive)

    user: Mapped["User"] = relationship("User", back_populates="memberships", lazy="selectin")
    plan: Mapped["MembershipPlan"] = relationship("MembershipPlan", back_populates="memberships", lazy="selectin")
    branch: Mapped["Branch"] = relationship("Branch", back_populates="memberships", lazy="selectin")


class Exercise(Base):
    __tablename__ = "exercises"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String, nullable=False)
    name_en: Mapped[str | None] = mapped_column(String, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String, default="general")
    muscle_group: Mapped[str] = mapped_column(String, default="general")
    secondary_muscles: Mapped[Any | None] = mapped_column(JSON, nullable=True)
    equipment: Mapped[str | None] = mapped_column(String, nullable=True)
    difficulty: Mapped[str] = mapped_column(String, default="beginner")
    video_url: Mapped[str | None] = mapped_column(String, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String, nullable=True)
    instructions: Mapped[str | None] = mapped_column(Text, nullable=True)
    tips: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow_naive)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow_naive, onupdate=_utcnow_naive)

    program_exercises: Mapped[list["ProgramExercise"]] = relationship(
        "ProgramExercise", back_populates="exercise", lazy="selectin"
    )


class TrainingProgram(Base):
    __tablename__ = "training_programs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    athlete_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    coach_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    frequency_per_week: Mapped[int] = mapped_column(Integer, default=3)
    status: Mapped[str] = mapped_column(String, default="draft")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow_naive)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow_naive, onupdate=_utcnow_naive)

    athlete: Mapped["User"] = relationship(
        "User", foreign_keys=[athlete_id], back_populates="training_programs_athlete", lazy="selectin"
    )
    coach: Mapped["User"] = relationship(
        "User", foreign_keys=[coach_id], back_populates="training_programs_coach", lazy="selectin"
    )
    exercises: Mapped[list["ProgramExercise"]] = relationship(
        "ProgramExercise", back_populates="program", lazy="selectin", cascade="all, delete-orphan"
    )


class ProgramExercise(Base):
    __tablename__ = "program_exercises"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    program_id: Mapped[str] = mapped_column(
        String, ForeignKey("training_programs.id", ondelete="CASCADE"), nullable=False
    )
    exercise_id: Mapped[str] = mapped_column(String, ForeignKey("exercises.id", ondelete="CASCADE"), nullable=False)
    day_of_week: Mapped[int] = mapped_column(Integer, nullable=False)
    order: Mapped[int] = mapped_column(Integer, default=0)
    sets: Mapped[int] = mapped_column(Integer, default=3)
    reps: Mapped[str] = mapped_column(String, default="10")
    weight: Mapped[float | None] = mapped_column(Float, nullable=True)
    rest_seconds: Mapped[int] = mapped_column(Integer, default=60)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    actual_sets: Mapped[int | None] = mapped_column(Integer, nullable=True)
    actual_reps: Mapped[str | None] = mapped_column(String, nullable=True)
    actual_weight: Mapped[float | None] = mapped_column(Float, nullable=True)

    program: Mapped["TrainingProgram"] = relationship("TrainingProgram", back_populates="exercises", lazy="selectin")
    exercise: Mapped["Exercise"] = relationship("Exercise", back_populates="program_exercises", lazy="selectin")


class Goal(Base):
    __tablename__ = "goals"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    athlete_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    coach_id: Mapped[str | None] = mapped_column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    target_value: Mapped[float] = mapped_column(Float, nullable=False)
    current_value: Mapped[float] = mapped_column(Float, default=0)
    unit: Mapped[str] = mapped_column(String, default="kg")
    category: Mapped[str] = mapped_column(String, default="general")
    start_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    target_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    status: Mapped[str] = mapped_column(String, default="not_started")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow_naive)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow_naive, onupdate=_utcnow_naive)

    athlete: Mapped["User"] = relationship("User", foreign_keys=[athlete_id], back_populates="goals", lazy="selectin")
    coach: Mapped[Optional["User"]] = relationship("User", foreign_keys=[coach_id], lazy="selectin")


class CheckIn(Base):
    __tablename__ = "checkins"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    branch_id: Mapped[str] = mapped_column(String, ForeignKey("branches.id", ondelete="CASCADE"), nullable=False)
    check_in_time: Mapped[datetime] = mapped_column(DateTime, default=_utcnow_naive)
    check_out_time: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    session_deducted: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow_naive)

    user: Mapped["User"] = relationship("User", back_populates="checkins", lazy="selectin")
    branch: Mapped["Branch"] = relationship("Branch", back_populates="checkins", lazy="selectin")


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    membership_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("memberships.id", ondelete="SET NULL"), nullable=True
    )
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String, default="IRR")
    status: Mapped[str] = mapped_column(String, default="pending")
    method: Mapped[str] = mapped_column(String, default="cash")
    reference_id: Mapped[str | None] = mapped_column(String, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow_naive)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow_naive, onupdate=_utcnow_naive)

    user: Mapped["User"] = relationship("User", back_populates="payments", lazy="selectin")


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(String, default="info")
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    action_url: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow_naive)

    user: Mapped["User"] = relationship("User", back_populates="notifications", lazy="selectin")
