from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


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

# Shared password policy (register / reset / change): min 8 chars, >=1 letter, >=1 digit.
PASSWORD_MIN_LENGTH = 8
PASSWORD_POLICY_MESSAGE = (
    "Password must be at least 8 characters and contain at least one letter and one digit"
)


def validate_password_policy(value: str) -> str:
    if not isinstance(value, str) or len(value) < PASSWORD_MIN_LENGTH:
        raise ValueError(PASSWORD_POLICY_MESSAGE)
    if not any(c.isalpha() for c in value):
        raise ValueError(PASSWORD_POLICY_MESSAGE)
    if not any(c.isdigit() for c in value):
        raise ValueError(PASSWORD_POLICY_MESSAGE)
    return value


class LoginRequest(BaseModel):
    email: str = Field(max_length=255, pattern=EMAIL_PATTERN)
    password: str = Field(min_length=6)


class RegisterRequest(BaseModel):
    email: str = Field(max_length=255, pattern=EMAIL_PATTERN)
    password: str = Field(min_length=PASSWORD_MIN_LENGTH)
    first_name: str = Field(..., alias="firstName", max_length=100)
    last_name: str = Field(..., alias="lastName", max_length=100)
    phone: str = Field(default="", max_length=100)
    # NOTE: role is intentionally omitted — the server hardcodes "athlete"
    # for self-registration to prevent privilege escalation.
    branch_id: Optional[str] = Field(default=None, alias="branchId")

    model_config = ConfigDict(populate_by_name=True)

    _check_password = field_validator("password")(validate_password_policy)


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


class UserRoleUpdate(BaseModel):
    """Dedicated admin-only role change (the endpoint UserUpdate's comment
    promises: roles are never editable through the generic update path)."""

    role: str


class AdminUserCreate(BaseModel):
    """Schema for admins to create users with a specified role."""
    email: str = Field(max_length=255)
    password: str = Field(min_length=6)
    first_name: str = Field(..., alias="firstName", max_length=100)
    last_name: str = Field(..., alias="lastName", max_length=100)
    phone: str = Field(default="", max_length=100)
    role: str = "athlete"
    status: str = "active"
    # branchId was silently dropped (no alias on a plain BaseModel), so the
    # branch assignment never persisted.
    branch_id: Optional[str] = Field(default=None, alias="branchId")

    model_config = ConfigDict(populate_by_name=True)


class PasswordChangeRequest(BaseModel):
    """Schema for a user changing their own password (requires current password)."""
    current_password: str = Field(..., alias="currentPassword")
    new_password: str = Field(..., min_length=PASSWORD_MIN_LENGTH, alias="newPassword")

    model_config = ConfigDict(populate_by_name=True)

    _check_password = field_validator("new_password")(validate_password_policy)


class PasswordSetRequest(BaseModel):
    """Schema for `POST /users/{id}/password`.

    `current_password` is optional *here only*: an admin setting someone else's
    password has none to send, and requiring it would make the admin path
    unreachable with a 422 before the handler could allow it. Self-service still
    has to prove it — the handler rejects a missing or wrong one with 401.
    `/auth/change-password` keeps `PasswordChangeRequest`, where the field is
    always required.
    """
    current_password: Optional[str] = Field(default=None, alias="currentPassword")
    new_password: str = Field(..., min_length=PASSWORD_MIN_LENGTH, alias="newPassword")

    model_config = ConfigDict(populate_by_name=True)

    _check_password = field_validator("new_password")(validate_password_policy)


class PasswordResetRequest(BaseModel):
    """Schema for requesting a password reset link (`POST /auth/forgot-password`)."""
    email: str = Field(max_length=255, pattern=EMAIL_PATTERN)


class PasswordResetConfirm(BaseModel):
    """Schema for resetting a password using a token (`POST /auth/reset-password`)."""
    token: str = Field(..., min_length=1, max_length=512)
    password: str = Field(..., min_length=PASSWORD_MIN_LENGTH)

    model_config = ConfigDict(populate_by_name=True)

    _check_password = field_validator("password")(validate_password_policy)


class ProfileUpdate(BaseSchema):
    """Self-service profile edit (`PUT /auth/profile`).

    Privilege-adjacent fields (role, status, branch, email) are intentionally
    not editable here.
    """
    first_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    phone: Optional[str] = Field(default=None, max_length=100)
    avatar_url: Optional[str] = Field(default=None, max_length=500)


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
    plan: Optional[MembershipPlanResponse] = None
    branch: Optional[BranchResponse] = None
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

    @model_validator(mode="after")
    def _derive_sessions_remaining(self):
        """Fill the derived field here rather than in each handler.

        There is no `sessions_remaining` column — it is `total - used`. Four of
        the membership handlers used to patch it into the dumped dict by hand
        and three (create, freeze, unfreeze) forgot, so those three returned
        `null` for a field the TypeScript `Membership` type declares as a
        required number. Deriving it on the schema means no handler can omit it.
        """
        if self.sessions_remaining is None:
            self.sessions_remaining = self.sessions_total - self.sessions_used
        return self


class MembershipCreate(BaseSchema):
    user_id: str
    plan_id: str
    branch_id: str
    start_date: datetime
    end_date: datetime
    sessions_total: int = Field(default=0, ge=0)
    sessions_used: int = Field(default=0, ge=0)
    price: float = Field(gt=0)
    discount_amount: float = Field(default=0, ge=0)
    final_price: float = Field(gt=0)
    status: str = "active"

    @model_validator(mode="after")
    def _check_pricing_and_dates(self):
        if self.end_date <= self.start_date:
            raise ValueError("end_date must be after start_date")
        if self.sessions_used > self.sessions_total:
            raise ValueError("sessions_used cannot exceed sessions_total")
        # Pricing is not client-controlled: the final price must equal
        # price − discount (tolerance for float wiring).
        if abs(self.final_price - (self.price - self.discount_amount)) > 0.01:
            raise ValueError("final_price must equal price minus discount_amount")
        if self.discount_amount > self.price:
            raise ValueError("discount_amount cannot exceed price")
        return self


class MembershipUpdate(BaseSchema):
    end_date: Optional[datetime] = None
    sessions_total: Optional[int] = Field(default=None, ge=0)
    sessions_used: Optional[int] = Field(default=None, ge=0)
    status: Optional[str] = None
    freeze_reason: Optional[str] = None
    freeze_end_date: Optional[datetime] = None


class MembershipRenew(BaseSchema):
    """Start a new term on an existing membership: pushes end_date out,
    reactivates (clearing any freeze), and optionally resets the session
    counters. Payment for the new term is recorded separately via
    POST /payments, keeping money and terms decoupled."""

    end_date: datetime = Field(alias="endDate")
    sessions_total: Optional[int] = Field(default=None, ge=0, alias="sessionsTotal")
    reset_sessions_used: bool = Field(default=True, alias="resetSessionsUsed")


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
    day_of_week: int = Field(ge=0, le=6)
    order: int = Field(default=0, ge=0)
    sets: int = Field(default=3, ge=0)
    reps: str = "10"
    weight: Optional[float] = Field(default=None, ge=0)
    rest_seconds: int = Field(default=60, ge=0)
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


class ProgramExerciseCompletion(BaseSchema):
    completed: bool = True
    actual_sets: Optional[int] = Field(default=None, ge=0)
    actual_reps: Optional[str] = None
    actual_weight: Optional[float] = Field(default=None, ge=0)


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
    frequency_per_week: int = Field(default=3, ge=1, le=7)
    status: str = "draft"

    @model_validator(mode="after")
    def _check_dates(self):
        start = self.start_date.replace(tzinfo=None) if self.start_date.tzinfo else self.start_date
        end = self.end_date.replace(tzinfo=None) if self.end_date.tzinfo else self.end_date
        if start > end:
            raise ValueError("start_date must not be after end_date")
        return self


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
    # Optional: the frontend athlete goal form never sends this. Defaults to
    # today (naive UTC, matching the backend's datetime.now(UTC).replace(tzinfo=None)).
    start_date: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )
    target_date: datetime
    status: str = "not_started"

    @model_validator(mode="after")
    def _start_before_target(self):
        start = self.start_date.replace(tzinfo=None) if self.start_date.tzinfo else self.start_date
        target = self.target_date.replace(tzinfo=None) if self.target_date.tzinfo else self.target_date
        if start > target:
            raise ValueError("start_date must not be after target_date")
        return self


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
    user: Optional[UserResponse] = None
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


# Single vocabulary shared by PUT /payments/{id} and PATCH .../status.
# "cancelled" was previously accepted by PATCH but 422'd by PUT for the same
# object; the frontend detail page cancels through PUT, so it must be legal.
PAYMENT_STATUSES = ("pending", "completed", "failed", "refunded", "cancelled")


class PaymentUpdate(BaseSchema):
    """Partial staff edit of a payment (`PUT /payments/{id}`).

    `notes` is the wire name; it is persisted on `Payment.description`, which
    is what `PaymentResponse` echoes back.
    """
    status: Optional[str] = None
    method: Optional[str] = Field(default=None, max_length=50)
    notes: Optional[str] = None

    @field_validator("status")
    @classmethod
    def _validate_status(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and value not in PAYMENT_STATUSES:
            raise ValueError(f"status must be one of: {', '.join(PAYMENT_STATUSES)}")
        return value


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


class NotificationBroadcast(BaseSchema):
    """Fan-out notification (`POST /notifications/broadcast`).

    `role` and `branch_id` are optional audience filters; omitting both sends
    to every user.
    """
    title: str = Field(min_length=1, max_length=100)
    message: str = Field(min_length=1)
    type: str = "info"
    role: Optional[str] = None
    branch_id: Optional[str] = None
    action_url: Optional[str] = None


# ---- Messaging ----

class MessageCreate(BaseModel):
    body: str = Field(..., min_length=1, max_length=2000)


class ConversationCreate(BaseModel):
    participant_id: str = Field(..., alias="participantId", min_length=1)

    model_config = ConfigDict(populate_by_name=True)


class MessageResponse(BaseSchema):
    id: str
    conversation_id: str
    sender_id: str
    body: str
    read_at: Optional[datetime] = None
    created_at: datetime


class ConversationParticipant(BaseSchema):
    """The *other* party relative to the caller (the athlete, for an admin)."""
    id: str
    first_name: str
    last_name: str
    role: str
    avatar_url: Optional[str] = None


class ConversationLastMessage(BaseSchema):
    id: str
    body: str
    sender_id: str
    created_at: datetime


class ConversationResponse(BaseSchema):
    id: str
    athlete_id: str
    coach_id: str
    participant: Optional[ConversationParticipant] = None
    last_message: Optional[ConversationLastMessage] = None
    unread_count: int = 0
    last_message_at: Optional[datetime] = None
    created_at: datetime


# ---- Analytics ----

class AttendanceTrendPoint(BaseSchema):
    date: str
    check_ins: int
    unique_members: int


class RevenueTrendPoint(BaseSchema):
    month: str
    revenue: float
    payments: int


class MembershipDistributionSlice(BaseSchema):
    plan_id: str
    plan_name: str
    count: int
    revenue: float


class PeakHourPoint(BaseSchema):
    hour: int
    check_ins: int


class AthleteActivityPoint(BaseSchema):
    date: str
    checked_in: bool
    duration_minutes: int
    exercises_completed: int
