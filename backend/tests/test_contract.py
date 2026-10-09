"""Contract + RBAC regression suite for the Gym API.

Covers the P0/P1 fixes: dashboard contract shapes, privilege matrix,
self-registration hardening, payment/freeze contracts, program ownership.
The `client` / `tokens` fixtures live in conftest.py (shared with the v2 suite).
"""


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["data"]["status"] == "ok"


def test_route_count():
    from app.main import app

    ops = app.openapi()
    n = sum(len(v) for v in ops["paths"].values())
    # Floor raised from 69 to 92 by the contract-v2 surface (messaging,
    # password reset/change, profile, CRUD gaps, analytics).
    assert n >= 92, f"operations={n}"


def test_register_forces_athlete(tokens):
    assert tokens["athlete"]["user"]["role"] == "athlete"


def test_register_rejects_bad_email(client):
    r = client.post("/api/v1/auth/register", json={
        "email": "not-an-email", "password": "secret12",
        "firstName": "A", "lastName": "B"})
    assert r.status_code == 422


def test_error_shape_has_message(client):
    j = client.post("/api/v1/auth/login",
                    json={"email": "nope@x.ir", "password": "secret12"}).json()
    assert j["success"] is False and "message" in j


def test_stats_staff_only(client, tokens):
    assert client.get("/api/v1/dashboard/stats", headers=tokens["AH"]).status_code == 403
    r = client.get("/api/v1/dashboard/stats", headers=tokens["ADH"])
    assert r.status_code == 200 and "totalUsers" in r.json()["data"]


def test_athlete_dashboard_rich_shape(client, tokens):
    aid = tokens["athlete"]["user"]["id"]
    d = client.get(f"/api/v1/dashboard/athlete/{aid}", headers=tokens["AH"]).json()["data"]
    assert {"currentProgram", "todayExercises", "upcomingGoals",
            "recentCheckIns", "membership", "stats"} <= set(d)
    assert {"todayCheckins", "activePrograms", "membershipStatus", "recentCheckins"} <= set(d)
    assert set(d["stats"]) == {"totalSessions", "completedSessions",
                               "currentStreak", "longestStreak"}


def test_coach_dashboard_shape(client, tokens):
    cid = tokens["coach"]["user"]["id"]
    d = client.get(f"/api/v1/dashboard/coach/{cid}", headers=tokens["COH"]).json()["data"]
    assert {"athletesCount", "totalAthletes", "todaySessions", "activePrograms",
            "pendingGoals", "pendingReviews", "athletes"} <= set(d)
    assert isinstance(d["athletes"], list) and len(d["athletes"]) > 0


def test_coach_user_scope(client, tokens):
    users = client.get("/api/v1/users", headers=tokens["COH"]).json()["data"]
    assert all(u["role"] == "athlete" for u in users)
    admin_id = tokens["admin"]["user"]["id"]
    assert client.get(f"/api/v1/users/{admin_id}", headers=tokens["COH"]).status_code == 403


def test_self_update_strips_privilege_fields(client, tokens):
    aid = tokens["athlete"]["user"]["id"]
    # `status` is always stripped for non-staff. `branchId` may be set once
    # when the member has none (onboarding); an unknown branch is a 404.
    r = client.put(f"/api/v1/users/{aid}", headers=tokens["AH"],
                   json={"firstName": "A2", "status": "suspended",
                         "branchId": "b9"})
    assert r.status_code == 404
    u = client.put(f"/api/v1/users/{aid}", headers=tokens["AH"],
                   json={"firstName": "A2", "status": "suspended"}).json()["data"]
    assert u["firstName"] == "A2" and u["status"] == "active"


def test_payment_create_pending_only(client, tokens):
    aid = tokens["athlete"]["user"]["id"]
    r = client.post("/api/v1/payments", headers=tokens["ADH"],
                    json={"userId": aid, "amount": 10, "status": "completed"})
    assert r.status_code == 422


def test_freeze_camel_case(client, tokens):
    m = client.get("/api/v1/memberships", headers=tokens["ADH"],
                   params={"page_size": 1}).json()["data"][0]
    r = client.post(f"/api/v1/memberships/{m['id']}/freeze", headers=tokens["ADH"],
                    json={"freezeReason": "trip", "freezeEndDate": "2026-12-31T00:00:00"})
    assert r.status_code == 200
    client.post(f"/api/v1/memberships/{m['id']}/unfreeze", headers=tokens["ADH"])


def test_program_ownership(client, tokens):
    progs = client.get("/api/v1/training-programs", headers=tokens["ADH"]).json()["data"]
    cid = tokens["coach"]["user"]["id"]
    other = next(p for p in progs if p["coachId"] != cid)
    own = next(p for p in progs if p["coachId"] == cid)
    assert client.put(f"/api/v1/training-programs/{other['id']}",
                      headers=tokens["COH"], json={"name": "hijack"}).status_code == 403
    assert client.post(f"/api/v1/training-programs/{other['id']}/exercises",
                       headers=tokens["AH"],
                       json={"exerciseId": "e1", "dayOfWeek": 1}).status_code == 403
    ex = own["exercises"][0]
    assert client.post(
        f"/api/v1/training-programs/{own['id']}/exercises/{ex['id']}/complete",
        headers=tokens["AH"], json={}).status_code == 403
