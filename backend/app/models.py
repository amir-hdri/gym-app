import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    phone = Column(String, default="")
    role = Column(String, default="athlete")
    status = Column(String, default="active")
    avatar_url = Column(String, nullable=True)
    branch_id = Column(String, ForeignKey("branches.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login_at = Column(DateTime, nullable=True)

    branch = relationship("Branch", foreign_keys=[branch_id], back_populates="users", lazy="selectin")
    memberships = relationship("Membership", back_populates="user", lazy="selectin")
    training_programs_athlete = relationship(
        "TrainingProgram", foreign_keys="TrainingProgram.athlete_id", back_populates="athlete", lazy="selectin"
    )
    training_programs_coach = relationship(
        "TrainingProgram", foreign_keys="TrainingProgram.coach_id", back_populates="coach", lazy="selectin"
    )
    goals = relationship("Goal", foreign_keys="Goal.athlete_id", back_populates="athlete", lazy="selectin")
    checkins = relationship("CheckIn", back_populates="user", lazy="selectin")
    payments = relationship("Payment", back_populates="user", lazy="selectin")
    notifications = relationship("Notification", back_populates="user", lazy="selectin")


class Branch(Base):
    __tablename__ = "branches"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    address = Column(String, default="")
    phone = Column(String, default="")
    email = Column(String, default="")
    manager_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    users = relationship("User", foreign_keys="User.branch_id", back_populates="branch", lazy="selectin")
    membership_plans = relationship("MembershipPlan", back_populates="branch", lazy="selectin")
    memberships = relationship("Membership", back_populates="branch", lazy="selectin")
    checkins = relationship("CheckIn", back_populates="branch", lazy="selectin")


class MembershipPlan(Base):
    __tablename__ = "membership_plans"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(Text, default="")
    duration_days = Column(Integer, nullable=False)
    sessions_count = Column(Integer, default=0)
    price = Column(Float, nullable=False)
    discount_percent = Column(Float, default=0)
    features = Column(JSON, default=list)
    is_active = Column(Boolean, default=True)
    branch_id = Column(String, ForeignKey("branches.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    branch = relationship("Branch", back_populates="membership_plans", lazy="selectin")
    memberships = relationship("Membership", back_populates="plan", lazy="selectin")


class Membership(Base):
    __tablename__ = "memberships"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    plan_id = Column(String, ForeignKey("membership_plans.id", ondelete="CASCADE"), nullable=False)
    branch_id = Column(String, ForeignKey("branches.id", ondelete="CASCADE"), nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    sessions_total = Column(Integer, default=0)
    sessions_used = Column(Integer, default=0)
    price = Column(Float, nullable=False)
    discount_amount = Column(Float, default=0)
    final_price = Column(Float, nullable=False)
    status = Column(String, default="active")
    freeze_reason = Column(String, nullable=True)
    freeze_end_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="memberships", lazy="selectin")
    plan = relationship("MembershipPlan", back_populates="memberships", lazy="selectin")
    branch = relationship("Branch", back_populates="memberships", lazy="selectin")


class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    name_en = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    category = Column(String, default="general")
    muscle_group = Column(String, default="general")
    secondary_muscles = Column(JSON, nullable=True)
    equipment = Column(String, nullable=True)
    difficulty = Column(String, default="beginner")
    video_url = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    instructions = Column(Text, nullable=True)
    tips = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    program_exercises = relationship("ProgramExercise", back_populates="exercise", lazy="selectin")


class TrainingProgram(Base):
    __tablename__ = "training_programs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    athlete_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    coach_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    frequency_per_week = Column(Integer, default=3)
    status = Column(String, default="draft")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    athlete = relationship("User", foreign_keys=[athlete_id], back_populates="training_programs_athlete", lazy="selectin")
    coach = relationship("User", foreign_keys=[coach_id], back_populates="training_programs_coach", lazy="selectin")
    exercises = relationship("ProgramExercise", back_populates="program", lazy="selectin", cascade="all, delete-orphan")


class ProgramExercise(Base):
    __tablename__ = "program_exercises"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    program_id = Column(String, ForeignKey("training_programs.id", ondelete="CASCADE"), nullable=False)
    exercise_id = Column(String, ForeignKey("exercises.id", ondelete="CASCADE"), nullable=False)
    day_of_week = Column(Integer, nullable=False)
    order = Column(Integer, default=0)
    sets = Column(Integer, default=3)
    reps = Column(String, default="10")
    weight = Column(Float, nullable=True)
    rest_seconds = Column(Integer, default=60)
    notes = Column(Text, nullable=True)
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    actual_sets = Column(Integer, nullable=True)
    actual_reps = Column(String, nullable=True)
    actual_weight = Column(Float, nullable=True)

    program = relationship("TrainingProgram", back_populates="exercises", lazy="selectin")
    exercise = relationship("Exercise", back_populates="program_exercises", lazy="selectin")


class Goal(Base):
    __tablename__ = "goals"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    athlete_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    coach_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    target_value = Column(Float, nullable=False)
    current_value = Column(Float, default=0)
    unit = Column(String, default="kg")
    category = Column(String, default="general")
    start_date = Column(DateTime, nullable=False)
    target_date = Column(DateTime, nullable=False)
    status = Column(String, default="not_started")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    athlete = relationship("User", foreign_keys=[athlete_id], back_populates="goals", lazy="selectin")
    coach = relationship("User", foreign_keys=[coach_id], lazy="selectin")


class CheckIn(Base):
    __tablename__ = "checkins"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    branch_id = Column(String, ForeignKey("branches.id", ondelete="CASCADE"), nullable=False)
    check_in_time = Column(DateTime, default=datetime.utcnow)
    check_out_time = Column(DateTime, nullable=True)
    session_deducted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="checkins", lazy="selectin")
    branch = relationship("Branch", back_populates="checkins", lazy="selectin")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    membership_id = Column(String, ForeignKey("memberships.id", ondelete="SET NULL"), nullable=True)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="IRR")
    status = Column(String, default="pending")
    method = Column(String, default="cash")
    reference_id = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="payments", lazy="selectin")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String, default="info")
    is_read = Column(Boolean, default=False)
    action_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications", lazy="selectin")
