from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, model_validator


def to_camel(string: str) -> str:
    parts = string.split("_")
    return parts[0] + "".join(word.capitalize() for word in parts[1:])


def _as_naive(dt: datetime) -> datetime:
    """Normalize a datetime for comparison.

    The backend convention is naive UTC, but clients may send timezone-aware
    ISO strings. Comparing naive with aware raises TypeError, so validators
    normalize to naive before ordering checks (storage semantics unchanged).
    """
    return dt.replace(tzinfo=None) if dt.tzinfo is not None else dt


class BaseSchema(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )


# ---- Auth ----

EMAIL_PATTERN = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"


class LoginRequest(BaseModel):
    email: str = Field(max_length=255, pattern=EMAIL_PATTERN)
    password: str = Field(min_length=6)


class RegisterRequest(BaseModel):
    email: str = Field(max_length=255, pattern=EMAIL_PATTERN)
    password: str = Field(min_length=6)
    first_name: str = Field(..., alias="firstName", max_length=100)
    last_name: str = Field(..., alias="lastName", max_length=100)
    phone: str = Field(default="", max_length=100)
    # NOTE: role is intentionally omitted — the server hardcodes "athlete"
    # for self-registration to prevent privilege escalation.

    model_config = ConfigDict(populate_by_name=True)


class RefreshRequest(BaseModel):
    refreshToken: str


class TokenData(BaseModel):
    accessToken: str
    refreshToken: str
    accessTokenExpiry: datetime
    refreshTokenExpiry: datetime


# ---- User ----


class UserResponse(BaseSchema):
    id: str
    email: str = Field(max_length=255)
    first_name: str = Field(max_length=100)
    last_name: str = Field(max_length=100)
    phone: str = Field(max_length=100)
    role: str
    status: str
    avatar_url: str | None = None
    branch_id: str | None = None
    created_at: datetime
    updated_at: datetime
    last_login_at: datetime | None = None


class UserCreate(BaseSchema):
    email: str = Field(max_length=255)
    password: str = Field(min_length=6)
    first_name: str = Field(max_length=100)
    last_name: str = Field(max_length=100)
    phone: str = Field(default="", max_length=100)
    # role is set server-side (default "athlete"); admin can specify via AdminUserCreate
    status: str = "active"
    branch_id: str | None = None


class UserUpdate(BaseSchema):
    email: str | None = Field(default=None, max_length=255)
    first_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    phone: str | None = Field(default=None, max_length=100)
    status: str | None = None
    branch_id: str | None = None
    avatar_url: str | None = None
    # role is intentionally excluded — only admins can update roles via a dedicated endpoint
    # password is handled via a separate /users/{user_id}/password endpoint


class UserStatusUpdate(BaseModel):
    status: str


class AdminUserCreate(BaseModel):
    """Schema for admins to create users with a specified role."""

    email: str = Field(max_length=255)
    password: str = Field(min_length=6)
    first_name: str = Field(..., alias="firstName", max_length=100)
    last_name: str = Field(..., alias="lastName", max_length=100)
    phone: str = Field(default="", max_length=100)
    role: str = "athlete"
    status: str = "active"
    branch_id: str | None = Field(default=None, alias="branchId")

    model_config = ConfigDict(populate_by_name=True)


class PasswordChangeRequest(BaseModel):
    """Schema for a user changing their own password (requires current password)."""

    current_password: str = Field(..., alias="currentPassword")
    new_password: str = Field(..., min_length=6, alias="newPassword")

    model_config = ConfigDict(populate_by_name=True)


class PasswordResetRequest(BaseModel):
    """Schema for requesting a password reset link."""

    email: str = Field(max_length=255)


class PasswordResetConfirm(BaseModel):
    """Schema for resetting a password using a token."""

    token: str
    new_password: str = Field(..., min_length=6, alias="newPassword")

    model_config = ConfigDict(populate_by_name=True)


# ---- Branch ----


class BranchResponse(BaseSchema):
    id: str
    name: str = Field(max_length=100)
    address: str = Field(max_length=100)
    phone: str = Field(max_length=100)
    email: str = Field(max_length=255)
    manager_id: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class BranchCreate(BaseSchema):
    name: str = Field(max_length=100)
    address: str = Field(default="", max_length=100)
    phone: str = Field(default="", max_length=100)
    email: str = Field(default="", max_length=255)
    manager_id: str | None = None
    is_active: bool = True


class BranchUpdate(BaseSchema):
    name: str | None = Field(default=None, max_length=100)
    address: str | None = Field(default=None, max_length=100)
    phone: str | None = Field(default=None, max_length=100)
    email: str | None = Field(default=None, max_length=255)
    manager_id: str | None = None
    is_active: bool | None = None


# ---- Membership Plan ----


class MembershipPlanResponse(BaseSchema):
    id: str
    name: str = Field(max_length=100)
    description: str | None = None
    duration_days: int = Field(gt=0)
    sessions_count: int
    price: float = Field(gt=0)
    discount_percent: float
    features: Any = None
    is_active: bool
    branch_id: str | None = None
    created_at: datetime
    updated_at: datetime


class MembershipPlanCreate(BaseSchema):
    name: str = Field(max_length=100)
    description: str = ""
    duration_days: int = Field(gt=0)
    sessions_count: int = 0
    price: float = Field(gt=0)
    discount_percent: float = 0
    features: Any = None
    is_active: bool = True
    branch_id: str | None = None


class MembershipPlanUpdate(BaseSchema):
    name: str | None = Field(default=None, max_length=100)
    description: str | None = None
    duration_days: int | None = Field(default=None, gt=0)
    sessions_count: int | None = None
    price: float | None = Field(default=None, gt=0)
    discount_percent: float | None = None
    features: Any = None
    is_active: bool | None = None
    branch_id: str | None = None


# ---- Membership ----


class MembershipResponse(BaseSchema):
    id: str
    user_id: str
    plan_id: str
    branch_id: str
    start_date: datetime
    end_date: datetime
    sessions_total: int
    sessions_used: int
    sessions_remaining: int | None = None
    price: float
    discount_amount: float
    final_price: float
    status: str
    freeze_reason: str | None = None
    freeze_end_date: datetime | None = None
    created_at: datetime
    updated_at: datetime


class MembershipCreate(BaseSchema):
    user_id: str
    plan_id: str
    branch_id: str
    start_date: datetime
    end_date: datetime
    sessions_total: int = 0
    sessions_used: int = 0
    price: float = Field(gt=0)
    discount_amount: float = 0
    final_price: float = Field(gt=0)
    status: str = "active"

    @model_validator(mode="after")
    def _validate_membership_ranges(self):
        if _as_naive(self.end_date) < _as_naive(self.start_date):
            raise ValueError("end_date must not be earlier than start_date")
        if self.discount_amount > self.price:
            raise ValueError("discount_amount must not exceed price")
        if self.sessions_used > self.sessions_total:
            raise ValueError("sessions_used must not exceed sessions_total")
        return self


class MembershipUpdate(BaseSchema):
    end_date: datetime | None = None
    sessions_total: int | None = None
    sessions_used: int | None = None
    status: str | None = None
    freeze_reason: str | None = None
    freeze_end_date: datetime | None = None


# ---- Exercise ----


class ExerciseResponse(BaseSchema):
    id: str
    name: str = Field(max_length=100)
    name_en: str | None = Field(default=None, max_length=100)
    description: str | None = None
    category: str
    muscle_group: str
    secondary_muscles: Any = None
    equipment: str | None = None
    difficulty: str
    video_url: str | None = None
    image_url: str | None = None
    instructions: str | None = None
    tips: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class ExerciseCreate(BaseSchema):
    name: str = Field(max_length=100)
    name_en: str | None = Field(default=None, max_length=100)
    description: str | None = None
    category: str = "general"
    muscle_group: str = "general"
    secondary_muscles: Any = None
    equipment: str | None = None
    difficulty: str = "beginner"
    video_url: str | None = None
    image_url: str | None = None
    instructions: str | None = None
    tips: str | None = None
    is_active: bool = True


class ExerciseUpdate(BaseSchema):
    name: str | None = None
    name_en: str | None = None
    description: str | None = None
    category: str | None = None
    muscle_group: str | None = None
    secondary_muscles: Any = None
    equipment: str | None = None
    difficulty: str | None = None
    video_url: str | None = None
    image_url: str | None = None
    instructions: str | None = None
    tips: str | None = None
    is_active: bool | None = None


# ---- Training Program ----


class ProgramExerciseResponse(BaseSchema):
    id: str
    program_id: str
    exercise_id: str
    day_of_week: int
    order: int
    sets: int
    reps: str
    weight: float | None = None
    rest_seconds: int
    notes: str | None = None
    is_completed: bool
    completed_at: datetime | None = None
    actual_sets: int | None = None
    actual_reps: str | None = None
    actual_weight: float | None = None


class ProgramExerciseCreate(BaseSchema):
    exercise_id: str
    day_of_week: int
    order: int = 0
    sets: int = 3
    reps: str = "10"
    weight: float | None = None
    rest_seconds: int = 60
    notes: str | None = None


class ProgramExerciseUpdate(BaseSchema):
    day_of_week: int | None = None
    order: int | None = None
    sets: int | None = None
    reps: str | None = None
    weight: float | None = None
    rest_seconds: int | None = None
    notes: str | None = None
    is_completed: bool | None = None
    actual_sets: int | None = None
    actual_reps: str | None = None
    actual_weight: float | None = None


class TrainingProgramResponse(BaseSchema):
    id: str
    athlete_id: str
    coach_id: str
    name: str = Field(max_length=100)
    description: str | None = None
    start_date: datetime
    end_date: datetime
    frequency_per_week: int
    status: str
    created_at: datetime
    updated_at: datetime
    exercises: list[ProgramExerciseResponse] | None = None


class TrainingProgramCreate(BaseSchema):
    athlete_id: str
    coach_id: str
    name: str = Field(max_length=100)
    description: str | None = None
    start_date: datetime
    end_date: datetime
    frequency_per_week: int = 3
    status: str = "draft"

    @model_validator(mode="after")
    def _validate_program_dates(self):
        if _as_naive(self.end_date) < _as_naive(self.start_date):
            raise ValueError("end_date must not be earlier than start_date")
        return self


class TrainingProgramUpdate(BaseSchema):
    name: str | None = Field(default=None, max_length=100)
    description: str | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    frequency_per_week: int | None = None
    status: str | None = None


# ---- Goal ----


class GoalResponse(BaseSchema):
    id: str
    athlete_id: str
    coach_id: str | None = None
    title: str = Field(max_length=100)
    description: str | None = None
    target_value: float = Field(ge=0)
    current_value: float = Field(ge=0)
    unit: str
    category: str
    start_date: datetime
    target_date: datetime
    status: str
    created_at: datetime
    updated_at: datetime


class GoalCreate(BaseSchema):
    athlete_id: str
    coach_id: str | None = None
    title: str = Field(max_length=100)
    description: str | None = None
    target_value: float = Field(ge=0)
    current_value: float = Field(default=0, ge=0)
    unit: str = "kg"
    category: str = "general"
    # Optional: the frontend athlete goal form never sends this. Defaults to
    # today (naive UTC, matching the backend's datetime.now(UTC).replace(tzinfo=None) convention).
    start_date: datetime = Field(default_factory=lambda: datetime.now(UTC).replace(tzinfo=None))
    target_date: datetime
    status: str = "not_started"

    @model_validator(mode="after")
    def _validate_goal_dates(self):
        if _as_naive(self.start_date) > _as_naive(self.target_date):
            raise ValueError("start_date must not be later than target_date")
        return self


class GoalUpdate(BaseSchema):
    title: str | None = Field(default=None, max_length=100)
    description: str | None = None
    target_value: float | None = Field(default=None, ge=0)
    current_value: float | None = Field(default=None, ge=0)
    unit: str | None = None
    category: str | None = None
    start_date: datetime | None = None
    target_date: datetime | None = None
    status: str | None = None


class GoalProgressUpdate(BaseModel):
    current_value: float = Field(..., alias="currentValue", ge=0)

    model_config = ConfigDict(populate_by_name=True)


# ---- CheckIn ----


class CheckInResponse(BaseSchema):
    id: str
    user_id: str
    branch_id: str
    check_in_time: datetime
    check_out_time: datetime | None = None
    duration_minutes: int | None = None
    session_deducted: bool
    created_at: datetime


class CheckInCreate(BaseSchema):
    user_id: str
    branch_id: str
    check_in_time: datetime | None = None


class CheckOutUpdate(BaseModel):
    check_out_time: datetime = Field(
        default_factory=lambda: datetime.now(UTC).replace(tzinfo=None),
        alias="checkOutTime",
    )

    model_config = ConfigDict(populate_by_name=True)


class CheckOutRequest(BaseModel):
    checkin_id: str = Field(..., alias="checkInId")

    model_config = ConfigDict(populate_by_name=True)


class QRCheckInRequest(BaseModel):
    code: str

    model_config = ConfigDict(populate_by_name=True)


class QRCheckInResponse(BaseSchema):
    id: str
    user_id: str
    branch_id: str
    check_in_time: datetime
    message: str


# ---- Payment ----


class PaymentResponse(BaseSchema):
    id: str
    user_id: str
    membership_id: str | None = None
    amount: float
    currency: str
    status: str
    method: str
    reference_id: str | None = None
    description: str | None = None
    paid_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class PaymentCreate(BaseSchema):
    user_id: str
    membership_id: str | None = None
    amount: float = Field(gt=0)
    currency: str = "IRR"
    # status is server-controlled — clients cannot mark a payment as "completed"
    status: str = "pending"
    method: str = "cash"
    reference_id: str | None = None
    description: str | None = None

    @model_validator(mode="before")
    @classmethod
    def _validate_status(cls, data: Any) -> Any:
        # status is server-controlled: clients may only open a "pending" payment.
        if isinstance(data, dict) and data.get("status") not in (None, "pending"):
            raise ValueError("status must be 'pending' on create; completion is set internally")
        return data


class PaymentStatusUpdate(BaseModel):
    status: str


# ---- Notification ----


class NotificationResponse(BaseSchema):
    id: str
    user_id: str
    title: str
    message: str
    type: str
    is_read: bool
    action_url: str | None = None
    created_at: datetime


class NotificationCreate(BaseSchema):
    user_id: str
    title: str = Field(max_length=100)
    message: str
    type: str = "info"
    action_url: str | None = None
