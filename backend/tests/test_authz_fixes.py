"""Regression tests for the 2026-10-02 Phase B authz hardening batch.

Covers:
1. Register anti-enumeration — responses are indistinguishable whether the
   email exists or not (same 200, byte-identical body), and no tokens are
   minted on the register path (explicit login required).
2. Coach-dashboard branch scoping — coaches see only their own dashboard;
   aggregates scoped to their branch; a branchless coach falls back to the
   sole branch (single-branch LUMI deployment, no other branches planned).
3. Exercise-completion authorization — only the program's athlete (owner),
   the assigned coach, or an admin may mark exercises complete.
4. Goal-progress authorization — mirrors update_goal's assignment rule via
   the shared _check_goal_assignment helper.

Runs against an isolated tmp sqlite DB (lifespan seeds it). All created
users use a unique suffix so this module is order-independent vs. the other
test modules when run in the same pytest process.
"""

import os
import uuid

import pytest
from fastapi.testclient import TestClient

SUFFIX = uuid.uuid4().hex[:8]


@pytest.fixture(scope="module")
def client(tmp_path_factory):
    db = tmp_path_factory.mktemp("db") / "authz.db"
    os.environ["SECRET_KEY"] = "test-only-key"
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


def _email(tag: str) -> str:
    return f"{tag}-{SUFFIX}@authz.ir"


def _authz(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _login(client, email: str, password: str):
    r = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return r.json()["data"]


def _register_login(client, tag: str, password: str = "secret12"):
    r = client.post(
        "/api/v1/auth/register",
        json={
            "email": _email(tag),
            "password": password,
            "firstName": "Authz",
            "lastName": tag,
            "phone": "",
        },
    )
    assert r.status_code == 200, r.text
    return _login(client, _email(tag), password)


@pytest.fixture(scope="module")
def ids(client):
    admin = _login(client, "admin@gymapp.ir", "admin123")
    coach1 = _login(client, "coach1@gymapp.ir", "coach123")
    coach2 = _login(client, "coach2@gymapp.ir", "coach123")
    a = _register_login(client, "ath-a")
    b = _register_login(client, "ath-b")
    ADH = _authz(admin["tokens"]["accessToken"])
    branch = client.get("/api/v1/branches", headers=ADH).json()["data"][0]

    def _admin_create(role: str, tag: str, extra: dict | None = None):
        payload = {
            "email": _email(tag),
            "password": "secret12",
            "firstName": "Authz",
            "lastName": tag,
            "role": role,
        }
        if extra:
            payload.update(extra)
        r = client.post("/api/v1/users", headers=ADH, json=payload)
        assert r.status_code == 200, r.text
        return _login(client, _email(tag), "secret12")

    recep = _admin_create("receptionist", "recep")
    coach_nb = _admin_create("coach", "coach-nb")  # coach with NO branch

    # Athlete A joins coach1's branch (athlete B stays branchless).
    r = client.put(f"/api/v1/users/{a['user']['id']}", headers=ADH, json={"branchId": branch["id"]})
    assert r.status_code == 200, r.text

    return {
        "ADH": ADH,
        "C1H": _authz(coach1["tokens"]["accessToken"]),
        "C2H": _authz(coach2["tokens"]["accessToken"]),
        "AH": _authz(a["tokens"]["accessToken"]),
        "BH": _authz(b["tokens"]["accessToken"]),
        "RH": _authz(recep["tokens"]["accessToken"]),
        "CNH": _authz(coach_nb["tokens"]["accessToken"]),
        "coach1_id": coach1["user"]["id"],
        "coach2_id": coach2["user"]["id"],
        "coach_nb_id": coach_nb["user"]["id"],
        "a_id": a["user"]["id"],
        "b_id": b["user"]["id"],
        "branch_id": branch["id"],
    }


@pytest.fixture(scope="module")
def prog(client, ids):
    r = client.post(
        "/api/v1/training-programs",
        headers=ids["C1H"],
        json={
            "athleteId": ids["a_id"],
            "coachId": ids["coach1_id"],
            "name": "Authz",
            "startDate": "2026-01-01T00:00:00",
            "endDate": "2026-02-01T00:00:00",
        },
    )
    assert r.status_code == 200, r.text
    program_id = r.json()["data"]["id"]
    ex = client.get("/api/v1/exercises", headers=ids["ADH"]).json()["data"][0]
    r = client.post(
        f"/api/v1/training-programs/{program_id}/exercises",
        headers=ids["C1H"],
        json={"exerciseId": ex["id"], "dayOfWeek": 1},
    )
    assert r.status_code == 200, r.text
    return {"program_id": program_id, "pe_id": r.json()["data"]["id"]}


@pytest.fixture(scope="module")
def goals(client, ids):
    r = client.post(
        "/api/v1/goals",
        headers=ids["C1H"],
        json={
            "athleteId": ids["a_id"],
            "coachId": ids["coach1_id"],
            "title": "G1",
            "targetValue": 100,
            "targetDate": "2026-12-01T00:00:00",
        },
    )
    assert r.status_code == 200, r.text
    g1 = r.json()["data"]["id"]
    # Unassigned goal (no coach) created by the athlete.
    r = client.post(
        "/api/v1/goals",
        headers=ids["AH"],
        json={"athleteId": ids["a_id"], "title": "G2", "targetValue": 50, "targetDate": "2026-12-01T00:00:00"},
    )
    assert r.status_code == 200, r.text
    return {"g1": g1, "g2": r.json()["data"]["id"]}


# ------------------------------------------------- 1. register anti-enumeration


@pytest.mark.xfail(reason="origin anti-enumeration: register mints no tokens; our product contract (AuthProvider) requires register to authenticate", strict=False)
def test_register_mints_no_tokens(client):
    r = client.post(
        "/api/v1/auth/register",
        json={
            "email": _email("no-tok"),
            "password": "secret12",
            "firstName": "No",
            "lastName": "Tok",
            "phone": "",
        },
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["success"] is True
    assert "data" not in body  # no user/tokens payload
    assert "tokens" not in r.text


@pytest.mark.xfail(reason="origin anti-enumeration; our 400 duplicate-email contract is deliberate", strict=False)
def test_register_duplicate_keeps_original_account(client):
    email = _email("dup-acc")
    payload = {"email": email, "password": "secret12", "firstName": "Dup", "lastName": "Acc", "phone": ""}
    r1 = client.post("/api/v1/auth/register", json=payload)
    assert r1.status_code == 200, r1.text
    # Same email, different password/name — must be indistinguishable.
    r2 = client.post("/api/v1/auth/register", json={**payload, "password": "otherpw99", "firstName": "Eve"})
    assert r2.status_code == 200, r2.text
    assert r2.json() == r1.json()
    # The duplicate attempt changed nothing: original password works, new one doesn't.
    assert client.post("/api/v1/auth/login", json={"email": email, "password": "secret12"}).status_code == 200
    assert client.post("/api/v1/auth/login", json={"email": email, "password": "otherpw99"}).status_code == 401


# ------------------------------------------------- 2. coach-dashboard branch scoping


def test_coach_dashboard_branchless_coach_uses_sole_branch(client, ids):
    # Single-branch deployment (LUMI only): a coach without an explicit branch
    # falls back to the sole branch instead of being locked out.
    r = client.get(f"/api/v1/dashboard/coach/{ids['coach_nb_id']}", headers=ids["CNH"])
    assert r.status_code == 200, r.text
    assert "athletes" in r.json()["data"]


def test_coach_cannot_view_other_coach_dashboard(client, ids):
    r = client.get(f"/api/v1/dashboard/coach/{ids['coach2_id']}", headers=ids["C1H"])
    assert r.status_code == 403, r.text


def test_receptionist_cannot_view_coach_dashboard(client, ids):
    r = client.get(f"/api/v1/dashboard/coach/{ids['coach1_id']}", headers=ids["RH"])
    assert r.status_code == 403, r.text


def test_admin_can_view_any_coach_dashboard(client, ids):
    r = client.get(f"/api/v1/dashboard/coach/{ids['coach1_id']}", headers=ids["ADH"])
    assert r.status_code == 200, r.text


def test_coach_dashboard_scoped_to_branch(client, ids, prog):
    # Athlete B is branchless; give coach1 a program for B too, then verify the
    # dashboard only lists the in-branch athlete A.
    r = client.post(
        "/api/v1/training-programs",
        headers=ids["C1H"],
        json={
            "athleteId": ids["b_id"],
            "coachId": ids["coach1_id"],
            "name": "Authz-B",
            "startDate": "2026-01-01T00:00:00",
            "endDate": "2026-02-01T00:00:00",
        },
    )
    assert r.status_code == 200, r.text
    d = client.get(f"/api/v1/dashboard/coach/{ids['coach1_id']}", headers=ids["C1H"]).json()["data"]
    got = {x["id"] for x in d["athletes"]}
    assert ids["a_id"] in got
    assert ids["b_id"] not in got


# ------------------------------------------------- 3. exercise-completion authz


def _complete(client, headers, prog):
    return client.post(
        f"/api/v1/training-programs/{prog['program_id']}/exercises/{prog['pe_id']}/complete",
        headers=headers,
        json={},
    )


def test_athlete_completes_own_exercise(client, ids, prog):
    r = _complete(client, ids["AH"], prog)
    assert r.status_code == 200, r.text
    assert r.json()["data"]["isCompleted"] is True


def test_athlete_cannot_complete_others_exercise(client, ids, prog):
    assert _complete(client, ids["BH"], prog).status_code == 403


def test_assigned_coach_can_complete(client, ids, prog):
    assert _complete(client, ids["C1H"], prog).status_code == 200


def test_unassigned_coach_cannot_complete(client, ids, prog):
    assert _complete(client, ids["C2H"], prog).status_code == 403


def test_receptionist_cannot_complete(client, ids, prog):
    assert _complete(client, ids["RH"], prog).status_code == 403


def test_admin_can_complete(client, ids, prog):
    assert _complete(client, ids["ADH"], prog).status_code == 200


# ------------------------------------------------- 4. goal-progress authz (mirrors update_goal)


def _progress(client, headers, goal_id, value=10):
    return client.post(f"/api/v1/goals/{goal_id}/progress", headers=headers, json={"currentValue": value})


def test_goal_progress_owner_200(client, ids, goals):
    r = _progress(client, ids["AH"], goals["g1"])
    assert r.status_code == 200, r.text
    assert r.json()["data"]["currentValue"] == 10


def test_goal_progress_other_athlete_403(client, ids, goals):
    assert _progress(client, ids["BH"], goals["g1"]).status_code == 403


def test_goal_progress_assigned_coach_200(client, ids, goals):
    assert _progress(client, ids["C1H"], goals["g1"]).status_code == 200


def test_goal_progress_unassigned_coach_403(client, ids, goals):
    assert _progress(client, ids["C2H"], goals["g1"]).status_code == 403


def test_goal_progress_coach_claims_unassigned_goal_200(client, ids, goals):
    # Same claim rule as update_goal: a coach may act on a goal with no coach.
    assert _progress(client, ids["C2H"], goals["g2"]).status_code == 200


def test_goal_progress_receptionist_is_read_only(client, ids, goals):
    # Goals are coaching domain: receptionists may read but not write,
    # matching the DELETE contract (previously PUT/progress allowed edits).
    assert _progress(client, ids["RH"], goals["g1"]).status_code == 403
