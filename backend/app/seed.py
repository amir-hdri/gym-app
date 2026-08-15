import uuid
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.auth import hash_password
from app.database import SessionLocal, engine, Base
from app.models import (
    Branch,
    CheckIn,
    Exercise,
    Goal,
    Membership,
    MembershipPlan,
    Notification,
    Payment,
    TrainingProgram,
    ProgramExercise,
    User,
)


def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    existing = db.query(User).first()
    if existing:
        db.close()
        return

    now = datetime.utcnow()

    # ---- Branch ----
    branch = Branch(
        id=str(uuid.uuid4()),
        name="باشگاه مرکزی",
        address="تهران، خیابان ولیعصر، نبش کوچه فلان",
        phone="021-12345678",
        email="info@central.gymapp.ir",
        is_active=True,
    )
    db.add(branch)
    db.flush()

    # ---- Admin ----
    admin = User(
        email="admin@gymapp.ir",
        password_hash=hash_password("admin123"),
        first_name="مدیر",
        last_name="سیستم",
        phone="09121111111",
        role="admin",
        status="active",
        branch_id=branch.id,
    )
    db.add(admin)

    # ---- Coaches ----
    coach1 = User(
        email="coach1@gymapp.ir",
        password_hash=hash_password("coach123"),
        first_name="علی",
        last_name="مرادی",
        phone="09122222222",
        role="coach",
        status="active",
        branch_id=branch.id,
    )
    coach2 = User(
        email="coach2@gymapp.ir",
        password_hash=hash_password("coach123"),
        first_name="سارا",
        last_name="احمدی",
        phone="09123333333",
        role="coach",
        status="active",
        branch_id=branch.id,
    )
    db.add_all([coach1, coach2])
    db.flush()

    # ---- Athletes ----
    athletes = []
    for i in range(1, 5):
        a = User(
            email=f"athlete{i}@gymapp.ir",
            password_hash=hash_password("athlete123"),
            first_name=f"ورزشکار",
            last_name=f"شماره {i}",
            phone=f"0912000000{i}",
            role="athlete",
            status="active",
            branch_id=branch.id,
        )
        db.add(a)
        athletes.append(a)
    db.flush()

    # ---- Membership Plans ----
    plans_data = [
        {"name": "پایه", "description": "Plan 30 روزه با 10 جلسه", "duration_days": 30, "sessions_count": 10, "price": 500000, "features": ["دسترسی به باشگاه", "10 جلسه تمرین"]},
        {"name": "نقره‌ای", "description": "Plan 60 روزه با 20 جلسه", "duration_days": 60, "sessions_count": 20, "price": 900000, "discount_percent": 10, "features": ["دسترسی به باشگاه", "20 جلسه تمرین", "مربی شخصی"]},
        {"name": "طلایی", "description": "Plan 90 روزه نامحدود", "duration_days": 90, "sessions_count": 0, "price": 1500000, "discount_percent": 15, "features": ["دسترسی نامحدود", "مربی شخصی", "برنامه تمرینی اختصاصی"]},
        {"name": "پلاتینیوم", "description": "Plan 365 روزه نامحدود", "duration_days": 365, "sessions_count": 0, "price": 5000000, "discount_percent": 20, "features": ["دسترسی نامحدود", "مربی شخصی", "برنامه تمرینی اختصاصی", "مشاوره تغذیه"]},
    ]
    plans = []
    for pd in plans_data:
        p = MembershipPlan(
            name=pd["name"],
            description=pd["description"],
            duration_days=pd["duration_days"],
            sessions_count=pd["sessions_count"],
            price=pd["price"],
            discount_percent=pd.get("discount_percent", 0),
            features=pd["features"],
            is_active=True,
            branch_id=branch.id,
        )
        db.add(p)
        plans.append(p)
    db.flush()

    # ---- Memberships ----
    for i, athlete in enumerate(athletes):
        plan = plans[i % len(plans)]
        discount = plan.price * plan.discount_percent / 100
        m = Membership(
            user_id=athlete.id,
            plan_id=plan.id,
            branch_id=branch.id,
            start_date=now - timedelta(days=30),
            end_date=now + timedelta(days=plan.duration_days - 30),
            sessions_total=plan.sessions_count if plan.sessions_count > 0 else 999,
            sessions_used=3 + i,
            price=plan.price,
            discount_amount=discount,
            final_price=plan.price - discount,
            status="active",
        )
        db.add(m)
    db.flush()

    # ---- Exercises ----
    exercises_data = [
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
    exercises = []
    for ed in exercises_data:
        e = Exercise(
            name=ed["name"],
            name_en=ed["name_en"],
            category=ed["category"],
            muscle_group=ed["muscle_group"],
            secondary_muscles=ed.get("secondary_muscles", []),
            equipment=ed.get("equipment", ""),
            difficulty=ed["difficulty"],
            is_active=True,
        )
        db.add(e)
        exercises.append(e)
    db.flush()

    # ---- Training Programs ----
    for athlete in athletes:
        coach = coach1 if athletes.index(athlete) % 2 == 0 else coach2
        program = TrainingProgram(
            athlete_id=athlete.id,
            coach_id=coach.id,
            name=f"برنامه {athlete.first_name} {athlete.last_name}",
            description=f"برنامه تمرینی اختصاصی برای {athlete.first_name}",
            start_date=now - timedelta(days=7),
            end_date=now + timedelta(days=21),
            frequency_per_week=4,
            status="active",
        )
        db.add(program)
        db.flush()

        # Add exercises to program
        for day in range(3):
            for order, ex in enumerate(exercises[day * 3 : (day + 1) * 3]):
                pe = ProgramExercise(
                    program_id=program.id,
                    exercise_id=ex.id,
                    day_of_week=day,
                    order=order,
                    sets=4,
                    reps="10-12",
                    weight=20.0 if day == 0 else None,
                    rest_seconds=90,
                )
                db.add(pe)

    # ---- Goals ----
    goals_data = [
        {"athlete": athletes[0], "title": "کاهش وزن", "target_value": 10, "current_value": 3, "unit": "kg", "category": "weight_loss", "status": "in_progress"},
        {"athlete": athletes[1], "title": "افزایش عضله", "target_value": 5, "current_value": 1, "unit": "kg", "category": "muscle_gain", "status": "in_progress"},
        {"athlete": athletes[2], "title": "افزایش قدرت پرس سینه", "target_value": 80, "current_value": 60, "unit": "kg", "category": "strength", "status": "in_progress"},
        {"athlete": athletes[3], "title": "بهبود استقامت", "target_value": 30, "current_value": 15, "unit": "min", "category": "endurance", "status": "not_started"},
    ]
    for gd in goals_data:
        goal = Goal(
            athlete_id=gd["athlete"].id,
            coach_id=coach1.id,
            title=gd["title"],
            target_value=gd["target_value"],
            current_value=gd["current_value"],
            unit=gd["unit"],
            category=gd["category"],
            start_date=now - timedelta(days=15),
            target_date=now + timedelta(days=75),
            status=gd["status"],
        )
        db.add(goal)

    # ---- Check-Ins ----
    for i, athlete in enumerate(athletes):
        for d in range(5):
            ci_time = now - timedelta(days=10 - d, hours=2)
            co_time = ci_time + timedelta(hours=1, minutes=30)
            ci = CheckIn(
                user_id=athlete.id,
                branch_id=branch.id,
                check_in_time=ci_time,
                check_out_time=co_time,
                session_deducted=True,
            )
            db.add(ci)

    # ---- Payments ----
    for i, athlete in enumerate(athletes):
        membership = db.query(Membership).filter(Membership.user_id == athlete.id).first()
        p = Payment(
            user_id=athlete.id,
            membership_id=membership.id if membership else None,
            amount=membership.final_price if membership else 500000,
            currency="IRR",
            status="completed",
            method="cash",
            paid_at=now - timedelta(days=30),
            description=f"پرداخت {athlete.first_name} {athlete.last_name}",
        )
        db.add(p)

    # ---- Notifications ----
    for athlete in athletes:
        n = Notification(
            user_id=athlete.id,
            title="خوش آمدید",
            message=f"{athlete.first_name} {athlete.last_name} عزیز، به باشگاه خوش آمدید.",
            type="success",
            is_read=False,
        )
        db.add(n)

    db.commit()
    db.close()
    print("Database seeded successfully!")
