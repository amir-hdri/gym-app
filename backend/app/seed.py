"""Demo data seed.

Idempotent by construction: every row is addressed by a deterministic id
(``uuid5`` of a stable natural key) or looked up by natural key before insert,
so ``seed_database()`` can run on every startup — and against a database that
was seeded by an earlier version — without ever duplicating a row.

The data set is shaped to give the v2 surfaces something to show:
check-ins spread over ~60 days at varied hours (attendance-trend, peak-hours),
payments spread over ~6 months (revenue-trend), goals at mixed progress,
conversations with real message history, and notifications.
"""

import os
import random
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.auth import hash_password
from app.database import SessionLocal, engine, Base
from app.models import (
    Branch,
    CheckIn,
    Conversation,
    Exercise,
    Goal,
    Membership,
    MembershipPlan,
    Message,
    Notification,
    Payment,
    TrainingProgram,
    ProgramExercise,
    User,
)

# Fixed namespace so seeded ids are stable across runs and machines.
_SEED_NAMESPACE = uuid.UUID("3f7a1e62-9b4d-4c8a-b1d2-6e0f4a9c7b31")

CHECKIN_HISTORY_DAYS = 60
PAYMENT_HISTORY_MONTHS = 6


def _sid(*parts) -> str:
    return str(uuid.uuid5(_SEED_NAMESPACE, "|".join(str(p) for p in parts)))


def _utcnow_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _month_start(ref: datetime, offset: int) -> datetime:
    """First day of the month `offset` months before `ref` (naive UTC)."""
    ordinal = ref.year * 12 + (ref.month - 1) - offset
    return datetime(ordinal // 12, ordinal % 12 + 1, 1)


def _ensure(db: Session, model, row_id: str, **fields):
    """Insert `model` with a deterministic id unless it is already there."""
    existing = db.get(model, row_id)
    if existing is not None:
        return existing
    row = model(id=row_id, **fields)
    db.add(row)
    db.flush()
    return row


def _ensure_branch(db: Session, name: str, **fields) -> Branch:
    existing = db.query(Branch).filter(Branch.name == name).first()
    if existing is not None:
        return existing
    return _ensure(db, Branch, _sid("branch", name), name=name, **fields)


def _ensure_user(db: Session, email: str, **fields) -> User:
    existing = db.query(User).filter(User.email == email).first()
    if existing is not None:
        return existing
    return _ensure(db, User, _sid("user", email), email=email, **fields)


def _ensure_plan(db: Session, name: str, **fields) -> MembershipPlan:
    existing = db.query(MembershipPlan).filter(MembershipPlan.name == name).first()
    if existing is not None:
        return existing
    return _ensure(db, MembershipPlan, _sid("plan", name), name=name, **fields)


def _ensure_exercise(db: Session, name_en: str, **fields) -> Exercise:
    existing = db.query(Exercise).filter(Exercise.name_en == name_en).first()
    if existing is not None:
        return existing
    return _ensure(db, Exercise, _sid("exercise", name_en), name_en=name_en, **fields)


def _attendance_plan(idx: int, profile: dict) -> list[dict]:
    """Deterministic visit plan for one athlete over the history window.

    Returns visits ordered oldest-first, each with the day offset (0 = today),
    the hour, the minute and the session length. A minority of days carry a
    second visit so `uniqueMembers` is genuinely lower than `checkIns` on some
    days — otherwise the two attendance series would be indistinguishable.
    """
    rng = random.Random(1000 + idx)
    peak = profile["peak"]
    hour_pool = [peak, peak, peak, peak + 1, peak - 1, 12, 16, 20]
    visits: list[dict] = []
    for day_offset in range(CHECKIN_HISTORY_DAYS - 1, -1, -1):
        if rng.random() > profile["rate"]:
            continue
        slots = 2 if rng.random() < 0.12 else 1
        for slot in range(slots):
            hour = max(6, min(22, rng.choice(hour_pool) + (slot * 4)))
            visits.append(
                {
                    "day_offset": day_offset,
                    "slot": slot,
                    "hour": hour,
                    "minute": rng.choice([0, 10, 25, 40]),
                    "duration": rng.choice([45, 55, 60, 70, 75, 90]),
                }
            )
    return visits


# ---------------------------------------------------------------- static data

BRANCHES = [
    {
        "key": "Lumi Wellness",
        "address": "همدان - سعیدیه",
        "phone": "021-12345678",
        "email": "info@central.gymapp.ir",
    },
    {
        "key": "Lumi Wellness شرق",
        "address": "تهران - نارمک",
        "phone": "021-87654321",
        "email": "info@east.gymapp.ir",
    },
]

COACHES = [
    {"email": "coach1@gymapp.ir", "first_name": "علی", "last_name": "مرادی", "phone": "09122222222", "branch": 0},
    {"email": "coach2@gymapp.ir", "first_name": "سارا", "last_name": "احمدی", "phone": "09123333333", "branch": 0},
    {"email": "coach3@gymapp.ir", "first_name": "مهسا", "last_name": "کریمی", "phone": "09124444444", "branch": 1},
]

ATHLETES = [
    {"email": "athlete1@gymapp.ir", "first_name": "رضا", "last_name": "تهرانی", "branch": 0, "rate": 0.55, "peak": 18},
    {"email": "athlete2@gymapp.ir", "first_name": "مریم", "last_name": "نوری", "branch": 0, "rate": 0.45, "peak": 8},
    {"email": "athlete3@gymapp.ir", "first_name": "امیر", "last_name": "صادقی", "branch": 0, "rate": 0.35, "peak": 19},
    {"email": "athlete4@gymapp.ir", "first_name": "زهرا", "last_name": "موسوی", "branch": 0, "rate": 0.30, "peak": 17},
    {"email": "athlete5@gymapp.ir", "first_name": "حسین", "last_name": "کاظمی", "branch": 0, "rate": 0.50, "peak": 7},
    {"email": "athlete6@gymapp.ir", "first_name": "نیلوفر", "last_name": "بهرامی", "branch": 0, "rate": 0.25, "peak": 20},
    {"email": "athlete7@gymapp.ir", "first_name": "سینا", "last_name": "یزدانی", "branch": 1, "rate": 0.40, "peak": 18},
    {"email": "athlete8@gymapp.ir", "first_name": "الهام", "last_name": "شریفی", "branch": 1, "rate": 0.20, "peak": 9},
]

PLANS = [
    {"name": "پایه", "description": "Plan 30 روزه با 10 جلسه", "duration_days": 30, "sessions_count": 10, "price": 5000000, "discount_percent": 0, "features": ["دسترسی به باشگاه", "10 جلسه تمرین"]},
    {"name": "نقره‌ای", "description": "Plan 60 روزه با 20 جلسه", "duration_days": 60, "sessions_count": 20, "price": 9000000, "discount_percent": 10, "features": ["دسترسی به باشگاه", "20 جلسه تمرین", "مربی شخصی"]},
    {"name": "طلایی", "description": "Plan 90 روزه نامحدود", "duration_days": 90, "sessions_count": 0, "price": 15000000, "discount_percent": 15, "features": ["دسترسی نامحدود", "مربی شخصی", "برنامه تمرینی اختصاصی"]},
    {"name": "پلاتینیوم", "description": "Plan 365 روزه نامحدود", "duration_days": 365, "sessions_count": 0, "price": 50000000, "discount_percent": 20, "features": ["دسترسی نامحدود", "مربی شخصی", "برنامه تمرینی اختصاصی", "مشاوره تغذیه"]},
]

EXERCISES = [
    {"name": "پرس سینه هالتر", "name_en": "Barbell Bench Press", "category": "strength", "muscle_group": "chest", "difficulty": "intermediate", "equipment": "barbell", "secondary_muscles": ["shoulders", "triceps"]},
    {"name": "اسکات", "name_en": "Squat", "category": "strength", "muscle_group": "legs", "difficulty": "intermediate", "equipment": "barbell", "secondary_muscles": ["core", "glutes"]},
    {"name": "ددلیفت", "name_en": "Deadlift", "category": "strength", "muscle_group": "back", "difficulty": "advanced", "equipment": "barbell", "secondary_muscles": ["legs", "core", "glutes"]},
    {"name": "پول‌آپ", "name_en": "Pull-Up", "category": "strength", "muscle_group": "back", "difficulty": "intermediate", "equipment": "bodyweight", "secondary_muscles": ["biceps", "core"]},
    {"name": "پرس شانه دمبل", "name_en": "Dumbbell Shoulder Press", "category": "strength", "muscle_group": "shoulders", "difficulty": "beginner", "equipment": "dumbbell", "secondary_muscles": ["triceps"]},
    {"name": "جلوبازو هالتر", "name_en": "Barbell Curl", "category": "strength", "muscle_group": "biceps", "difficulty": "beginner", "equipment": "barbell", "secondary_muscles": ["forearms"]},
    {"name": "پشت بازو سیم کش", "name_en": "Tricep Pushdown", "category": "strength", "muscle_group": "triceps", "difficulty": "beginner", "equipment": "cable", "secondary_muscles": []},
    {"name": "پرس پا", "name_en": "Leg Press", "category": "strength", "muscle_group": "legs", "difficulty": "beginner", "equipment": "machine", "secondary_muscles": ["glutes"]},
    {"name": "لت پول‌داون", "name_en": "Lat Pulldown", "category": "strength", "muscle_group": "back", "difficulty": "beginner", "equipment": "cable", "secondary_muscles": ["biceps"]},
    {"name": "کرانچ", "name_en": "Crunch", "category": "core", "muscle_group": "abs", "difficulty": "beginner", "equipment": "bodyweight", "secondary_muscles": []},
    {"name": "پلانک", "name_en": "Plank", "category": "core", "muscle_group": "abs", "difficulty": "beginner", "equipment": "bodyweight", "secondary_muscles": ["core"]},
    {"name": "پرس سینه دمبل", "name_en": "Dumbbell Bench Press", "category": "strength", "muscle_group": "chest", "difficulty": "beginner", "equipment": "dumbbell", "secondary_muscles": ["shoulders", "triceps"]},
]

GOAL_TEMPLATES = [
    {"title": "کاهش وزن", "target_value": 10, "unit": "kg", "category": "weight_loss"},
    {"title": "افزایش عضله", "target_value": 5, "unit": "kg", "category": "muscle_gain"},
    {"title": "افزایش قدرت پرس سینه", "target_value": 80, "unit": "kg", "category": "strength"},
    {"title": "بهبود استقامت", "target_value": 30, "unit": "min", "category": "endurance"},
]

# ratio of target_value already achieved, paired with the matching status
GOAL_PROGRESS = [
    (0.0, "not_started"),
    (0.3, "in_progress"),
    (0.65, "in_progress"),
    (1.0, "achieved"),
]

CONVERSATION_SCRIPT = [
    ("athlete", "سلام مربی، برنامه این هفته رو دیدم. ممنون!"),
    ("coach", "سلام! خواهش می‌کنم. حتما گرم‌کردن رو جدی بگیر."),
    ("athlete", "روز دوم رو سنگین دیدم، وزنه‌ها رو کم کنم؟"),
    ("coach", "بله، ده درصد کمتر بزن و تعداد تکرار رو ثابت نگه دار."),
    ("athlete", "امروز تمرین پا رو کامل انجام دادم."),
    ("coach", "عالی بود. فردا استراحت فعال داشته باش."),
    ("athlete", "برای تغذیه قبل تمرین پیشنهادی دارید؟"),
    ("coach", "یک ساعت قبل، کربوهیدرات ساده و کمی پروتئین."),
    ("athlete", "ممنون، هفته بعد وزن‌کشی کنیم؟"),
    ("coach", "حتما، پنجشنبه صبح اندازه‌گیری می‌کنیم."),
]

NOTIFICATION_TEMPLATES = [
    {"title": "خوش آمدید", "message": "به باشگاه لومی خوش آمدید.", "type": "success", "is_read": True},
    {"title": "یادآوری تمرین", "message": "جلسه تمرینی امروز شما ساعت ۱۸ است.", "type": "info", "is_read": False},
    {"title": "سررسید اشتراک", "message": "اشتراک شما به‌زودی تمدید می‌شود.", "type": "warning", "is_read": False},
]


def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        _seed(db)
        db.commit()
        print("Database seeded successfully!")
    finally:
        db.close()


def _seed(db: Session) -> None:
    admin_password = os.environ.get("SEED_ADMIN_PASSWORD", "admin123")
    coach_password = os.environ.get("SEED_COACH_PASSWORD", "coach123")
    athlete_password = os.environ.get("SEED_ATHLETE_PASSWORD", "athlete123")
    reception_password = os.environ.get("SEED_RECEPTIONIST_PASSWORD", "reception123")
    if {admin_password, coach_password, athlete_password, reception_password} & {
        "admin123", "coach123", "athlete123", "reception123"
    }:
        print(
            "WARNING: seeding with default credentials — set SEED_*_PASSWORD env vars "
            "for non-dev environments"
        )

    now = _utcnow_naive()
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # bcrypt is deliberately slow: hash each distinct password once and reuse.
    admin_hash = hash_password(admin_password)
    coach_hash = hash_password(coach_password)
    athlete_hash = hash_password(athlete_password)
    reception_hash = hash_password(reception_password)

    # ---- Branches ----
    branches = [
        _ensure_branch(
            db,
            b["key"],
            address=b["address"],
            phone=b["phone"],
            email=b["email"],
            is_active=True,
            created_at=now,
            updated_at=now,
        )
        for b in BRANCHES
    ]

    # ---- Staff ----
    _ensure_user(
        db,
        "admin@gymapp.ir",
        password_hash=admin_hash,
        first_name="مدیر",
        last_name="سیستم",
        phone="09121111111",
        role="admin",
        status="active",
        branch_id=branches[0].id,
        created_at=now,
        updated_at=now,
    )
    _ensure_user(
        db,
        "reception@gymapp.ir",
        password_hash=reception_hash,
        first_name="نگار",
        last_name="رضایی",
        phone="09125555555",
        role="receptionist",
        status="active",
        branch_id=branches[0].id,
        created_at=now,
        updated_at=now,
    )
    coaches = [
        _ensure_user(
            db,
            c["email"],
            password_hash=coach_hash,
            first_name=c["first_name"],
            last_name=c["last_name"],
            phone=c["phone"],
            role="coach",
            status="active",
            branch_id=branches[c["branch"]].id,
            created_at=now,
            updated_at=now,
        )
        for c in COACHES
    ]

    # ---- Athletes ----
    athletes = [
        _ensure_user(
            db,
            a["email"],
            password_hash=athlete_hash,
            first_name=a["first_name"],
            last_name=a["last_name"],
            phone=f"0912000{idx:04d}",
            role="athlete",
            status="active",
            branch_id=branches[a["branch"]].id,
            created_at=now - timedelta(days=CHECKIN_HISTORY_DAYS + 5),
            updated_at=now,
        )
        for idx, a in enumerate(ATHLETES, start=1)
    ]

    # ---- Membership plans ----
    plans = [
        _ensure_plan(
            db,
            p["name"],
            description=p["description"],
            duration_days=p["duration_days"],
            sessions_count=p["sessions_count"],
            price=p["price"],
            discount_percent=p["discount_percent"],
            features=p["features"],
            is_active=True,
            branch_id=branches[0].id,
            created_at=now,
            updated_at=now,
        )
        for p in PLANS
    ]

    # ---- Exercises ----
    exercises = [
        _ensure_exercise(
            db,
            e["name_en"],
            name=e["name"],
            category=e["category"],
            muscle_group=e["muscle_group"],
            secondary_muscles=e["secondary_muscles"],
            equipment=e["equipment"],
            difficulty=e["difficulty"],
            is_active=True,
            created_at=now,
            updated_at=now,
        )
        for e in EXERCISES
    ]

    # ---- Memberships (one per athlete; mixed statuses) ----
    memberships: dict[str, Membership] = {}
    for idx, athlete in enumerate(athletes):
        existing = db.query(Membership).filter(Membership.user_id == athlete.id).first()
        if existing is not None:
            memberships[athlete.id] = existing
            continue
        plan = plans[idx % len(plans)]
        discount = plan.price * (plan.discount_percent or 0) / 100
        # The last two athletes model lapsed members.
        lapsed = idx >= len(athletes) - 2
        start = today - timedelta(days=plan.duration_days + 10 if lapsed else 30)
        memberships[athlete.id] = _ensure(
            db,
            Membership,
            _sid("membership", athlete.email),
            user_id=athlete.id,
            plan_id=plan.id,
            branch_id=athlete.branch_id or branches[0].id,
            start_date=start,
            end_date=start + timedelta(days=plan.duration_days),
            sessions_total=plan.sessions_count if plan.sessions_count > 0 else 999,
            sessions_used=3 + idx,
            price=plan.price,
            discount_amount=discount,
            final_price=plan.price - discount,
            status="expired" if lapsed else "active",
            created_at=start,
            updated_at=now,
        )

    # ---- Attendance plan ----
    #
    # Computed up front because the training-program completion dates are keyed
    # to it: an exercise is only ever marked done on a day the athlete actually
    # attended, so `athlete/{id}/activity` reads coherently.
    attendance = {
        athlete.id: _attendance_plan(idx, profile)
        for idx, (athlete, profile) in enumerate(zip(athletes, ATHLETES))
    }

    # ---- Training programs (+ exercises, some completed) ----
    for idx, athlete in enumerate(athletes):
        coach = coaches[idx % len(coaches)]
        existing_program = (
            db.query(TrainingProgram).filter(TrainingProgram.athlete_id == athlete.id).first()
        )
        if existing_program is not None:
            continue
        program = _ensure(
            db,
            TrainingProgram,
            _sid("program", athlete.email),
            athlete_id=athlete.id,
            coach_id=coach.id,
            name=f"برنامه {athlete.first_name} {athlete.last_name}",
            description=f"برنامه تمرینی اختصاصی برای {athlete.first_name}",
            start_date=today - timedelta(days=7),
            end_date=today + timedelta(days=21),
            frequency_per_week=4,
            status="active",
            created_at=today - timedelta(days=7),
            updated_at=now,
        )
        rng = random.Random(500 + idx)
        # Only days the athlete actually attended within the programme window
        # are candidates. Today is excluded because today's visit may still be
        # in the future, which would show exercises done on a day with no
        # check-in recorded yet.
        attended = sorted(
            {
                visit["day_offset"]
                for visit in attendance[athlete.id]
                if 1 <= visit["day_offset"] <= 7
            },
            reverse=True,
        )
        for day in range(3):
            for order, exercise in enumerate(exercises[day * 3 : (day + 1) * 3]):
                completed = bool(attended) and rng.random() < 0.45
                completed_at = (
                    today - timedelta(days=rng.choice(attended)) + timedelta(hours=19)
                    if completed
                    else None
                )
                _ensure(
                    db,
                    ProgramExercise,
                    _sid("program-exercise", athlete.email, day, order),
                    program_id=program.id,
                    exercise_id=exercise.id,
                    day_of_week=day,
                    order=order,
                    sets=4,
                    reps="10-12",
                    weight=20.0 + 5 * order if day == 0 else None,
                    rest_seconds=90,
                    is_completed=completed,
                    completed_at=completed_at,
                    actual_sets=4 if completed else None,
                    actual_reps="10" if completed else None,
                )

    # ---- Goals (mixed progress) ----
    for idx, athlete in enumerate(athletes):
        coach = coaches[idx % len(coaches)]
        for slot in range(2 if idx % 2 == 0 else 1):
            template = GOAL_TEMPLATES[(idx + slot) % len(GOAL_TEMPLATES)]
            ratio, status = GOAL_PROGRESS[(idx + slot) % len(GOAL_PROGRESS)]
            _ensure(
                db,
                Goal,
                _sid("goal", athlete.email, template["title"]),
                athlete_id=athlete.id,
                coach_id=coach.id,
                title=template["title"],
                description=f"هدف {template['title']} برای {athlete.first_name}",
                target_value=template["target_value"],
                current_value=round(template["target_value"] * ratio, 1),
                unit=template["unit"],
                category=template["category"],
                start_date=today - timedelta(days=30),
                target_date=today + timedelta(days=60),
                status=status,
                created_at=today - timedelta(days=30),
                updated_at=now,
            )

    # ---- Check-ins: ~60 days, varied hours (attendance-trend + peak-hours) ----
    for athlete in athletes:
        for visit in attendance[athlete.id]:
            day = today - timedelta(days=visit["day_offset"])
            check_in = day + timedelta(hours=visit["hour"], minutes=visit["minute"])
            if check_in > now:
                continue
            check_out = check_in + timedelta(minutes=visit["duration"])
            _ensure(
                db,
                CheckIn,
                _sid("checkin", athlete.email, visit["day_offset"], visit["slot"]),
                user_id=athlete.id,
                branch_id=athlete.branch_id or branches[0].id,
                check_in_time=check_in,
                # Still-open session when the window has not elapsed yet.
                check_out_time=check_out if check_out <= now else None,
                session_deducted=True,
                created_at=check_in,
            )

    # ---- Payments: ~6 months of history (revenue-trend) ----
    statuses = ["completed", "completed", "completed", "completed", "pending", "failed", "refunded"]
    for idx, athlete in enumerate(athletes):
        rng = random.Random(2000 + idx)
        membership = memberships.get(athlete.id)
        base_amount = float(membership.final_price) if membership else 5000000.0
        for month_offset in range(PAYMENT_HISTORY_MONTHS - 1, -1, -1):
            if rng.random() < 0.2:
                continue  # a gap, so the trend is not perfectly flat
            month_start = _month_start(now, month_offset)
            max_day = (now.day - 1) if month_offset == 0 else 26
            if max_day < 0:
                continue
            created_at = month_start + timedelta(
                days=rng.randint(0, max_day), hours=rng.randint(9, 19)
            )
            if created_at > now:
                continue
            status = rng.choice(statuses)
            amount = round(base_amount * rng.choice([0.5, 1.0, 1.0, 1.5]), 2)
            _ensure(
                db,
                Payment,
                _sid("payment", athlete.email, month_offset),
                user_id=athlete.id,
                membership_id=membership.id if membership else None,
                amount=amount,
                currency="IRR",
                status=status,
                method=rng.choice(["cash", "card", "online"]),
                reference_id=f"REF-{idx + 1:02d}-{month_offset:02d}",
                description=f"پرداخت {athlete.first_name} {athlete.last_name}",
                paid_at=created_at if status == "completed" else None,
                created_at=created_at,
                updated_at=created_at,
            )

    # ---- Notifications ----
    for idx, athlete in enumerate(athletes):
        for slot, template in enumerate(NOTIFICATION_TEMPLATES):
            _ensure(
                db,
                Notification,
                _sid("notification", athlete.email, slot),
                user_id=athlete.id,
                title=template["title"],
                message=f"{athlete.first_name} عزیز، {template['message']}",
                type=template["type"],
                is_read=template["is_read"],
                created_at=now - timedelta(days=slot * 3, hours=2),
            )

    # ---- Conversations + message history ----
    for idx, athlete in enumerate(athletes[:6]):
        coach = coaches[idx % len(coaches)]
        conversation = _ensure(
            db,
            Conversation,
            _sid("conversation", athlete.email, coach.email),
            athlete_id=athlete.id,
            coach_id=coach.id,
            last_message_at=None,
            created_at=now - timedelta(days=25),
        )
        if conversation.last_message_at is not None:
            continue  # already populated on a previous run
        rng = random.Random(3000 + idx)
        count = 4 + (idx % 4) * 2
        # Leave the coach's trailing messages unread in some threads so
        # unreadCount / unread-count have something to report.
        unread_tail = 2 if idx % 3 == 0 else 0
        sent_at = now - timedelta(days=20 - idx, hours=6)
        last_at = None
        for slot in range(count):
            author, body = CONVERSATION_SCRIPT[slot % len(CONVERSATION_SCRIPT)]
            sender = athlete if author == "athlete" else coach
            sent_at = sent_at + timedelta(hours=rng.randint(3, 30))
            if sent_at > now:
                sent_at = now - timedelta(minutes=(count - slot) * 7)
            is_unread_tail = author == "coach" and slot >= count - unread_tail
            _ensure(
                db,
                Message,
                _sid("message", athlete.email, coach.email, slot),
                conversation_id=conversation.id,
                sender_id=sender.id,
                body=body,
                read_at=None if is_unread_tail else sent_at + timedelta(minutes=20),
                created_at=sent_at,
            )
            last_at = sent_at
        conversation.last_message_at = last_at
