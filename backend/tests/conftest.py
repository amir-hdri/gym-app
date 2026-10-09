"""Shared test fixtures.

Session-scoped on purpose: ``app.config.Settings()`` is instantiated at import
time, so the environment has to be set before ``app.main`` is imported and the
app can only be built once per test run. Every test module shares that one app
and its seeded tmp database.
"""

import os

import pytest
from fastapi.testclient import TestClient

ADMIN_EMAIL = "admin@gymapp.ir"
ADMIN_PASSWORD = "admin123"
RECEPTION_EMAIL = "reception@gymapp.ir"
RECEPTION_PASSWORD = "reception123"
COACH_PASSWORD = "coach123"
ATHLETE_PASSWORD = "athlete123"


@pytest.fixture(scope="session")
def client(tmp_path_factory):
    db = tmp_path_factory.mktemp("db") / "test.db"
    os.environ["SECRET_KEY"] = "test-only-key-with-at-least-32-bytes"
    os.environ["DATABASE_URL"] = f"sqlite:///{db}"
    os.environ["ENVIRONMENT"] = "development"
    os.environ["SEED_ADMIN_PASSWORD"] = ADMIN_PASSWORD
    os.environ["SEED_COACH_PASSWORD"] = COACH_PASSWORD
    os.environ["SEED_ATHLETE_PASSWORD"] = ATHLETE_PASSWORD
    os.environ["SEED_RECEPTIONIST_PASSWORD"] = RECEPTION_PASSWORD
    # The limiter keys on client IP and every TestClient request shares one.
    os.environ["LOGIN_RATE_LIMIT"] = "500"
    from app.main import app

    with TestClient(app) as c:
        yield c


def _login(client, email: str, password: str) -> dict:
    r = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, f"login failed for {email}: {r.status_code} {r.text}"
    return r.json()["data"]


def _auth(payload: dict) -> dict:
    return {"Authorization": f"Bearer {payload['tokens']['accessToken']}"}


@pytest.fixture(autouse=True)
def _isolate_rate_limiter():
    """The login/register/reset limiter is a module-global in-memory store and
    every TestClient request shares one IP — without isolation, failed logins
    from one file burn quota for rate tests in another and the suite is
    order-dependent. (Import is deferred so `app.main` still wins the
    settings-from-environment race in the session `client` fixture.)"""
    from app.auth import _rate_limit_store

    _rate_limit_store.clear()
    yield
    _rate_limit_store.clear()


@pytest.fixture(scope="session")
def tokens(client):
    admin = _login(client, ADMIN_EMAIL, ADMIN_PASSWORD)
    coach = _login(client, "coach1@gymapp.ir", COACH_PASSWORD)
    reg = client.post(
        "/api/v1/auth/register",
        json={
            "email": "probe@x.ir",
            "password": "secret12",
            "firstName": "A",
            "lastName": "B",
            "phone": "",
            "role": "admin",
        },
    ).json()["data"]
    return {
        "admin": admin,
        "coach": coach,
        "athlete": reg,
        "ADH": {"Authorization": f"Bearer {admin['tokens']['accessToken']}"},
        "COH": {"Authorization": f"Bearer {coach['tokens']['accessToken']}"},
        "AH": {"Authorization": f"Bearer {reg['tokens']['accessToken']}"},
    }


@pytest.fixture(scope="session")
def seeded(client):
    """Logins for the seeded demo accounts, keyed by a short handle.

    ``athlete1``/``coach1`` are conversation partners in the seed; ``athlete2``
    and ``coach2`` are therefore non-participants of that conversation, which is
    what the messaging authorization tests need.
    """
    people = {
        "admin": (ADMIN_EMAIL, ADMIN_PASSWORD),
        "reception": (RECEPTION_EMAIL, RECEPTION_PASSWORD),
        "coach1": ("coach1@gymapp.ir", COACH_PASSWORD),
        "coach2": ("coach2@gymapp.ir", COACH_PASSWORD),
        "athlete1": ("athlete1@gymapp.ir", ATHLETE_PASSWORD),
        "athlete2": ("athlete2@gymapp.ir", ATHLETE_PASSWORD),
    }
    out = {}
    for handle, (email, password) in people.items():
        payload = _login(client, email, password)
        out[handle] = payload
        out[f"{handle}_h"] = _auth(payload)
        out[f"{handle}_id"] = payload["user"]["id"]
    return out
