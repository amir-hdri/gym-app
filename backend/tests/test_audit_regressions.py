from datetime import datetime, timedelta, timezone

API = "/api/v1"


def test_exercise_completion_can_be_undone(client, seeded):
    h = seeded["athlete1_h"]
    programs = client.get(f"{API}/training-programs", headers=h).json()["data"]
    program = next(p for p in programs if p["exercises"])
    exercise = program["exercises"][0]
    path = f"{API}/training-programs/{program['id']}/exercises/{exercise['id']}/complete"
    yes = client.post(path, headers=h, json={"completed": True}).json()["data"]
    assert yes["isCompleted"] and yes["completedAt"]
    no = client.post(path, headers=h, json={"completed": False}).json()["data"]
    assert not no["isCompleted"] and no["completedAt"] is None
    assert client.get(f"{API}/training-programs/{program['id']}", headers=h).json()["data"]["exercises"][0]["isCompleted"] is False


def test_coach_payment_visibility_is_scoped_and_writes_denied(client, seeded):
    # Coaches get read-only visibility into their own athletes' payments
    # (coach dashboard needs it); writes stay staff-only and other coaches'
    # athletes stay invisible.
    h = seeded["coach1_h"]
    mine = client.get(f"{API}/payments", headers=h)
    assert mine.status_code == 200
    coached = {
        p["athleteId"]
        for p in client.get(f"{API}/training-programs", headers=h).json()["data"]
    }
    for row in mine.json()["data"]:
        assert row["userId"] in coached
    payment = client.get(f"{API}/payments", headers=seeded["admin_h"]).json()["data"][0]
    assert client.get(f"{API}/payments/{payment['id']}", headers=h).status_code in (200, 403)
    assert client.post(f"{API}/payments", headers=h, json={"userId": seeded["athlete1_id"], "amount": 100}).status_code == 403
    assert client.put(f"{API}/payments/{payment['id']}", headers=h, json={"status": "completed"}).status_code == 403


def test_payment_membership_must_belong_to_user(client, seeded):
    membership = client.get(f"{API}/memberships", headers=seeded["athlete1_h"]).json()["data"][0]
    response = client.post(f"{API}/payments", headers=seeded["athlete2_h"], json={"userId": seeded["athlete2_id"], "membershipId": membership["id"], "amount": 100})
    assert response.status_code == 400


def test_membership_reference_and_balance_validation(client, seeded):
    now = datetime.now(timezone.utc)
    data = {"userId": seeded["athlete1_id"], "planId": "missing", "branchId": "missing", "startDate": now.isoformat(), "endDate": (now + timedelta(days=30)).isoformat(), "sessionsTotal": 10, "price": 100, "finalPrice": 100}
    assert client.post(f"{API}/memberships", headers=seeded["admin_h"], json=data).status_code == 404
    data["sessionsTotal"] = -1
    assert client.post(f"{API}/memberships", headers=seeded["admin_h"], json=data).status_code == 422


def test_timestamps_are_explicit_utc_and_reception_has_overview(client, seeded):
    expiry = seeded["athlete1"]["tokens"]["accessTokenExpiry"]
    assert datetime.fromisoformat(expiry).utcoffset() == timedelta(0)
    stats = client.get(f"{API}/dashboard/stats", headers=seeded["reception_h"])
    assert stats.status_code == 200
    assert stats.json()["data"]["totalCoaches"] >= 3
    assert stats.json()["data"]["totalMembers"] >= 8


def test_today_exercises_are_for_today(client, seeded):
    from zoneinfo import ZoneInfo
    day = (datetime.now(ZoneInfo("Asia/Tehran")).weekday() + 2) % 7
    data = client.get(f"{API}/dashboard/athlete/{seeded['athlete1_id']}", headers=seeded["athlete1_h"]).json()["data"]
    assert all(e["dayOfWeek"] == day for e in data["todayExercises"])


def test_readiness_persists_and_is_private(client, seeded):
    h = seeded["athlete1_h"]
    assert client.put(f"{API}/readiness", headers=h, json={"state": "energized"}).status_code == 200
    assert client.get(f"{API}/readiness", headers=h).json()["data"]["state"] == "energized"
    assert client.get(f"{API}/readiness", headers=seeded["athlete2_h"]).json()["data"]["state"] is None
    assert client.put(f"{API}/readiness", headers=h, json={"state": "invalid"}).status_code == 422


def test_forged_forwarded_for_cannot_bypass_rate_limit(client, monkeypatch):
    from app.config import settings
    from app.auth import _rate_limit_store
    monkeypatch.setattr(settings, "LOGIN_RATE_LIMIT", 1)
    _rate_limit_store.clear()
    try:
        first = client.post(f"{API}/auth/login", headers={"x-forwarded-for": "1.2.3.4"}, json={"email": "no@example.com", "password": "badpass123"})
        second = client.post(f"{API}/auth/login", headers={"x-forwarded-for": "2.3.4.5"}, json={"email": "no@example.com", "password": "badpass123"})
        assert first.status_code == 401
        assert second.status_code == 429
    finally:
        _rate_limit_store.clear()


def test_reset_mail_receives_token_without_logging_it(client, seeded, monkeypatch, caplog):
    from app.config import settings
    from app.routers import auth
    delivered = []
    monkeypatch.setattr(settings, "SMTP_HOST", "smtp.example.test")
    monkeypatch.setattr(settings, "SMTP_FROM", "noreply@example.test")
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(auth, "send_password_reset", lambda email, token: delivered.append((email, token)))
    response = client.post(f"{API}/auth/forgot-password", json={"email": "athlete1@gymapp.ir"})
    assert response.status_code == 200 and len(delivered) == 1
    assert "devToken" not in response.json()["data"]
    assert delivered[0][1] not in caplog.text


def test_password_change_revokes_access_and_refresh(client):
    email = "session-revocation@example.test"
    auth = client.post(f"{API}/auth/register", json={"email": email, "password": "OldPassword123", "firstName": "Test", "lastName": "Session", "phone": ""}).json()["data"]
    headers = {"Authorization": f"Bearer {auth['tokens']['accessToken']}"}
    assert client.post(f"{API}/auth/change-password", headers=headers, json={"currentPassword": "OldPassword123", "newPassword": "NewPassword123"}).status_code == 200
    assert client.get(f"{API}/auth/profile", headers=headers).status_code == 401
    assert client.post(f"{API}/auth/refresh", json={"refreshToken": auth["tokens"]["refreshToken"]}).status_code == 401
    assert client.post(f"{API}/auth/login", json={"email": email, "password": "NewPassword123"}).status_code == 200


def test_partial_sets_resume_and_undo_resets_sets(client, seeded):
    h = seeded["athlete1_h"]
    p = client.get(f"{API}/training-programs", headers=h).json()["data"][0]
    ex = p["exercises"][0]
    path = f"{API}/training-programs/{p['id']}/exercises/{ex['id']}/complete"
    assert client.post(path, headers=h, json={"completed": False, "actualSets": 1}).json()["data"]["actualSets"] == 1
    assert client.get(f"{API}/training-programs/{p['id']}", headers=h).json()["data"]["exercises"][0]["actualSets"] == 1
    assert client.post(path, headers=h, json={"completed": True}).json()["data"]["actualSets"] == ex["sets"]
    # Un-completing clears actuals (null, not a misleading 0-sets record).
    assert client.post(path, headers=h, json={"completed": False}).json()["data"]["actualSets"] is None
