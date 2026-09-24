from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, List, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator


def to_camel(string: str) -> str:
    parts = string.split("_")
    return parts[0] + "".join(word.capitalize() for word in parts[1:])


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
    avatar_url: Optional[str] = None
    branch_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    last_login_at: Optional[datetime] = None


class UserCreate(BaseSchema):
    email: str = Field(max_length=255)
    password: str = Field(min_length=6)
    first_name: str = Field(max_length=100)
    last_name: str = Field(max_length=100)
    phone: str = Field(default="", max_length=100)
    # role is set server-side (default "athlete"); admin can specify via AdminUserCreate
    status: str = "active"
    branch_id: Optional[str] = None


class UserUpdate(BaseSchema):
    email: Optional[str] = Field(default=None, max_length=255)
    first_name: Optional[str] = Field(default=None, max_length=100)
    last_name: Optional[str] = Field(default=None, max_length=100)
    phone: Optional[str] = Field(default=None, max_length=100)
    status: Optional[str] = None
    branch_id: Optional[str] = None
    avatar_url: Optional[str] = None
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
    branch_id: Optional[str] = None

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
    manager_id: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class BranchCreate(BaseSchema):
    name: str = Field(max_length=100)
    address: str = Field(default="", max_length=100)
    phone: str = Field(default="", max_length=100)
    email: str = Field(default="", max_length=255)
    manager_id: Optional[str] = None
    is_active: bool = True


class BranchUpdate(BaseSchema):
    name: Optional[str] = Field(default=None, max_length=100)
    address: Optional[str] = Field(default=None, max_length=100)
    phone: Optional[str] = Field(default=None, max_length=100)
    email: Optional[str] = Field(default=None, max_length=255)
    manager_id: Optional[str] = None
    is_active: Optional[bool] = None


# ---- Membership Plan ----

class MembershipPlanResponse(BaseSchema):
    id: str
    name: str = Field(max_length=100)
    description: Optional[str] = None
    duration_days: int = Field(gt=0)
    sessions_count: int
    price: float = Field(gt=0)
    discount_percent: float
    features: Any = None
    is_active: bool
    branch_id: Optional[str] = None
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
    branch_id: Optional[str] = None


class MembershipPlanUpdate(BaseSchema):
    name: Optional[str] = Field(default=None, max_length=100)
    description: Optional[str] = None
    duration_days: Optional[int] = Field(default=None, gt=0)
    sessions_count: Optional[int] = None
    price: Optional[float] = Field(default=None, gt=0)
    discount_percent: Optional[float] = None
    features: Any = None
    is_active: Optional[bool] = None
    branch_id: Optional[str] = None


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
    sessions_remaining: Optional[int] = None
    price: float
    discount_amount: float
    final_price: float
    status: str
    freeze_reason: Optional[str] = None
    freeze_end_date: Optional[datetime] = None
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


class MembershipUpdate(BaseSchema):
    end_date: Optional[datetime] = None
    sessions_total: Optional[int] = None
    sessions_used: Optional[int] = None
    status: Optional[str] = None
    freeze_reason: Optional[str] = None
    freeze_end_date: Optional[datetime] = None


# ---- Exercise ----

class ExerciseResponse(BaseSchema):
    id: str
    name: str = Field(max_length=100)
    name_en: Optional[str] = Field(default=None, max_length=100)
    description: Optional[str] = None
    category: str
    muscle_group: str
    secondary_muscles: Any = None
    equipment: Optional[str] = None
    difficulty: str
    video_url: Optional[str] = None
    image_url: Optional[str] = None
    instructions: Optional[str] = None
    tips: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class ExerciseCreate(BaseSchema):
    name: str = Field(max_length=100)
    name_en: Optional[str] = Field(default=None, max_length=100)
    description: Optional[str] = None
    category: str = "general"
    muscle_group: str = "general"
    secondary_muscles: Any = None
    equipment: Optional[str] = None
    difficulty: str = "beginner"
    video_url: Optional[str] = None
    image_url: Optional[str] = None
    instructions: Optional[str] = None
    tips: Optional[str] = None
    is_active: bool = True


class ExerciseUpdate(BaseSchema):
    name: Optional[str] = None
    name_en: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    muscle_group: Optional[str] = None
    secondary_muscles: Any = None
    equipment: Optional[str] = None
    difficulty: Optional[str] = None
    video_url: Optional[str] = None
    image_url: Optional[str] = None
    instructions: Optional[str] = None
    tips: Optional[str] = None
    is_active: Optional[bool] = None


# ---- Training Program ----

class ProgramExerciseResponse(BaseSchema):
    id: str
    program_id: str
    exercise_id: str
    day_of_week: int
    order: int
    sets: int
    reps: str
    weight: Optional[float] = None
    rest_seconds: int
    notes: Optional[str] = None
    is_completed: bool
    completed_at: Optional[datetime] = None
    actual_sets: Optional[int] = None
    actual_reps: Optional[str] = None
    actual_weight: Optional[float] = None


class ProgramExerciseCreate(BaseSchema):
    exercise_id: str
    day_of_week: int
    order: int = 0
    sets: int = 3
    reps: str = "10"
    weight: Optional[float] = None
    rest_seconds: int = 60
    notes: Optional[str] = None


class ProgramExerciseUpdate(BaseSchema):
    day_of_week: Optional[int] = None
    order: Optional[int] = None
    sets: Optional[int] = None
    reps: Optional[str] = None
    weight: Optional[float] = None
    rest_seconds: Optional[int] = None
    notes: Optional[str] = None
    is_completed: Optional[bool] = None
    actual_sets: Optional[int] = None
    actual_reps: Optional[str] = None
    actual_weight: Optional[float] = None


class TrainingProgramResponse(BaseSchema):
    id: str
    athlete_id: str
    coach_id: str
    name: str = Field(max_length=100)
    description: Optional[str] = None
    start_date: datetime
    end_date: datetime
    frequency_per_week: int
    status: str
    created_at: datetime
    updated_at: datetime
    exercises: Optional[List[ProgramExerciseResponse]] = None


class TrainingProgramCreate(BaseSchema):
    athlete_id: str
    coach_id: str
    name: str = Field(max_length=100)
    description: Optional[str] = None
    start_date: datetime
    end_date: datetime
    frequency_per_week: int = 3
    status: str = "draft"


class TrainingProgramUpdate(BaseSchema):
    name: Optional[str] = Field(default=None, max_length=100)
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    frequency_per_week: Optional[int] = None
    status: Optional[str] = None


# ---- Goal ----

class GoalResponse(BaseSchema):
    id: str
    athlete_id: str
    coach_id: Optional[str] = None
    title: str = Field(max_length=100)
    description: Optional[str] = None
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
    coach_id: Optional[str] = None
    title: str = Field(max_length=100)
    description: Optional[str] = None
    target_value: float = Field(ge=0)
    current_value: float = Field(default=0, ge=0)
    unit: str = "kg"
    category: str = "general"
    start_date: datetime
    target_date: datetime
    status: str = "not_started"


class GoalUpdate(BaseSchema):
    title: Optional[str] = Field(default=None, max_length=100)
    description: Optional[str] = None
    target_value: Optional[float] = Field(default=None, ge=0)
    current_value: Optional[float] = Field(default=None, ge=0)
    unit: Optional[str] = None
    category: Optional[str] = None
    start_date: Optional[datetime] = None
    target_date: Optional[datetime] = None
    status: Optional[str] = None


class GoalProgressUpdate(BaseModel):
    current_value: float = Field(..., alias="currentValue", ge=0)

    model_config = ConfigDict(populate_by_name=True)


# ---- CheckIn ----

class CheckInResponse(BaseSchema):
    id: str
    user_id: str
    branch_id: str
    check_in_time: datetime
    check_out_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    session_deducted: bool
    created_at: datetime


class CheckInCreate(BaseSchema):
    user_id: str
    branch_id: str
    check_in_time: Optional[datetime] = None


class CheckOutUpdate(BaseModel):
    check_out_time: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
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
    membership_id: Optional[str] = None
    amount: float
    currency: str
    status: str
    method: str
    reference_id: Optional[str] = None
    description: Optional[str] = None
    paid_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class PaymentCreate(BaseSchema):
    user_id: str
    membership_id: Optional[str] = None
    amount: float = Field(gt=0)
    currency: str = "IRR"
    # status is server-controlled — clients cannot mark a payment as "completed"
    status: str = "pending"
    method: str = "cash"
    reference_id: Optional[str] = None
    description: Optional[str] = None

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
    action_url: Optional[str] = None
    created_at: datetime


class NotificationCreate(BaseSchema):
    user_id: str
    title: str = Field(max_length=100)
    message: str
    type: str = "info"
    action_url: Optional[str] = None
