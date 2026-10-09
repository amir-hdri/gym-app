"""Regression tests for the 2026-10-02 backend fix batch.

Covers: SQLite FK enforcement (delete cascades), existence-check 404s,
revenue month arithmetic, dashboard query refactors, duplicate-email 409,
malformed-token 401, failed-only login rate limiting, register rate limit,
schema validators, GoalCreate.start_date default, AdminUserCreate.branchId
alias, camelCase filter params, docs gating, and seed gating.

Runs against an isolated tmp sqlite DB (lifespan seeds it). All created
users use a unique suffix so this module is order-independent vs. the other
test modules when run in the same pytest process.
"""

import os
import subprocess
import sys
import uuid
from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from jose import jwt

SUFFIX = uuid.uuid4().hex[:8]
SECRET = "test-only-key"
ALGO = "HS256"


@pytest.fixture(scope="module")
def client(tmp_path_factory):
    db = tmp_path_factory.mktemp("db") / "fixes.db"
    os.environ["SECRET_KEY"] = SECRET
    os.environ["DATABASE_URL"] = f"sqlite:///{db}"
    os.environ["SEED_ADMIN_PASSWORD"] = "admin123"
    os.environ["SEED_COACH_PASSWORD"] = "coach123"
    os.environ["SEED_ATHLETE_PASSWORD"] = "athlete123"
    from app.main import app

    with TestClient(app) as c:
        yield c


@pytest.fixture(autouse=True)
def _clear_rate_limits():
    from app.auth import _rate_limit_store

    _rate_limit_store.clear()
    yield
    _rate_limit_store.clear()


@pytest.fixture(autouse=True)
def _pin_rate_limit(monkeypatch):
    """The login/register limit tests assert the default ceiling (5/min);
    pin it — the shared conftest client raises it to 500 and import order
    would otherwise decide the value for the whole process."""
    from app.config import settings

    monkeypatch.setattr(settings, "LOGIN_RATE_LIMIT", 5)


def _email(tag: str) -> str:
    return f"{tag}-{SUFFIX}@fix.ir"


def _authz(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _login(client, email: str, password: str):
    return client.post("/api/v1/auth/login", json={"email": email, "password": password})


def _ensure_checked_out(client, ids):
    """Check out any open check-ins for the fixture athlete (check-in rejects doubles)."""
    r = client.get("/api/v1/check-ins", headers=ids["ADH"], params={"userId": ids["a_id"]})
    for c in r.json()["data"]:
        if not c.get("checkOutTime"):
            client.put(f"/api/v1/check-ins/{c['id']}/checkout", headers=ids["AH"], json={})


@pytest.fixture(scope="module")
def ids(client):
    admin = _login(client, "admin@gymapp.ir", "admin123").json()["data"]
    coach = _login(client, "coach1@gymapp.ir", "coach123").json()["data"]
    r = client.post(
        "/api/v1/auth/register",
        json={
            "email": _email("ath"),
            "password": "secret12",
            "firstName": "Fix",
            "lastName": "Ath",
            "phone": "",
        },
    )
    assert r.status_code == 200, r.text
    # Our register contract returns data (user + tokens) directly — the
    # frontend authenticates in the same call (see AuthProvider.register).
    a = client.post("/api/v1/auth/login", json={"email": _email("ath"), "password": "secret12"}).json()["data"]
    assert a["user"]["role"] == "athlete"
    return {
        "ADH": _authz(admin["tokens"]["accessToken"]),
        "COH": _authz(coach["tokens"]["accessToken"]),
        "AH": _authz(a["tokens"]["accessToken"]),
        "coach_id": coach["user"]["id"],
        "a_id": a["user"]["id"],
    }


@pytest.fixture(scope="module")
def ref_ids(client, ids):
    branch = client.get("/api/v1/branches", headers=ids["ADH"]).json()["data"][0]["id"]
    plan = client.get("/api/v1/membership-plans", headers=ids["ADH"]).json()["data"][0]["id"]
    return {"branch": branch, "plan": plan}


# ------------------------------------------------- 1. SQLite FK enforcement


def test_delete_user_cascades_memberships_no_orphans(client, ids, ref_ids):
    from app.database import SessionLocal
    from app.models import Membership

    r = client.post(
        "/api/v1/users",
        headers=ids["ADH"],
        json={
            "email": _email("del"),
            "password": "secret12",
            "firstName": "Del",
            "lastName": "Ete",
            "phone": "",
            "role": "athlete",
        },
    )
    assert r.status_code == 200, r.text
    uid = r.json()["data"]["id"]

    m = client.post(
        "/api/v1/memberships",
        headers=ids["ADH"],
        json={
            "userId": uid,
            "planId": ref_ids["plan"],
            "branchId": ref_ids["branch"],
            "startDate": "2026-01-01T00:00:00",
            "endDate": "2026-12-31T00:00:00",
            "price": 100,
            "finalPrice": 100,
        },
    )
    assert m.status_code == 200, m.text

    assert client.delete(f"/api/v1/users/{uid}", headers=ids["ADH"]).status_code == 200

    db = SessionLocal()
    try:
        orphans = db.query(Membership).filter(Membership.user_id == uid).count()
    finally:
        db.close()
    assert orphans == 0


# ------------------------------------------------- 2. existence checks -> 404


def _membership_body(ref_ids, uid, **over):
    body = {
        "userId": uid,
        "planId": ref_ids["plan"],
        "branchId": ref_ids["branch"],
        "startDate": "2026-01-01T00:00:00",
        "endDate": "2026-12-31T00:00:00",
        "price": 100,
        "finalPrice": 100,
    }
    body.update(over)
    return body


def test_create_membership_404_on_missing_refs(client, ids, ref_ids):
    assert (
        client.post(
            "/api/v1/memberships",
            headers=ids["ADH"],
            json=_membership_body(ref_ids, "no-such-user"),
        ).status_code
        == 404
    )
    assert (
        client.post(
            "/api/v1/memberships",
            headers=ids["ADH"],
            json=_membership_body(ref_ids, ids["a_id"], planId="no-such-plan"),
        ).status_code
        == 404
    )
    assert (
        client.post(
            "/api/v1/memberships",
            headers=ids["ADH"],
            json=_membership_body(ref_ids, ids["a_id"], branchId="no-such-branch"),
        ).status_code
        == 404
    )
    # happy path still works
    r = client.post("/api/v1/memberships", headers=ids["ADH"], json=_membership_body(ref_ids, ids["a_id"]))
    assert r.status_code == 200, r.text


def test_create_program_404_on_missing_refs(client, ids):
    base = {
        "athleteId": ids["a_id"],
        "coachId": ids["coach_id"],
        "name": "P1",
        "startDate": "2026-01-01T00:00:00",
        "endDate": "2026-02-01T00:00:00",
    }
    r = client.post(
        "/api/v1/training-programs",
        headers=ids["COH"],
        json={**base, "athleteId": "no-such-athlete"},
    )
    assert r.status_code == 404
    # coach_id must exist too (admin bypasses the own-coaching check)
    r = client.post(
        "/api/v1/training-programs",
        headers=ids["ADH"],
        json={**base, "coachId": "no-such-coach"},
    )
    assert r.status_code == 404
    # happy path still works
    r = client.post("/api/v1/training-programs", headers=ids["COH"], json=base)
    assert r.status_code == 200, r.text


def test_create_user_404_on_missing_branch(client, ids):
    r = client.post(
        "/api/v1/users",
        headers=ids["ADH"],
        json={
            "email": _email("nobranch"),
            "password": "secret12",
            "firstName": "No",
            "lastName": "Branch",
            "phone": "",
            "role": "athlete",
            "branchId": "no-such-branch",
        },
    )
    assert r.status_code == 404
    # no branch at all still works
    r = client.post(
        "/api/v1/users",
        headers=ids["ADH"],
        json={
            "email": _email("plain"),
            "password": "secret12",
            "firstName": "Plain",
            "lastName": "User",
            "phone": "",
            "role": "athlete",
        },
    )
    assert r.status_code == 200, r.text


def test_create_payment_404_on_missing_membership(client, ids):
    r = client.post(
        "/api/v1/payments",
        headers=ids["AH"],
        json={"userId": ids["a_id"], "membershipId": "no-such-membership", "amount": 100},
    )
    assert r.status_code == 404
    # standalone payment (no membership) still works
    r = client.post("/api/v1/payments", headers=ids["AH"], json={"userId": ids["a_id"], "amount": 100})
    assert r.status_code == 200, r.text


# ------------------------------------------------- 3. revenue month arithmetic


def test_shift_months_pins_february_case():
    from app.routers.dashboard import _shift_months

    today = datetime(2026, 3, 1)
    labels = [_shift_months(today.replace(day=1), -(3 - 1 - i)).strftime("%Y-%m") for i in range(3)]
    # the trailing 3 calendar months including March itself — February must not be skipped
    assert labels == ["2026-01", "2026-02", "2026-03"]


def test_shift_months_edge_cases():
    from app.routers.dashboard import _shift_months

    assert _shift_months(datetime(2026, 1, 15), -1) == datetime(2025, 12, 15)
    assert _shift_months(datetime(2026, 12, 1), 1) == datetime(2027, 1, 1)
    # day clamped to target month length (Jan 31 + 1 month -> Feb 28 in 2026)
    assert _shift_months(datetime(2026, 1, 31), 1) == datetime(2026, 2, 28)
    assert _shift_months(datetime(2026, 3, 31), -1) == datetime(2026, 2, 28)


# ------------------------------------------------- 4/5. dashboard refactors


def test_athlete_dashboard_counts_match_history(client, ids, ref_ids):
    _ensure_checked_out(client, ids)
    # two check-ins, each checked out (the API rejects overlapping check-ins)
    for _ in range(2):
        r = client.post(
            "/api/v1/check-ins",
            headers=ids["AH"],
            json={"userId": ids["a_id"], "branchId": ref_ids["branch"]},
        )
        assert r.status_code == 200, r.text
        cid = r.json()["data"]["id"]
        assert client.put(f"/api/v1/check-ins/{cid}/checkout", headers=ids["AH"], json={}).status_code == 200

    r = client.get(f"/api/v1/dashboard/athlete/{ids['a_id']}", headers=ids["ADH"])
    assert r.status_code == 200, r.text
    d = r.json()["data"]
    assert d["todayCheckins"] >= 2
    assert d["stats"]["totalSessions"] >= 2
    assert d["stats"]["completedSessions"] >= 1
    assert len(d["recentCheckins"]) <= 5
    assert set(d["stats"]) == {"totalSessions", "completedSessions", "currentStreak", "longestStreak"}


def test_coach_dashboard_batched_payload(client, ids, ref_ids):
    _ensure_checked_out(client, ids)
    # coach creates a program for the athlete and the athlete checks in
    r = client.post(
        "/api/v1/training-programs",
        headers=ids["COH"],
        json={
            "athleteId": ids["a_id"],
            "coachId": ids["coach_id"],
            "name": "Batch",
            "startDate": "2026-01-01T00:00:00",
            "endDate": "2026-02-01T00:00:00",
        },
    )
    assert r.status_code == 200, r.text
    r = client.post(
        "/api/v1/check-ins",
        headers=ids["AH"],
        json={"userId": ids["a_id"], "branchId": ref_ids["branch"]},
    )
    assert r.status_code == 200, r.text

    # Branch scoping: the coach dashboard only includes athletes in the coach's
    # branch, so assign the fixture athlete to that branch first.
    r = client.put(
        f"/api/v1/users/{ids['a_id']}",
        headers=ids["ADH"],
        json={"branchId": ref_ids["branch"]},
    )
    assert r.status_code == 200, r.text

    r = client.get(f"/api/v1/dashboard/coach/{ids['coach_id']}", headers=ids["COH"])
    assert r.status_code == 200, r.text
    d = r.json()["data"]
    assert set(d) == {
        "athletesCount",
        "totalAthletes",
        "todaySessions",
        "activePrograms",
        "pendingGoals",
        "pendingReviews",
        "athletes",
    }
    entry = next(x for x in d["athletes"] if x["id"] == ids["a_id"])
    assert entry["lastCheckIn"] is not None
    assert set(entry) == {"id", "name", "avatarUrl", "currentProgram", "lastCheckIn", "progress"}


# ------------------------------------------------- 6. duplicate email -> 409


def test_update_user_duplicate_email_409(client, ids):
    r = client.post(
        "/api/v1/users",
        headers=ids["ADH"],
        json={
            "email": _email("dupA"),
            "password": "secret12",
            "firstName": "Dup",
            "lastName": "A",
            "phone": "",
            "role": "athlete",
        },
    )
    assert r.status_code == 200, r.text
    a_id = r.json()["data"]["id"]
    r = client.post(
        "/api/v1/users",
        headers=ids["ADH"],
        json={
            "email": _email("dupB"),
            "password": "secret12",
            "firstName": "Dup",
            "lastName": "B",
            "phone": "",
            "role": "athlete",
        },
    )
    assert r.status_code == 200, r.text

    r = client.put(f"/api/v1/users/{a_id}", headers=ids["ADH"], json={"email": _email("dupB")})
    assert r.status_code == 409
    # unchanged email still fine
    r = client.put(f"/api/v1/users/{a_id}", headers=ids["ADH"], json={"email": _email("dupA")})
    assert r.status_code == 200, r.text


# ------------------------------------------------- 7. token without user_id -> 401


def test_token_missing_user_id_rejected_401(client):
    future = datetime.now(UTC) + timedelta(minutes=5)
    token = jwt.encode({"role": "athlete", "type": "access", "exp": future}, SECRET, algorithm=ALGO)
    r = client.get("/api/v1/auth/profile", headers=_authz(token))
    assert r.status_code == 401


# ------------------------------------------------- 8. docs gating


def _run_in_env(env_overrides, code):
    backend = os.path.join(os.path.dirname(__file__), "..")
    base_env = {
        k: v for k, v in os.environ.items() if k not in ("SECRET_KEY", "ENVIRONMENT", "DATABASE_URL", "SEED_DEMO_DATA")
    }
    env = dict(base_env, **env_overrides)
    r = subprocess.run(
        [sys.executable, "-c", code],
        cwd=backend,
        env=env,
        capture_output=True,
        text=True,
        timeout=60,
    )
    assert r.returncode == 0, r.stderr
    return r.stdout.strip()


def test_docs_disabled_in_production():
    out = _run_in_env(
        {"ENVIRONMENT": "production", "SECRET_KEY": "x" * 64},
        "from app.main import app; print(app.docs_url)",
    )
    assert out == "None"


def test_docs_enabled_in_development():
    out = _run_in_env({}, "from app.main import app; print(app.docs_url)")
    assert out == "/docs"


# ------------------------------------------------- 9. failed-only login rate limit


def test_successful_logins_do_not_consume_quota(client):
    for _ in range(6):
        r = _login(client, "admin@gymapp.ir", "admin123")
        assert r.status_code == 200, r.text


def test_failed_logins_still_trigger_limit(client):
    for _ in range(5):
        assert _login(client, "ghost@fix.ir", "wrongpw1").status_code == 401
    assert _login(client, "ghost@fix.ir", "wrongpw1").status_code == 429


# ------------------------------------------------- 10. register rate limit


def test_register_rate_limit_triggers(client, monkeypatch):
    from app.config import settings

    monkeypatch.setattr(settings, "TRUST_PROXY", True)
    headers = {"X-Forwarded-For": "9.9.9.9"}
    for i in range(5):
        r = client.post(
            "/api/v1/auth/register",
            json={
                "email": f"rl{i}-{SUFFIX}@fix.ir",
                "password": "secret12",
                "firstName": "Rl",
                "lastName": str(i),
                "phone": "",
            },
            headers=headers,
        )
        assert r.status_code == 200, r.text
    r = client.post(
        "/api/v1/auth/register",
        json={
            "email": f"rl5-{SUFFIX}@fix.ir",
            "password": "secret12",
            "firstName": "Rl",
            "lastName": "5",
            "phone": "",
        },
        headers=headers,
    )
    assert r.status_code == 429


# ------------------------------------------------- 11. schema validators


def test_membership_create_validators_422(client, ids, ref_ids):
    good = _membership_body(ref_ids, ids["a_id"])
    # end_date < start_date
    r = client.post(
        "/api/v1/memberships",
        headers=ids["ADH"],
        json={**good, "startDate": "2026-06-01T00:00:00", "endDate": "2026-01-01T00:00:00"},
    )
    assert r.status_code == 422
    # discount_amount > price
    r = client.post(
        "/api/v1/memberships",
        headers=ids["ADH"],
        json={**good, "price": 100, "discountAmount": 150, "finalPrice": 100},
    )
    assert r.status_code == 422
    # sessions_used > sessions_total
    r = client.post(
        "/api/v1/memberships",
        headers=ids["ADH"],
        json={**good, "sessionsTotal": 5, "sessionsUsed": 6},
    )
    assert r.status_code == 422


def test_training_program_create_date_order_422(client, ids):
    r = client.post(
        "/api/v1/training-programs",
        headers=ids["COH"],
        json={
            "athleteId": ids["a_id"],
            "coachId": ids["coach_id"],
            "name": "Bad",
            "startDate": "2026-02-01T00:00:00",
            "endDate": "2026-01-01T00:00:00",
        },
    )
    assert r.status_code == 422


def test_goal_create_start_date_defaults_to_today(client, ids):
    r = client.post(
        "/api/v1/goals",
        headers=ids["AH"],
        json={
            "athleteId": ids["a_id"],
            "title": "No start",
            "targetValue": 10,
            "targetDate": (datetime.now(UTC) + timedelta(days=30)).isoformat(),
        },
    )
    assert r.status_code == 200, r.text
    start = r.json()["data"]["startDate"]
    assert start[:10] == datetime.now(UTC).date().isoformat()


def test_goal_create_start_after_target_422(client, ids):
    r = client.post(
        "/api/v1/goals",
        headers=ids["AH"],
        json={
            "athleteId": ids["a_id"],
            "title": "Bad dates",
            "targetValue": 10,
            "startDate": "2026-06-02T00:00:00",
            "targetDate": "2026-06-01T00:00:00",
        },
    )
    assert r.status_code == 422


# ------------------------------------------------- 12. branchId alias


def test_create_user_branch_id_alias_persisted(client, ids, ref_ids):
    r = client.post(
        "/api/v1/users",
        headers=ids["ADH"],
        json={
            "email": _email("br"),
            "password": "secret12",
            "firstName": "Br",
            "lastName": "Alias",
            "phone": "",
            "role": "athlete",
            "branchId": ref_ids["branch"],
        },
    )
    assert r.status_code == 200, r.text
    assert r.json()["data"]["branchId"] == ref_ids["branch"]


# ------------------------------------------------- 13. camelCase filter params


def test_goals_filter_accepts_both_spellings(client, ids):
    r = client.post(
        "/api/v1/goals",
        headers=ids["AH"],
        json={
            "athleteId": ids["a_id"],
            "title": "Filter me",
            "targetValue": 5,
            "targetDate": "2026-12-01T00:00:00",
        },
    )
    assert r.status_code == 200, r.text
    for params in ({"athleteId": ids["a_id"]}, {"athlete_id": ids["a_id"]}):
        r = client.get("/api/v1/goals", headers=ids["ADH"], params=params)
        assert r.status_code == 200, r.text
        rows = r.json()["data"]
        assert rows, f"no rows for {params}"
        assert all(x["athleteId"] == ids["a_id"] for x in rows)
    # an unknown id must filter everything out (previously: silently ignored -> everyone's rows)
    r = client.get("/api/v1/goals", headers=ids["ADH"], params={"athleteId": "no-such-athlete"})
    assert r.json()["data"] == []


def test_checkins_filter_accepts_both_spellings(client, ids, ref_ids):
    _ensure_checked_out(client, ids)
    r = client.post(
        "/api/v1/check-ins",
        headers=ids["AH"],
        json={"userId": ids["a_id"], "branchId": ref_ids["branch"]},
    )
    assert r.status_code == 200, r.text
    for params in ({"userId": ids["a_id"]}, {"user_id": ids["a_id"]}):
        r = client.get("/api/v1/check-ins", headers=ids["ADH"], params=params)
        assert r.status_code == 200, r.text
        rows = r.json()["data"]
        assert rows
        assert all(x["userId"] == ids["a_id"] for x in rows)
    r = client.get("/api/v1/check-ins", headers=ids["ADH"], params={"userId": "no-such-user"})
    assert r.json()["data"] == []


def test_payments_filter_accepts_both_spellings(client, ids):
    r = client.post("/api/v1/payments", headers=ids["AH"], json={"userId": ids["a_id"], "amount": 42})
    assert r.status_code == 200, r.text
    for params in ({"userId": ids["a_id"]}, {"user_id": ids["a_id"]}):
        r = client.get("/api/v1/payments", headers=ids["ADH"], params=params)
        assert r.status_code == 200, r.text
        rows = r.json()["data"]
        assert rows
        assert all(x["userId"] == ids["a_id"] for x in rows)
    r = client.get("/api/v1/payments", headers=ids["ADH"], params={"userId": "no-such-user"})
    assert r.json()["data"] == []


# ------------------------------------------------- 16. seed gating


def test_seed_gating_conditions():
    from app.config import Settings

    dev = Settings(ENVIRONMENT="development")
    assert (not dev.is_production) and (dev.ENVIRONMENT == "development" or dev.SEED_DEMO_DATA)

    staging = Settings(ENVIRONMENT="staging")
    assert not staging.is_production
    assert not ((not staging.is_production) and (staging.ENVIRONMENT == "development" or staging.SEED_DEMO_DATA))

    staging_opt_in = Settings(ENVIRONMENT="staging", SEED_DEMO_DATA=True)
    assert (not staging_opt_in.is_production) and (
        staging_opt_in.ENVIRONMENT == "development" or staging_opt_in.SEED_DEMO_DATA
    )

    prod = Settings(ENVIRONMENT="production", SECRET_KEY="x" * 64)
    assert not ((not prod.is_production) and (prod.ENVIRONMENT == "development" or prod.SEED_DEMO_DATA))
    assert prod.SEED_DEMO_DATA is False
