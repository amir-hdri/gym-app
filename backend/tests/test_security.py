"""Security regression suite for the Gym API.

Covers: JWT auth flows (access/refresh, token-type confusion, expiry,
tampering, unknown/inactive users), login rate limiting (including the
X-Forwarded-For spoof bypass regression), production SECRET_KEY policy,
RBAC/resource-ownership across routers, and input validation.

Runs against an isolated tmp sqlite DB (lifespan seeds it). All created
users use a unique suffix so this module is order-independent vs.
test_contract.py when run in the same pytest process.
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
    db = tmp_path_factory.mktemp("db") / "sec.db"
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


def _email(tag: str) -> str:
    return f"{tag}-{SUFFIX}@sec.ir"


def _register(client, tag: str, password: str = "secret12"):
    r = client.post(
        "/api/v1/auth/register",
        json={
            "email": _email(tag),
            "password": password,
            "firstName": "Sec",
            "lastName": tag,
            "phone": "",
        },
    )
    assert r.status_code == 200, r.text
    # Register mints no tokens (anti-enumeration) — log in explicitly.
    body = r.json()
    assert body["success"] is True and "data" not in body
    lr = client.post("/api/v1/auth/login", json={"email": _email(tag), "password": password})
    assert lr.status_code == 200, lr.text
    return lr.json()["data"]


def _login(client, email: str, password: str):
    return client.post("/api/v1/auth/login", json={"email": email, "password": password})


def _authz(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def ids(client):
    admin = _login(client, "admin@gymapp.ir", "admin123").json()["data"]
    coach = _login(client, "coach1@gymapp.ir", "coach123").json()["data"]
    a = _register(client, "ath-a")
    b = _register(client, "ath-b")
    return {
        "ADH": _authz(admin["tokens"]["accessToken"]),
        "COH": _authz(coach["tokens"]["accessToken"]),
        "AH": _authz(a["tokens"]["accessToken"]),
        "BH": _authz(b["tokens"]["accessToken"]),
        "admin_id": admin["user"]["id"],
        "coach_id": coach["user"]["id"],
        "a_id": a["user"]["id"],
        "b_id": b["user"]["id"],
        "a_refresh": a["tokens"]["refreshToken"],
        "a_access": a["tokens"]["accessToken"],
    }


# ---------------------------------------------------------------- JWT flows


def test_refresh_token_rejected_as_access(client, ids):
    r = client.get("/api/v1/auth/profile", headers=_authz(ids["a_refresh"]))
    assert r.status_code == 401


def test_access_token_rejected_as_refresh(client, ids):
    r = client.post("/api/v1/auth/refresh", json={"refreshToken": ids["a_access"]})
    assert r.status_code == 401


def test_tampered_token_rejected(client, ids):
    bad = ids["a_access"][:-4] + "AAAA"
    assert client.get("/api/v1/auth/profile", headers=_authz(bad)).status_code == 401


def test_expired_token_rejected(client, ids):
    past = datetime.now(UTC) - timedelta(minutes=5)
    token = jwt.encode(
        {"user_id": ids["a_id"], "role": "athlete", "type": "access", "exp": past},
        SECRET,
        algorithm=ALGO,
    )
    assert client.get("/api/v1/auth/profile", headers=_authz(token)).status_code == 401


def test_refresh_unknown_user_rejected(client):
    token = jwt.encode(
        {"user_id": "no-such-user", "role": "athlete", "type": "refresh"},
        SECRET,
        algorithm=ALGO,
    )
    r = client.post("/api/v1/auth/refresh", json={"refreshToken": token})
    assert r.status_code == 401


def test_refresh_flow_issues_working_pair(client, ids):
    r = client.post("/api/v1/auth/refresh", json={"refreshToken": ids["a_refresh"]})
    assert r.status_code == 200
    new_access = r.json()["data"]["accessToken"]
    assert client.get("/api/v1/auth/profile", headers=_authz(new_access)).status_code == 200


def test_inactive_user_blocked(client, ids):
    u = _register(client, "ath-susp")
    uid = u["user"]["id"]
    uh = _authz(u["tokens"]["accessToken"])
    r = client.patch(f"/api/v1/users/{uid}/status", headers=ids["ADH"], json={"status": "suspended"})
    assert r.status_code == 200
    assert client.get("/api/v1/auth/profile", headers=uh).status_code == 403
    assert _login(client, _email("ath-susp"), "secret12").status_code == 403


def test_logout_is_client_side_only(client, ids):
    # Logout is stateless: the access token keeps working afterwards.
    # Documented behavior — revocation would require server-side denylist.
    assert client.post("/api/v1/auth/logout", headers=ids["AH"]).status_code == 200
    assert client.get("/api/v1/auth/profile", headers=ids["AH"]).status_code == 200


def test_wrong_password_rejected(client, ids):
    assert _login(client, _email("ath-a"), "wrong-password").status_code == 401


def test_register_duplicate_email_indistinguishable(client, ids):
    # Anti-enumeration: registering an existing email must be byte-identical to
    # registering a new one — same status, same body shape, no tokens minted.
    payload = {
        "email": _email("ath-a"),
        "password": "secret12",
        "firstName": "Dup",
        "lastName": "Dup",
    }
    r_new = client.post(
        "/api/v1/auth/register",
        json={**payload, "email": _email("enum-new")},
    )
    r_dup = client.post("/api/v1/auth/register", json=payload)
    assert r_new.status_code == 200 and r_dup.status_code == 200
    assert r_new.json() == r_dup.json()
    assert "data" not in r_new.json()


def test_unauthenticated_requests_rejected(client):
    assert client.get("/api/v1/users").status_code == 403
    assert client.get("/api/v1/auth/profile").status_code == 403


# ------------------------------------------------------- rate limiting


def test_login_rate_limit_triggers(client):
    for _ in range(5):
        assert _login(client, "ghost@sec.ir", "wrongpw1").status_code == 401
    assert _login(client, "ghost@sec.ir", "wrongpw1").status_code == 429


def test_xff_spoof_does_not_bypass_limit(client):
    # Regression test: X-Forwarded-For must be ignored unless TRUST_PROXY.
    # Rotating a spoofed header must NOT reset the per-IP bucket.
    for i in range(5):
        r = client.post(
            "/api/v1/auth/login",
            json={"email": "ghost@sec.ir", "password": "wrongpw1"},
            headers={"X-Forwarded-For": f"10.9.9.{i}"},
        )
        assert r.status_code == 401
    r = client.post(
        "/api/v1/auth/login",
        json={"email": "ghost@sec.ir", "password": "wrongpw1"},
        headers={"X-Forwarded-For": "10.9.9.99"},
    )
    assert r.status_code == 429


def test_trust_proxy_honors_xff(client, monkeypatch):
    from app.config import settings

    monkeypatch.setattr(settings, "TRUST_PROXY", True)
    # Distinct spoofed IPs => distinct buckets => no limit hit
    for i in range(6):
        r = client.post(
            "/api/v1/auth/login",
            json={"email": "ghost@sec.ir", "password": "wrongpw1"},
            headers={"X-Forwarded-For": f"10.8.8.{i}"},
        )
        assert r.status_code == 401
    # Same IP six times => limited
    for _ in range(5):
        assert (
            client.post(
                "/api/v1/auth/login",
                json={"email": "ghost@sec.ir", "password": "wrongpw1"},
                headers={"X-Forwarded-For": "10.8.8.200"},
            ).status_code
            == 401
        )
    assert (
        client.post(
            "/api/v1/auth/login",
            json={"email": "ghost@sec.ir", "password": "wrongpw1"},
            headers={"X-Forwarded-For": "10.8.8.200"},
        ).status_code
        == 429
    )


def test_production_rejects_weak_secret():
    backend = os.path.join(os.path.dirname(__file__), "..")
    base_env = {k: v for k, v in os.environ.items() if k not in ("SECRET_KEY", "ENVIRONMENT", "DATABASE_URL")}
    weak = dict(base_env, ENVIRONMENT="production", SECRET_KEY="short")
    r = subprocess.run(
        [sys.executable, "-c", "import app.config"],
        cwd=backend,
        env=weak,
        capture_output=True,
        text=True,
        timeout=60,
    )
    assert r.returncode != 0 and "SECRET_KEY" in r.stderr
    strong = dict(base_env, ENVIRONMENT="production", SECRET_KEY="x" * 64)
    r = subprocess.run(
        [sys.executable, "-c", "import app.config"],
        cwd=backend,
        env=strong,
        capture_output=True,
        text=True,
        timeout=60,
    )
    assert r.returncode == 0, r.stderr


# ------------------------------------------------- RBAC / resource ownership


def _branch_id(client, ids):
    return client.get("/api/v1/branches", headers=ids["ADH"]).json()["data"][0]["id"]


def test_payment_ownership(client, ids):
    p = client.post("/api/v1/payments", headers=ids["AH"], json={"userId": ids["a_id"], "amount": 100}).json()["data"]
    pid = p["id"]
    assert p["status"] == "pending"
    # Other athlete: cannot read, cannot list via filter, cannot change status
    assert client.get(f"/api/v1/payments/{pid}", headers=ids["BH"]).status_code == 403
    assert client.get("/api/v1/payments", headers=ids["BH"], params={"user_id": ids["a_id"]}).status_code == 403
    mine = client.get("/api/v1/payments", headers=ids["BH"]).json()["data"]
    assert all(x["userId"] == ids["b_id"] for x in mine)
    assert (
        client.patch(f"/api/v1/payments/{pid}/status", headers=ids["BH"], json={"status": "completed"}).status_code
        == 403
    )
    assert (
        client.patch(f"/api/v1/payments/{pid}/status", headers=ids["COH"], json={"status": "completed"}).status_code
        == 403
    )
    # Admin can transition
    r = client.patch(f"/api/v1/payments/{pid}/status", headers=ids["ADH"], json={"status": "completed"})
    assert r.status_code == 200 and r.json()["data"]["status"] == "completed"
    assert r.json()["data"]["paidAt"] is not None


def test_payment_create_for_other_athlete_forbidden(client, ids):
    r = client.post("/api/v1/payments", headers=ids["AH"], json={"userId": ids["b_id"], "amount": 50})
    assert r.status_code == 403


def test_checkin_ownership(client, ids):
    branch = _branch_id(client, ids)
    c = client.post("/api/v1/check-ins", headers=ids["AH"], json={"userId": ids["a_id"], "branchId": branch}).json()[
        "data"
    ]
    cid = c["id"]
    # Athlete B cannot list A's check-ins via filter, and their own list is self-scoped
    assert client.get("/api/v1/check-ins", headers=ids["BH"], params={"user_id": ids["a_id"]}).status_code == 403
    own = client.get("/api/v1/check-ins", headers=ids["BH"]).json()["data"]
    assert all(x["userId"] == ids["b_id"] for x in own)
    # Athlete B cannot check A in, nor check A's session out (both checkout styles)
    assert (
        client.post(
            "/api/v1/check-ins", headers=ids["BH"], json={"userId": ids["a_id"], "branchId": branch}
        ).status_code
        == 403
    )
    assert client.post("/api/v1/check-ins/check-out", headers=ids["BH"], json={"checkInId": cid}).status_code == 403
    assert client.put(f"/api/v1/check-ins/{cid}/checkout", headers=ids["BH"], json={}).status_code == 403
    # A can check themselves out
    assert client.put(f"/api/v1/check-ins/{cid}/checkout", headers=ids["AH"], json={}).status_code == 200


def test_goal_ownership(client, ids):
    g = client.post(
        "/api/v1/goals",
        headers=ids["AH"],
        json={
            "athleteId": ids["a_id"],
            "title": "Squat 100kg",
            "targetValue": 100,
            "startDate": "2026-01-01T00:00:00",
            "targetDate": "2026-06-01T00:00:00",
        },
    ).json()["data"]
    gid = g["id"]
    assert client.get(f"/api/v1/goals/{gid}", headers=ids["BH"]).status_code == 403
    assert (
        client.post(
            "/api/v1/goals",
            headers=ids["BH"],
            json={
                "athleteId": ids["a_id"],
                "title": "hijack",
                "targetValue": 1,
                "startDate": "2026-01-01T00:00:00",
                "targetDate": "2026-06-01T00:00:00",
            },
        ).status_code
        == 403
    )


def test_membership_ownership(client, ids):
    plan = client.get("/api/v1/membership-plans", headers=ids["ADH"]).json()["data"][0]["id"]
    branch = _branch_id(client, ids)
    body = {
        "userId": ids["a_id"],
        "planId": plan,
        "branchId": branch,
        "startDate": "2026-01-01T00:00:00",
        "endDate": "2026-12-31T00:00:00",
        "status": "active",
        "price": 100,
        "finalPrice": 100,
    }
    m = client.post("/api/v1/memberships", headers=ids["ADH"], json=body).json()["data"]
    mid = m["id"]
    assert client.get(f"/api/v1/memberships/{mid}", headers=ids["BH"]).status_code == 403
    assert client.get("/api/v1/memberships", headers=ids["BH"], params={"user_id": ids["a_id"]}).status_code == 403
    own = client.get("/api/v1/memberships", headers=ids["AH"]).json()["data"]
    assert all(x["userId"] == ids["a_id"] for x in own)
    # Athlete cannot create memberships at all
    assert client.post("/api/v1/memberships", headers=ids["AH"], json=body).status_code == 403


def test_coach_cannot_touch_admin(client, ids):
    assert client.get(f"/api/v1/users/{ids['admin_id']}", headers=ids["COH"]).status_code == 403
    assert (
        client.put(f"/api/v1/users/{ids['admin_id']}", headers=ids["COH"], json={"firstName": "X"}).status_code == 403
    )


def test_coach_cannot_delete_users(client, ids):
    assert client.delete(f"/api/v1/users/{ids['b_id']}", headers=ids["COH"]).status_code == 403


# ------------------------------------------------------- input validation


def test_register_short_password_rejected(client):
    r = client.post(
        "/api/v1/auth/register",
        json={"email": _email("shortpw"), "password": "123", "firstName": "A", "lastName": "B"},
    )
    assert r.status_code == 422


def test_payment_negative_amount_rejected(client, ids):
    r = client.post("/api/v1/payments", headers=ids["AH"], json={"userId": ids["a_id"], "amount": -5})
    assert r.status_code == 422


def test_payment_bad_date_filter_rejected(client, ids):
    r = client.get("/api/v1/payments", headers=ids["ADH"], params={"date_from": "not-a-date"})
    assert r.status_code == 400


def test_pagination_bounds_enforced(client, ids):
    r = client.get("/api/v1/users", headers=ids["ADH"], params={"page_size": 500})
    assert r.status_code == 422
