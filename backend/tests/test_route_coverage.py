"""Cross-cutting coverage test: every API route must have a frontend caller.

This suite's other files check that routes *behave*. This one checks that they
are *reachable from the app at all* — the failure mode that produced deviations
12 and 14 in docs/API_CONTRACT_V2.md, where working endpoints (membership
freeze/unfreeze, notification delete, explicit checkout) shipped with no client
method, no hook and no UI. Nothing failed, because nothing called them.

It reads `apps/web/src/lib/api-client.ts` as text rather than importing it,
which is why this lives in the Python suite: `app.routes` is the authoritative
list of what exists, and only pytest has it.
"""

import re
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
API_CLIENT = REPO_ROOT / "apps" / "web" / "src" / "lib" / "api-client.ts"

#: Served by FastAPI itself, not part of the versioned API. A typed client has
#: no reason to call its own schema or the Swagger UI.
INFRASTRUCTURE = {
    ("GET", "/"),
    ("GET", "/health"),
    ("GET", "/docs"),
    ("GET", "/docs/oauth2-redirect"),
    ("GET", "/redoc"),
    ("GET", "/openapi.json"),
}

#: One handler registered twice, so the operation has a twin the client already
#: calls. Each entry maps the uncovered registration to the covering one — a
#: second verb on the same path, or (for `deduct`) a second path on the same
#: verb. Spelling out the cover is what makes the exemption checkable: a bare
#: "ignore this" list would keep passing after the twin was deleted.
DECORATOR_ALIASES = {
    ("PATCH", "/notifications/{x}/read"): ("POST", "/notifications/{x}/read"),
    ("PATCH", "/notifications/read-all"): ("POST", "/notifications/read-all"),
    ("PATCH", "/goals/{x}/progress"): ("POST", "/goals/{x}/progress"),
    ("PATCH", "/training-programs/{x}/exercises/{x}/complete"): (
        "POST", "/training-programs/{x}/exercises/{x}/complete",
    ),
    ("POST", "/memberships/{x}/deduct"): ("POST", "/memberships/{x}/deduct-session"),
}


def _normalise(path: str) -> str:
    """`/api/v1/users/{user_id}` -> `/users/{x}`, so both sides compare equal."""
    return re.sub(r"\{[^}]+\}", "{x}", path).replace("/api/v1", "")


def _server_operations() -> set[tuple[str, str]]:
    # Imported here, never at module scope. `app.config.Settings()` is built on
    # import, so importing `app.main` at collection time would bind the app to
    # the developer's real database and defaults *before* the `client` fixture
    # sets DATABASE_URL, the seed passwords and LOGIN_RATE_LIMIT — breaking
    # every other module in the suite, not just this one. conftest.py's
    # docstring says the same thing.
    from app.main import app

    # FastAPI now includes lazy router objects in app.routes. OpenAPI expands
    # those routers and reflects the actual registered HTTP surface.
    return {
        (method.upper(), _normalise(path))
        for path, operations in app.openapi()["paths"].items()
        for method in operations
        if method in {"get", "post", "put", "patch", "delete"}
    }


def _client_calls() -> set[tuple[str, str]]:
    """Every `this.client.<verb>(...)` URL in the API client.

    The verb may carry a TypeScript generic — `this.client.get<ApiResponse<X[]>>(`
    — so the gap between verb and paren is matched with `[^(]*`. Matching `[^>]*`
    instead stops at the first `>` and silently misses every nested generic,
    which is most of the file.
    """
    source = API_CLIENT.read_text(encoding="utf-8")
    pattern = r"""this\.client\.(get|post|put|patch|delete)[^(]*\(\s*[`"']([^`"']+)"""
    return {
        (verb.upper(), re.sub(r"\$\{[^}]+\}", "{x}", url))
        for verb, url in re.findall(pattern, source)
    }


@pytest.fixture(scope="module")
def coverage(client) -> tuple[set, set]:
    """Depends on `client` purely for ordering.

    Nothing here sends a request, but requesting the fixture guarantees
    conftest has already set the test environment and imported `app.main`
    under it. Without the dependency this module could be collected first and
    import the app against the wrong settings.
    """
    assert API_CLIENT.is_file(), f"api-client.ts not found at {API_CLIENT}"
    return _server_operations(), _client_calls()


def test_every_api_route_has_a_client_method(coverage):
    server, client = coverage
    unreached = server - client - INFRASTRUCTURE - set(DECORATOR_ALIASES)

    assert not unreached, (
        "These routes exist on the server but nothing in the frontend calls "
        "them, so the capability cannot be used from the app:\n"
        + "\n".join(f"  {m:6} {p}" for m, p in sorted(unreached))
        + "\n\nAdd a method to apps/web/src/lib/api-client.ts (plus a mock and "
        "a hook), or — if the route is a second registration of a handler the "
        "client already calls — add it to DECORATOR_ALIASES in this file."
    )


def test_no_client_method_calls_a_route_that_does_not_exist(coverage):
    """The reverse direction: a typo'd URL is a 404 at runtime, not a type error."""
    server, client = coverage
    bogus = client - server

    assert not bogus, (
        "The API client calls URLs with no matching server route:\n"
        + "\n".join(f"  {m:6} {p}" for m, p in sorted(bogus))
    )


def test_declared_aliases_are_still_aliases(coverage):
    """Guards the exemption list above from going stale.

    An alias is only safe to skip while the twin it points at is genuinely
    still called. If that twin is renamed or dropped, the entry stops being a
    harmless duplicate and becomes a real gap — this catches that rather than
    letting the exemption hide it.
    """
    server, client = coverage
    for alias, cover in DECORATOR_ALIASES.items():
        assert alias in server, (
            f"{alias[0]} {alias[1]} is listed as a decorator alias but no "
            "longer exists on the server — remove it from DECORATOR_ALIASES."
        )
        assert cover in client, (
            f"{alias[0]} {alias[1]} is exempted because the client calls "
            f"{cover[0]} {cover[1]} instead, but that call is gone. The alias "
            "is a real coverage gap now."
        )
