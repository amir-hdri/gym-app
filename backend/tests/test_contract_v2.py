"""Contract v2 suite — messaging, password reset/change, profile, CRUD gaps, analytics.

Covers docs/API_CONTRACT_V2.md sections 1-5: happy paths, authorization
(wrong role -> 403, non-participant -> 403) and validation failures, plus a
full end-to-end password reset driven by the non-production `devToken`.

Fixtures (`client`, `tokens`, `seeded`) come from conftest.py. The app and its
seeded database are shared for the whole run, so tests that mutate state either
create their own throwaway rows or restore what they changed.
"""

from datetime import datetime, timedelta, timezone
from uuid import uuid4

API = "/api/v1"


def _data(response):
    assert response.status_code == 200, f"{response.status_code}: {response.text}"
    return response.json()["data"]


def _iso(days_from_now: int = 0) -> str:
    return (datetime.now(timezone.utc) + timedelta(days=days_from_now)).replace(
        tzinfo=None, microsecond=0
    ).isoformat()


def _register(client, email: str, password: str = "secret12") -> dict:
    r = client.post(
        f"{API}/auth/register",
        json={
            "email": email,
            "password": password,
            "firstName": "Temp",
            "lastName": "User",
            "phone": "",
        },
    )
    assert r.status_code == 200, r.text
    return r.json()["data"]


def _conversation_of(client, headers, athlete_id: str, coach_id: str) -> dict:
    """The conversation between exactly this athlete and coach.

    Keyed on both ids on purpose: an athlete can hold several threads and the
    list is ordered by recency, so indexing blindly is order-dependent.
    """
    convs = _data(client.get(f"{API}/messages/conversations", headers=headers))
    match = [
        c for c in convs if c["athleteId"] == athlete_id and c["coachId"] == coach_id
    ]
    assert match, f"no conversation between athlete {athlete_id} and coach {coach_id}"
    return match[0]


# ======================================================== 1. Messaging


def test_seed_provides_conversations(client, seeded):
    convs = _data(client.get(f"{API}/messages/conversations", headers=seeded["admin_h"]))
    assert len(convs) >= 5, f"seed produced too few conversations: {len(convs)}"
    assert any(c["lastMessage"] is not None for c in convs)
    assert any(c["unreadCount"] > 0 for c in convs), "no unread messages in the seed"


def test_conversation_response_shape(client, seeded):
    conv = _conversation_of(
        client, seeded["athlete1_h"], seeded["athlete1_id"], seeded["coach1_id"]
    )
    assert set(conv) == {
        "id",
        "athleteId",
        "coachId",
        "participant",
        "lastMessage",
        "unreadCount",
        "lastMessageAt",
        "createdAt",
    }
    assert set(conv["participant"]) == {"id", "firstName", "lastName", "role", "avatarUrl"}
    assert set(conv["lastMessage"]) == {"id", "body", "senderId", "createdAt"}
    # For an athlete, `participant` is the coach on the other side.
    assert conv["participant"]["id"] == conv["coachId"]
    assert conv["participant"]["role"] == "coach"
    assert isinstance(conv["unreadCount"], int)


def test_conversation_participant_is_other_party_for_coach(client, seeded):
    convs = _data(client.get(f"{API}/messages/conversations", headers=seeded["coach1_h"]))
    assert convs, "coach1 should see seeded conversations"
    for conv in convs:
        assert conv["participant"]["id"] == conv["athleteId"]
        assert conv["participant"]["role"] == "athlete"


def test_conversation_participant_is_athlete_for_admin(client, seeded):
    convs = _data(client.get(f"{API}/messages/conversations", headers=seeded["admin_h"]))
    for conv in convs:
        assert conv["participant"]["id"] == conv["athleteId"]


def test_message_response_shape_and_ascending(client, seeded):
    conv = _conversation_of(
        client, seeded["athlete1_h"], seeded["athlete1_id"], seeded["coach1_id"]
    )
    msgs = _data(
        client.get(f"{API}/messages/conversations/{conv['id']}/messages",
                   headers=seeded["athlete1_h"])
    )
    assert msgs, "seeded conversation has no messages"
    assert set(msgs[0]) == {"id", "conversationId", "senderId", "body", "readAt", "createdAt"}
    created = [m["createdAt"] for m in msgs]
    assert created == sorted(created), "messages must be ascending by createdAt"


def test_create_conversation_is_idempotent(client, seeded):
    body = {"participantId": seeded["coach2_id"]}
    first = _data(client.post(f"{API}/messages/conversations",
                              headers=seeded["athlete2_h"], json=body))
    second = _data(client.post(f"{API}/messages/conversations",
                               headers=seeded["athlete2_h"], json=body))
    assert first["id"] == second["id"]
    assert first["athleteId"] == seeded["athlete2_id"]
    assert first["coachId"] == seeded["coach2_id"]


def test_create_conversation_from_coach_side(client, seeded):
    conv = _data(
        client.post(f"{API}/messages/conversations", headers=seeded["coach2_h"],
                    json={"participantId": seeded["athlete1_id"]})
    )
    assert conv["athleteId"] == seeded["athlete1_id"]
    assert conv["coachId"] == seeded["coach2_id"]


def test_create_conversation_rejects_self(client, seeded):
    r = client.post(f"{API}/messages/conversations", headers=seeded["athlete1_h"],
                    json={"participantId": seeded["athlete1_id"]})
    assert r.status_code == 400, r.text


def test_create_conversation_rejects_unknown_participant(client, seeded):
    r = client.post(f"{API}/messages/conversations", headers=seeded["athlete1_h"],
                    json={"participantId": "does-not-exist"})
    assert r.status_code == 404, r.text


def test_create_conversation_rejects_two_athletes(client, seeded):
    r = client.post(f"{API}/messages/conversations", headers=seeded["athlete1_h"],
                    json={"participantId": seeded["athlete2_id"]})
    assert r.status_code == 400, r.text


def test_create_conversation_requires_participant_id(client, seeded):
    assert client.post(f"{API}/messages/conversations",
                       headers=seeded["athlete1_h"], json={}).status_code == 422


def test_non_participant_cannot_touch_conversation(client, seeded):
    conv = _conversation_of(
        client, seeded["athlete1_h"], seeded["athlete1_id"], seeded["coach1_id"]
    )
    cid = conv["id"]
    outsider = seeded["athlete2_h"]
    assert client.get(f"{API}/messages/conversations/{cid}",
                      headers=outsider).status_code == 403
    assert client.get(f"{API}/messages/conversations/{cid}/messages",
                      headers=outsider).status_code == 403
    assert client.post(f"{API}/messages/conversations/{cid}/messages",
                       headers=outsider, json={"body": "intrusion"}).status_code == 403
    assert client.post(f"{API}/messages/conversations/{cid}/read",
                       headers=outsider).status_code == 403


def test_non_participant_coach_cannot_read_conversation(client, seeded):
    """coach1 owns athlete1's thread, so coach2 must be shut out of it."""
    conv = _conversation_of(
        client, seeded["athlete1_h"], seeded["athlete1_id"], seeded["coach1_id"]
    )
    assert conv["coachId"] == seeded["coach1_id"]
    r = client.get(f"{API}/messages/conversations/{conv['id']}", headers=seeded["coach2_h"])
    assert r.status_code == 403, r.text


def test_admin_can_read_any_conversation(client, seeded):
    conv = _conversation_of(
        client, seeded["athlete1_h"], seeded["athlete1_id"], seeded["coach1_id"]
    )
    assert _data(client.get(f"{API}/messages/conversations/{conv['id']}",
                            headers=seeded["admin_h"]))["id"] == conv["id"]


def test_conversation_not_found(client, seeded):
    assert client.get(f"{API}/messages/conversations/nope",
                      headers=seeded["admin_h"]).status_code == 404


def test_send_message_then_read_and_unread_count(client, seeded):
    conv = _conversation_of(
        client, seeded["athlete1_h"], seeded["athlete1_id"], seeded["coach1_id"]
    )
    cid = conv["id"]

    # Clear the slate so the delta we measure is only ours.
    _data(client.post(f"{API}/messages/conversations/{cid}/read", headers=seeded["athlete1_h"]))
    before = _data(client.get(f"{API}/messages/unread-count", headers=seeded["athlete1_h"]))
    assert set(before) == {"count"} and isinstance(before["count"], int)

    sent = _data(
        client.post(f"{API}/messages/conversations/{cid}/messages",
                    headers=seeded["coach1_h"], json={"body": "  ping from coach  "})
    )
    assert sent["body"] == "ping from coach", "body should be stripped"
    assert sent["senderId"] == seeded["coach1_id"]
    assert sent["conversationId"] == cid
    assert sent["readAt"] is None

    after = _data(client.get(f"{API}/messages/unread-count", headers=seeded["athlete1_h"]))
    assert after["count"] == before["count"] + 1

    # The sender's own message must not count as unread for the sender.
    conv_for_coach = _data(client.get(f"{API}/messages/conversations/{cid}",
                                      headers=seeded["coach1_h"]))
    assert conv_for_coach["lastMessage"]["id"] == sent["id"]

    marked = _data(client.post(f"{API}/messages/conversations/{cid}/read",
                               headers=seeded["athlete1_h"]))
    assert set(marked) == {"updated"} and marked["updated"] >= 1
    final = _data(client.get(f"{API}/messages/unread-count", headers=seeded["athlete1_h"]))
    assert final["count"] == before["count"]


def test_send_message_bumps_last_message_at(client, seeded):
    conv = _conversation_of(
        client, seeded["athlete1_h"], seeded["athlete1_id"], seeded["coach1_id"]
    )
    before = conv["lastMessageAt"]
    _data(client.post(f"{API}/messages/conversations/{conv['id']}/messages",
                      headers=seeded["athlete1_h"], json={"body": "bump"}))
    after = _data(client.get(f"{API}/messages/conversations/{conv['id']}",
                             headers=seeded["athlete1_h"]))
    assert after["lastMessageAt"] > before


def test_send_message_validation(client, seeded):
    conv = _conversation_of(
        client, seeded["athlete1_h"], seeded["athlete1_id"], seeded["coach1_id"]
    )
    cid = conv["id"]
    h = seeded["athlete1_h"]
    assert client.post(f"{API}/messages/conversations/{cid}/messages",
                       headers=h, json={"body": ""}).status_code == 422
    assert client.post(f"{API}/messages/conversations/{cid}/messages",
                       headers=h, json={"body": "x" * 2001}).status_code == 422
    assert client.post(f"{API}/messages/conversations/{cid}/messages",
                       headers=h, json={}).status_code == 422
    # Whitespace-only survives min_length but is rejected by the handler.
    assert client.post(f"{API}/messages/conversations/{cid}/messages",
                       headers=h, json={"body": "   "}).status_code == 400


def test_messages_require_auth(client, seeded):
    assert client.get(f"{API}/messages/conversations").status_code in (401, 403)
    assert client.get(f"{API}/messages/unread-count").status_code in (401, 403)


def test_conversation_lists_are_paginated(client, seeded):
    """The contract says both list endpoints carry the paginated envelope."""
    r = client.get(f"{API}/messages/conversations", headers=seeded["admin_h"],
                   params={"page": 1, "page_size": 2})
    assert r.status_code == 200
    body = r.json()
    assert set(body["meta"]) == {"page", "pageSize", "total", "totalPages"}
    assert body["meta"]["pageSize"] == 2 and body["meta"]["total"] >= 5
    assert len(body["data"]) == 2

    conv = _conversation_of(
        client, seeded["athlete1_h"], seeded["athlete1_id"], seeded["coach1_id"]
    )
    r2 = client.get(f"{API}/messages/conversations/{conv['id']}/messages",
                    headers=seeded["athlete1_h"], params={"page": 1, "page_size": 2})
    assert r2.status_code == 200
    assert set(r2.json()["meta"]) == {"page", "pageSize", "total", "totalPages"}
    assert len(r2.json()["data"]) == 2


def test_receptionist_sees_no_conversations(client, seeded):
    """A receptionist is nobody's participant: an empty list, not an error."""
    r = client.get(f"{API}/messages/conversations", headers=seeded["reception_h"])
    assert r.status_code == 200
    assert r.json()["data"] == []
    assert _data(client.get(f"{API}/messages/unread-count",
                            headers=seeded["reception_h"]))["count"] == 0


# ============================================ 2. Password reset / change


def test_register_rejects_weak_password(client):
    for weak in ("short1", "alphabetsonly", "12345678"):
        r = client.post(f"{API}/auth/register", json={
            "email": f"weak-{weak}@x.ir", "password": weak,
            "firstName": "A", "lastName": "B"})
        assert r.status_code == 422, f"{weak!r} should be rejected: {r.text}"


def test_forgot_password_unknown_email_still_200(client):
    r = client.post(f"{API}/auth/forgot-password", json={"email": "ghost@nowhere.ir"})
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["sent"] is True
    assert "devToken" not in data, "must not mint a token for an unknown address"


def test_forgot_password_validates_email(client):
    assert client.post(f"{API}/auth/forgot-password",
                       json={"email": "not-an-email"}).status_code == 422


def test_password_reset_end_to_end(client):
    """Full flow over the non-production devToken: request, reset, re-login."""
    email = "reset-e2e@x.ir"
    _register(client, email, "oldpass1")

    issued = _data(client.post(f"{API}/auth/forgot-password", json={"email": email}))
    assert issued["sent"] is True
    token = issued["devToken"]
    assert isinstance(token, str) and len(token) > 20

    confirmed = _data(client.post(f"{API}/auth/reset-password",
                                  json={"token": token, "password": "newpass1"}))
    assert confirmed == {"reset": True}

    assert client.post(f"{API}/auth/login",
                       json={"email": email, "password": "oldpass1"}).status_code == 401
    assert client.post(f"{API}/auth/login",
                       json={"email": email, "password": "newpass1"}).status_code == 200


def test_reset_token_is_single_use(client):
    email = "reset-single@x.ir"
    _register(client, email, "oldpass1")
    token = _data(client.post(f"{API}/auth/forgot-password", json={"email": email}))["devToken"]
    assert client.post(f"{API}/auth/reset-password",
                       json={"token": token, "password": "newpass1"}).status_code == 200
    r = client.post(f"{API}/auth/reset-password",
                    json={"token": token, "password": "thirdpass1"})
    assert r.status_code == 400, r.text
    # The second attempt must not have changed anything.
    assert client.post(f"{API}/auth/login",
                       json={"email": email, "password": "newpass1"}).status_code == 200


def test_new_reset_request_invalidates_outstanding_token(client):
    email = "reset-rotate@x.ir"
    _register(client, email, "oldpass1")
    first = _data(client.post(f"{API}/auth/forgot-password", json={"email": email}))["devToken"]
    second = _data(client.post(f"{API}/auth/forgot-password", json={"email": email}))["devToken"]
    assert first != second

    assert client.post(f"{API}/auth/reset-password",
                       json={"token": first, "password": "newpass1"}).status_code == 400
    assert client.post(f"{API}/auth/reset-password",
                       json={"token": second, "password": "newpass2"}).status_code == 200


def test_reset_password_rejects_bad_input(client):
    assert client.post(f"{API}/auth/reset-password",
                       json={"token": "garbage", "password": "newpass1"}).status_code == 400
    assert client.post(f"{API}/auth/reset-password",
                       json={"token": "", "password": "newpass1"}).status_code == 422
    assert client.post(f"{API}/auth/reset-password",
                       json={"token": "garbage", "password": "weak"}).status_code == 422
    assert client.post(f"{API}/auth/reset-password",
                       json={"token": "garbage", "password": "alphabetsonly"}).status_code == 422
    assert client.post(f"{API}/auth/reset-password", json={"token": "x"}).status_code == 422


def test_reset_token_stored_hashed_only(client):
    """The raw token must never be persisted."""
    from app.database import SessionLocal
    from app.models import PasswordResetToken

    email = "reset-hash@x.ir"
    _register(client, email, "oldpass1")
    token = _data(client.post(f"{API}/auth/forgot-password", json={"email": email}))["devToken"]
    db = SessionLocal()
    try:
        stored = {row.token_hash for row in db.query(PasswordResetToken).all()}
    finally:
        db.close()
    assert token not in stored
    import hashlib
    assert hashlib.sha256(token.encode()).hexdigest() in stored


def test_change_password_flow(client):
    email = "change-pw@x.ir"
    reg = _register(client, email, "oldpass1")
    headers = {"Authorization": f"Bearer {reg['tokens']['accessToken']}"}

    wrong = client.post(f"{API}/auth/change-password", headers=headers,
                        json={"currentPassword": "notitatall1", "newPassword": "newpass1"})
    assert wrong.status_code == 400, wrong.text

    ok = _data(client.post(f"{API}/auth/change-password", headers=headers,
                           json={"currentPassword": "oldpass1", "newPassword": "newpass1"}))
    assert ok == {"changed": True}
    assert client.post(f"{API}/auth/login",
                       json={"email": email, "password": "newpass1"}).status_code == 200
    assert client.post(f"{API}/auth/login",
                       json={"email": email, "password": "oldpass1"}).status_code == 401


def test_change_password_enforces_policy(client):
    email = "change-pw-weak@x.ir"
    reg = _register(client, email, "oldpass1")
    headers = {"Authorization": f"Bearer {reg['tokens']['accessToken']}"}
    for weak in ("short1", "alphabetsonly", "12345678"):
        r = client.post(f"{API}/auth/change-password", headers=headers,
                        json={"currentPassword": "oldpass1", "newPassword": weak})
        assert r.status_code == 422, f"{weak!r} should be rejected: {r.text}"


def test_change_password_requires_auth(client):
    r = client.post(f"{API}/auth/change-password",
                    json={"currentPassword": "oldpass1", "newPassword": "newpass1"})
    assert r.status_code in (401, 403)


# ================================================== 3. Profile update


def test_update_profile(client):
    email = "profile-edit@x.ir"
    reg = _register(client, email)
    headers = {"Authorization": f"Bearer {reg['tokens']['accessToken']}"}
    user = _data(client.put(f"{API}/auth/profile", headers=headers, json={
        "firstName": "Edited",
        "lastName": "Name",
        "phone": "09120000000",
        "avatarUrl": "https://cdn.example.com/a.png",
    }))
    assert user["firstName"] == "Edited"
    assert user["lastName"] == "Name"
    assert user["phone"] == "09120000000"
    assert user["avatarUrl"] == "https://cdn.example.com/a.png"
    assert user["email"] == email


def test_update_profile_is_partial(client):
    email = "profile-partial@x.ir"
    reg = _register(client, email)
    headers = {"Authorization": f"Bearer {reg['tokens']['accessToken']}"}
    user = _data(client.put(f"{API}/auth/profile", headers=headers, json={"phone": "0912111"}))
    assert user["phone"] == "0912111"
    assert user["firstName"] == "Temp", "untouched fields must survive"


def test_update_profile_cannot_escalate(client):
    email = "profile-escalate@x.ir"
    reg = _register(client, email)
    headers = {"Authorization": f"Bearer {reg['tokens']['accessToken']}"}
    user = _data(client.put(f"{API}/auth/profile", headers=headers,
                            json={"firstName": "X", "role": "admin", "status": "suspended"}))
    assert user["role"] == "athlete"
    assert user["status"] == "active"


def test_update_profile_validation_and_auth(client):
    email = "profile-invalid@x.ir"
    reg = _register(client, email)
    headers = {"Authorization": f"Bearer {reg['tokens']['accessToken']}"}
    assert client.put(f"{API}/auth/profile", headers=headers,
                      json={"firstName": ""}).status_code == 422
    assert client.put(f"{API}/auth/profile", json={"firstName": "X"}).status_code in (401, 403)


# ====================================================== 4. CRUD gaps


def test_exercise_update_and_delete(client, tokens):
    created = _data(client.post(f"{API}/exercises", headers=tokens["ADH"],
                                json={"name": "تست", "nameEn": "Temp Test Lift",
                                      "muscleGroup": "chest"}))
    updated = _data(client.put(f"{API}/exercises/{created['id']}", headers=tokens["ADH"],
                               json={"difficulty": "advanced"}))
    assert updated["difficulty"] == "advanced"
    assert client.delete(f"{API}/exercises/{created['id']}",
                         headers=tokens["ADH"]).status_code == 200
    assert client.get(f"{API}/exercises/{created['id']}",
                      headers=tokens["ADH"]).status_code == 404


def test_exercise_delete_conflicts_when_referenced(client, tokens):
    """A seeded exercise is used by seeded programs, so deletion must 409."""
    exercises = _data(client.get(f"{API}/exercises", headers=tokens["ADH"]))
    programs = _data(client.get(f"{API}/training-programs", headers=tokens["ADH"]))
    used_ids = {pe["exerciseId"] for p in programs for pe in p["exercises"]}
    target = next(e for e in exercises if e["id"] in used_ids)
    r = client.delete(f"{API}/exercises/{target['id']}", headers=tokens["ADH"])
    assert r.status_code == 409, r.text
    # Still there.
    assert client.get(f"{API}/exercises/{target['id']}",
                      headers=tokens["ADH"]).status_code == 200


def test_exercise_delete_role_gate(client, tokens):
    exercises = _data(client.get(f"{API}/exercises", headers=tokens["ADH"]))
    assert client.delete(f"{API}/exercises/{exercises[0]['id']}",
                         headers=tokens["AH"]).status_code == 403
    assert client.delete(f"{API}/exercises/missing-id",
                         headers=tokens["ADH"]).status_code == 404


def test_goal_update_and_delete(client, tokens, seeded):
    goal = _data(client.post(f"{API}/goals", headers=tokens["ADH"], json={
        "athleteId": seeded["athlete1_id"],
        "coachId": seeded["coach1_id"],
        "title": "Temp goal",
        "targetValue": 50,
        "startDate": _iso(-1),
        "targetDate": _iso(30),
    }))
    updated = _data(client.put(f"{API}/goals/{goal['id']}", headers=tokens["ADH"],
                               json={"title": "Temp goal v2", "currentValue": 25}))
    assert updated["title"] == "Temp goal v2" and updated["currentValue"] == 25
    assert client.delete(f"{API}/goals/{goal['id']}", headers=tokens["ADH"]).status_code == 200
    assert client.get(f"{API}/goals/{goal['id']}", headers=tokens["ADH"]).status_code == 404


def test_goal_delete_rejects_unrelated_athlete(client, tokens, seeded):
    goal = _data(client.post(f"{API}/goals", headers=tokens["ADH"], json={
        "athleteId": seeded["athlete1_id"],
        "title": "Guarded goal",
        "targetValue": 10,
        "startDate": _iso(-1),
        "targetDate": _iso(30),
    }))
    # `tokens["AH"]` is an unrelated self-registered athlete.
    assert client.delete(f"{API}/goals/{goal['id']}",
                         headers=tokens["AH"]).status_code == 403
    # The owner may remove their own goal.
    assert client.delete(f"{API}/goals/{goal['id']}",
                         headers=seeded["athlete1_h"]).status_code == 200


def test_goal_delete_not_found(client, tokens):
    assert client.delete(f"{API}/goals/missing-id", headers=tokens["ADH"]).status_code == 404


def test_branch_create_update_delete(client, tokens):
    created = _data(client.post(f"{API}/branches", headers=tokens["ADH"],
                                json={"name": "Temp Branch", "address": "nowhere"}))
    updated = _data(client.put(f"{API}/branches/{created['id']}", headers=tokens["ADH"],
                               json={"name": "Temp Branch v2"}))
    assert updated["name"] == "Temp Branch v2"
    assert client.delete(f"{API}/branches/{created['id']}",
                         headers=tokens["ADH"]).status_code == 200
    assert client.get(f"{API}/branches/{created['id']}",
                      headers=tokens["ADH"]).status_code == 404


def test_branch_delete_conflicts_when_populated(client, tokens, seeded):
    athlete = _data(client.get(f"{API}/users/{seeded['athlete1_id']}", headers=tokens["ADH"]))
    r = client.delete(f"{API}/branches/{athlete['branchId']}", headers=tokens["ADH"])
    assert r.status_code == 409, r.text
    assert client.get(f"{API}/branches/{athlete['branchId']}",
                      headers=tokens["ADH"]).status_code == 200


def test_branch_write_is_admin_only(client, tokens):
    assert client.post(f"{API}/branches", headers=tokens["COH"],
                       json={"name": "Nope"}).status_code == 403
    assert client.delete(f"{API}/branches/anything", headers=tokens["AH"]).status_code == 403
    assert client.delete(f"{API}/branches/missing-id", headers=tokens["ADH"]).status_code == 404


def test_membership_plan_hard_delete_when_unreferenced(client, tokens):
    plan = _data(client.post(f"{API}/membership-plans", headers=tokens["ADH"],
                             json={"name": "Temp Plan Hard", "durationDays": 30, "price": 100}))
    assert client.delete(f"{API}/membership-plans/{plan['id']}",
                         headers=tokens["ADH"]).status_code == 200
    assert client.get(f"{API}/membership-plans/{plan['id']}",
                      headers=tokens["ADH"]).status_code == 404


def test_membership_plan_soft_delete_when_referenced(client, tokens, seeded):
    plan = _data(client.post(f"{API}/membership-plans", headers=tokens["ADH"],
                             json={"name": "Temp Plan Soft", "durationDays": 30,
                                   "sessionsCount": 5, "price": 100}))
    athlete = _data(client.get(f"{API}/users/{seeded['athlete2_id']}", headers=tokens["ADH"]))
    _data(client.post(f"{API}/memberships", headers=tokens["ADH"], json={
        "userId": seeded["athlete2_id"],
        "planId": plan["id"],
        "branchId": athlete["branchId"],
        "startDate": _iso(-1),
        "endDate": _iso(29),
        "sessionsTotal": 5,
        "price": 100,
        "finalPrice": 100,
    }))
    assert client.delete(f"{API}/membership-plans/{plan['id']}",
                         headers=tokens["ADH"]).status_code == 200
    # Soft-deleted: still readable, flagged inactive.
    after = _data(client.get(f"{API}/membership-plans/{plan['id']}", headers=tokens["ADH"]))
    assert after["isActive"] is False


def test_membership_plan_delete_role_gate(client, tokens):
    assert client.delete(f"{API}/membership-plans/anything",
                         headers=tokens["COH"]).status_code == 403
    assert client.delete(f"{API}/membership-plans/missing-id",
                         headers=tokens["ADH"]).status_code == 404


def test_notification_create(client, tokens, seeded):
    created = _data(client.post(f"{API}/notifications", headers=tokens["ADH"], json={
        "userId": seeded["athlete1_id"], "title": "Hello", "message": "Body", "type": "info"}))
    assert created["title"] == "Hello" and created["isRead"] is False


def test_notification_create_role_gate_and_404(client, tokens, seeded):
    body = {"userId": seeded["athlete1_id"], "title": "T", "message": "M"}
    assert client.post(f"{API}/notifications", headers=tokens["AH"],
                       json=body).status_code == 403
    assert client.post(f"{API}/notifications", headers=tokens["COH"],
                       json=body).status_code == 403
    assert client.post(f"{API}/notifications", headers=tokens["ADH"],
                       json={"userId": "ghost", "title": "T", "message": "M"}).status_code == 404
    assert client.post(f"{API}/notifications", headers=tokens["ADH"],
                       json={"userId": seeded["athlete1_id"]}).status_code == 422


def test_notification_broadcast(client, tokens, seeded):
    coaches = _data(client.get(f"{API}/users", headers=tokens["ADH"],
                               params={"role": "coach", "page_size": 100}))
    result = _data(client.post(f"{API}/notifications/broadcast", headers=tokens["ADH"], json={
        "title": "Broadcast", "message": "To all coaches", "type": "warning", "role": "coach"}))
    assert set(result) == {"sent"}
    assert result["sent"] == len(coaches), f"sent={result['sent']} coaches={len(coaches)}"

    received = _data(client.get(f"{API}/notifications", headers=seeded["coach1_h"],
                                params={"page_size": 100}))
    assert any(n["title"] == "Broadcast" for n in received)

    # Untargeted role must not receive it.
    athlete_inbox = _data(client.get(f"{API}/notifications", headers=seeded["athlete1_h"],
                                     params={"page_size": 100}))
    assert not any(n["title"] == "Broadcast" for n in athlete_inbox)


def test_notification_broadcast_everyone(client, tokens):
    result = _data(client.post(f"{API}/notifications/broadcast", headers=tokens["ADH"],
                               json={"title": "All", "message": "Everyone"}))
    assert result["sent"] >= 13, f"sent={result['sent']}"


def test_notification_broadcast_validation_and_role_gate(client, tokens):
    assert client.post(f"{API}/notifications/broadcast", headers=tokens["ADH"],
                       json={"title": "T", "message": "M",
                             "role": "wizard"}).status_code == 400
    assert client.post(f"{API}/notifications/broadcast", headers=tokens["ADH"],
                       json={"title": "", "message": "M"}).status_code == 422
    assert client.post(f"{API}/notifications/broadcast", headers=tokens["ADH"],
                       json={"message": "M"}).status_code == 422
    assert client.post(f"{API}/notifications/broadcast", headers=tokens["AH"],
                       json={"title": "T", "message": "M"}).status_code == 403
    assert client.post(f"{API}/notifications/broadcast", headers=tokens["COH"],
                       json={"title": "T", "message": "M"}).status_code == 403


def test_deduct_session_both_paths(client, tokens, seeded):
    memberships = _data(client.get(f"{API}/memberships", headers=tokens["ADH"],
                                   params={"user_id": seeded["athlete1_id"]}))
    membership = next(m for m in memberships if m["status"] == "active")
    start = membership["sessionsUsed"]

    first = _data(client.post(f"{API}/memberships/{membership['id']}/deduct-session",
                              headers=tokens["ADH"]))
    assert first["sessionsUsed"] == start + 1
    assert first["sessionsRemaining"] == first["sessionsTotal"] - first["sessionsUsed"]

    # Legacy alias must hit the same handler.
    second = _data(client.post(f"{API}/memberships/{membership['id']}/deduct",
                               headers=tokens["ADH"]))
    assert second["sessionsUsed"] == start + 2


def test_deduct_session_role_gate_and_404(client, tokens):
    assert client.post(f"{API}/memberships/anything/deduct-session",
                       headers=tokens["AH"]).status_code == 403
    assert client.post(f"{API}/memberships/missing-id/deduct-session",
                       headers=tokens["ADH"]).status_code == 404


def test_payment_update(client, tokens, seeded):
    payment = _data(client.post(f"{API}/payments", headers=tokens["ADH"],
                                json={"userId": seeded["athlete1_id"], "amount": 1234}))
    assert payment["status"] == "pending" and payment["paidAt"] is None

    updated = _data(client.put(f"{API}/payments/{payment['id']}", headers=tokens["ADH"], json={
        "status": "completed", "method": "online", "notes": "settled at the desk"}))
    assert updated["status"] == "completed"
    assert updated["method"] == "online"
    assert updated["description"] == "settled at the desk"
    assert updated["paidAt"] is not None

    # Partial update leaves the rest alone.
    again = _data(client.put(f"{API}/payments/{payment['id']}", headers=tokens["ADH"],
                             json={"status": "refunded"}))
    assert again["status"] == "refunded" and again["method"] == "online"


def test_payment_update_validation_and_role_gate(client, tokens, seeded):
    payment = _data(client.post(f"{API}/payments", headers=tokens["ADH"],
                                json={"userId": seeded["athlete1_id"], "amount": 10}))
    # "cancelled" is a legal terminal status on both PUT and PATCH (single
    # vocabulary); only unknown statuses are rejected.
    cancelled = client.put(f"{API}/payments/{payment['id']}", headers=tokens["ADH"],
                           json={"status": "cancelled"})
    assert cancelled.status_code == 200
    assert cancelled.json()["data"]["status"] == "cancelled"
    assert cancelled.json()["data"]["paidAt"] is None
    assert client.put(f"{API}/payments/{payment['id']}", headers=tokens["ADH"],
                      json={"status": "bogus"}).status_code == 422
    assert client.put(f"{API}/payments/{payment['id']}", headers=tokens["AH"],
                      json={"status": "completed"}).status_code == 403
    assert client.put(f"{API}/payments/{payment['id']}", headers=tokens["COH"],
                      json={"status": "completed"}).status_code == 403
    assert client.put(f"{API}/payments/missing-id", headers=tokens["ADH"],
                      json={"status": "completed"}).status_code == 404


def test_payment_status_patch_still_works(client, tokens, seeded):
    """Regression: the legacy PATCH handler must still resolve its path param."""
    payment = _data(client.post(f"{API}/payments", headers=tokens["ADH"],
                                json={"userId": seeded["athlete1_id"], "amount": 77}))
    updated = _data(client.patch(f"{API}/payments/{payment['id']}/status",
                                 headers=tokens["ADH"], json={"status": "completed"}))
    assert updated["status"] == "completed" and updated["paidAt"] is not None


def _throwaway_user(client, tokens, email: str, password: str = "initial123") -> dict:
    """An admin-created account the caller may freely mutate.

    Every test in this suite shares one session-scoped database and the
    ``seeded`` fixture logs the demo accounts in once up front, so changing a
    seeded user's password or status would break unrelated tests later in the
    run. These accounts belong to a single test.
    """
    return _data(client.post(f"{API}/users", headers=tokens["ADH"], json={
        "email": email, "password": password,
        "firstName": "Throw", "lastName": "Away", "role": "athlete"}))


def test_user_status_patch(client, tokens):
    user = _throwaway_user(client, tokens, "status-probe@x.ir")
    assert user["status"] == "active"

    for status in ("inactive", "suspended", "pending", "active"):
        updated = _data(client.patch(f"{API}/users/{user['id']}/status",
                                     headers=tokens["ADH"], json={"status": status}))
        assert updated["status"] == status


def test_user_status_patch_validation_and_role_gate(client, tokens):
    user = _throwaway_user(client, tokens, "status-gate@x.ir")

    # The whole point of the dedicated endpoint: an unknown status is refused
    # rather than written through, which `PUT /users/{id}` would do.
    assert client.patch(f"{API}/users/{user['id']}/status", headers=tokens["ADH"],
                        json={"status": "bogus"}).status_code == 400
    # `pending_verification` was declared by the web client's `UserStatus` for a
    # while and is *not* what the server accepts.
    assert client.patch(f"{API}/users/{user['id']}/status", headers=tokens["ADH"],
                        json={"status": "pending_verification"}).status_code == 400
    assert client.patch(f"{API}/users/{user['id']}/status", headers=tokens["AH"],
                        json={"status": "inactive"}).status_code == 403
    assert client.patch(f"{API}/users/{user['id']}/status", headers=tokens["COH"],
                        json={"status": "inactive"}).status_code == 403
    assert client.patch(f"{API}/users/missing-id/status", headers=tokens["ADH"],
                        json={"status": "inactive"}).status_code == 404


def test_admin_sets_password_without_the_current_one(client, tokens):
    """An admin has no way to know the user's current password.

    `PasswordSetRequest` therefore makes `currentPassword` optional, and the
    handler — not the schema — is what enforces it for self-service. With the
    field required this request died at validation with a 422 and the admin
    reset was unreachable.
    """
    user = _throwaway_user(client, tokens, "pw-admin@x.ir")

    r = client.post(f"{API}/users/{user['id']}/password", headers=tokens["ADH"],
                    json={"newPassword": "rotated123"})
    assert r.status_code == 200, r.text

    assert client.post(f"{API}/auth/login", json={
        "email": "pw-admin@x.ir", "password": "rotated123"}).status_code == 200
    assert client.post(f"{API}/auth/login", json={
        "email": "pw-admin@x.ir", "password": "initial123"}).status_code == 401


def test_self_service_password_still_needs_the_current_one(client, tokens):
    user = _throwaway_user(client, tokens, "pw-self@x.ir")
    own = client.post(f"{API}/auth/login", json={
        "email": "pw-self@x.ir", "password": "initial123"}).json()["data"]
    own_h = {"Authorization": f"Bearer {own['tokens']['accessToken']}"}

    # Omitting it must not be mistaken for the admin path.
    assert client.post(f"{API}/users/{user['id']}/password", headers=own_h,
                       json={"newPassword": "rotated123"}).status_code == 401
    assert client.post(f"{API}/users/{user['id']}/password", headers=own_h,
                       json={"currentPassword": "wrong123", "newPassword": "rotated123"}).status_code == 401

    r = client.post(f"{API}/users/{user['id']}/password", headers=own_h,
                    json={"currentPassword": "initial123", "newPassword": "rotated123"})
    assert r.status_code == 200, r.text
    assert client.post(f"{API}/auth/login", json={
        "email": "pw-self@x.ir", "password": "rotated123"}).status_code == 200


def test_password_set_enforces_the_policy_and_ownership(client, tokens):
    user = _throwaway_user(client, tokens, "pw-policy@x.ir")

    # Too short, and letters-only — both rejected before anything is written.
    assert client.post(f"{API}/users/{user['id']}/password", headers=tokens["ADH"],
                       json={"newPassword": "short1"}).status_code == 422
    assert client.post(f"{API}/users/{user['id']}/password", headers=tokens["ADH"],
                       json={"newPassword": "nodigitshere"}).status_code == 422
    # A non-admin may only set their own.
    assert client.post(f"{API}/users/{user['id']}/password", headers=tokens["COH"],
                       json={"newPassword": "rotated123"}).status_code == 403
    assert client.post(f"{API}/users/missing-id/password", headers=tokens["ADH"],
                       json={"newPassword": "rotated123"}).status_code == 404
    # The failed attempts left the original password in place.
    assert client.post(f"{API}/auth/login", json={
        "email": "pw-policy@x.ir", "password": "initial123"}).status_code == 200


def test_program_exercise_add_update_remove(client, tokens, seeded):
    """The coach program builder's three writes, end to end."""
    program = _data(client.post(f"{API}/training-programs", headers=seeded["coach1_h"], json={
        "athleteId": seeded["athlete1_id"], "coachId": seeded["coach1_id"],
        "name": "برنامه آزمایشی",
        "startDate": "2026-01-01", "endDate": "2026-02-01"}))
    exercise = _data(client.get(f"{API}/exercises", headers=seeded["coach1_h"]))[0]

    added = _data(client.post(f"{API}/training-programs/{program['id']}/exercises",
                              headers=seeded["coach1_h"], json={
                                  "exerciseId": exercise["id"], "dayOfWeek": 1,
                                  "sets": 4, "reps": "12", "restSeconds": 90}))
    assert added["sets"] == 4 and added["reps"] == "12" and added["restSeconds"] == 90
    assert added["programId"] == program["id"]

    updated = _data(client.put(
        f"{API}/training-programs/{program['id']}/exercises/{added['id']}",
        headers=seeded["coach1_h"], json={"sets": 5, "notes": "سنگین‌تر"}))
    # A partial update must not reset the fields it does not mention.
    assert updated["sets"] == 5 and updated["notes"] == "سنگین‌تر"
    assert updated["reps"] == "12" and updated["restSeconds"] == 90

    assert client.delete(
        f"{API}/training-programs/{program['id']}/exercises/{added['id']}",
        headers=seeded["coach1_h"]).status_code == 200
    after = _data(client.get(f"{API}/training-programs/{program['id']}", headers=seeded["coach1_h"]))
    assert all(e["id"] != added["id"] for e in after["exercises"])


def test_program_exercise_writes_respect_ownership(client, tokens, seeded):
    program = _data(client.post(f"{API}/training-programs", headers=seeded["coach1_h"], json={
        "athleteId": seeded["athlete1_id"], "coachId": seeded["coach1_id"], "name": "مالکیت",
        "startDate": "2026-01-01", "endDate": "2026-02-01"}))
    exercise = _data(client.get(f"{API}/exercises", headers=seeded["coach1_h"]))[0]
    body = {"exerciseId": exercise["id"], "dayOfWeek": 1}

    # Another coach's program is off limits; an athlete cannot write at all.
    assert client.post(f"{API}/training-programs/{program['id']}/exercises",
                       headers=seeded["coach2_h"], json=body).status_code == 403
    assert client.post(f"{API}/training-programs/{program['id']}/exercises",
                       headers=tokens["AH"], json=body).status_code == 403
    assert client.post(f"{API}/training-programs/missing-id/exercises",
                       headers=tokens["ADH"], json=body).status_code == 404
    assert client.put(f"{API}/training-programs/{program['id']}/exercises/missing-id",
                      headers=seeded["coach1_h"], json={"sets": 2}).status_code == 404
    assert client.delete(f"{API}/training-programs/{program['id']}/exercises/missing-id",
                         headers=seeded["coach1_h"]).status_code == 404


def _throwaway_membership(client, tokens) -> dict:
    """An admin-created membership this test may freeze and thaw at will.

    Same reasoning as ``_throwaway_user``: the suite shares one database, and
    ``test_freeze_camel_case`` in ``test_contract.py`` already freezes a seeded
    membership. Two tests fighting over one row's status is a flake.
    """
    user = _throwaway_user(client, tokens, f"freeze-probe-{uuid4().hex[:8]}@x.ir")
    plan = _data(client.get(f"{API}/membership-plans", headers=tokens["ADH"]))[0]
    branch = _data(client.get(f"{API}/branches", headers=tokens["ADH"]))[0]
    return _data(client.post(f"{API}/memberships", headers=tokens["ADH"], json={
        "userId": user["id"], "planId": plan["id"], "branchId": branch["id"],
        "startDate": "2026-01-01T00:00:00", "endDate": "2026-04-01T00:00:00",
        "sessionsTotal": 24, "price": 3_000_000, "finalPrice": 2_700_000,
        "discountAmount": 300_000}))


def test_freeze_is_rejected_unless_the_membership_is_active(client, tokens):
    """The web client mirrors this 400 in mock mode, so it has to be real.

    Freeze and unfreeze are state transitions, not idempotent setters: the
    handler refuses anything that is not in the one state it accepts. If the
    server ever relaxed that, the mock would be stricter than the API and the
    admin screen would show a failure that production does not have.
    """
    membership = _throwaway_membership(client, tokens)
    mid = membership["id"]

    # Not frozen yet, so there is nothing to thaw.
    assert client.post(f"{API}/memberships/{mid}/unfreeze",
                       headers=tokens["ADH"]).status_code == 400

    frozen = _data(client.post(f"{API}/memberships/{mid}/freeze", headers=tokens["ADH"],
                               json={"freezeReason": "travel"}))
    assert frozen["status"] == "frozen"
    assert frozen["freezeReason"] == "travel"

    # A second freeze is an error, not a no-op.
    assert client.post(f"{API}/memberships/{mid}/freeze", headers=tokens["ADH"],
                       json={"freezeReason": "again"}).status_code == 400

    thawed = _data(client.post(f"{API}/memberships/{mid}/unfreeze", headers=tokens["ADH"]))
    assert thawed["status"] == "active"
    # The reason must be cleared, not left behind for the table to render.
    assert thawed["freezeReason"] is None


def test_membership_writes_are_staff_only(client, tokens, seeded):
    membership = _throwaway_membership(client, tokens)
    mid = membership["id"]
    assert membership["sessionsRemaining"] == 24

    for headers in (seeded["athlete1_h"], seeded["coach1_h"]):
        assert client.post(f"{API}/memberships/{mid}/freeze", headers=headers,
                           json={"freezeReason": "x"}).status_code == 403
        assert client.post(f"{API}/memberships/{mid}/unfreeze",
                           headers=headers).status_code == 403
        assert client.put(f"{API}/memberships/{mid}", headers=headers,
                          json={"sessionsUsed": 1}).status_code == 403

    # sessionsRemaining is derived, so a used-session write has to move it.
    updated = _data(client.put(f"{API}/memberships/{mid}", headers=tokens["ADH"],
                               json={"sessionsUsed": 5}))
    assert (updated["sessionsUsed"], updated["sessionsRemaining"]) == (5, 19)

    assert client.post(f"{API}/memberships/missing-id/freeze", headers=tokens["ADH"],
                       json={}).status_code == 404
    assert client.post(f"{API}/memberships/missing-id/unfreeze",
                       headers=tokens["ADH"]).status_code == 404


# ======================================================= 5. Analytics


def test_attendance_trend(client, seeded):
    rows = _data(client.get(f"{API}/dashboard/attendance-trend", headers=seeded["admin_h"]))
    assert len(rows) == 30, f"default window should be dense 30 days, got {len(rows)}"
    assert set(rows[0]) == {"date", "checkIns", "uniqueMembers"}
    dates = [r["date"] for r in rows]
    assert dates == sorted(dates), "must be ascending"
    assert len(set(dates)) == len(dates), "no duplicate buckets"
    assert all(isinstance(r["checkIns"], int) for r in rows)
    assert all(r["uniqueMembers"] <= r["checkIns"] for r in rows)
    assert sum(r["checkIns"] for r in rows) > 0, "seed should produce check-ins"
    # Proves uniqueMembers is a distinct member count, not a copy of checkIns:
    # the seed gives some athletes two visits on the same day.
    wide = _data(client.get(f"{API}/dashboard/attendance-trend",
                            headers=seeded["admin_h"], params={"days": 60}))
    assert any(r["uniqueMembers"] < r["checkIns"] for r in wide), (
        "no day with a repeat visit — uniqueMembers is indistinguishable from checkIns"
    )

    narrow = _data(client.get(f"{API}/dashboard/attendance-trend",
                              headers=seeded["admin_h"], params={"days": 7}))
    assert len(narrow) == 7
    assert narrow[-1]["date"] == rows[-1]["date"], "both windows end today"


def test_revenue_trend(client, seeded):
    rows = _data(client.get(f"{API}/dashboard/revenue-trend", headers=seeded["admin_h"]))
    assert len(rows) == 6
    assert set(rows[0]) == {"month", "revenue", "payments"}
    months = [r["month"] for r in rows]
    assert months == sorted(months), "must be ascending"
    assert all(len(m) == 7 and m[4] == "-" for m in months), f"expected YYYY-MM, got {months}"
    assert sum(r["revenue"] for r in rows) > 0, "seed should produce completed payments"
    assert len(_data(client.get(f"{API}/dashboard/revenue-trend",
                                headers=seeded["admin_h"], params={"months": 12}))) == 12


def test_membership_distribution(client, seeded):
    rows = _data(client.get(f"{API}/dashboard/membership-distribution",
                            headers=seeded["admin_h"]))
    assert rows, "seed has membership plans"
    assert set(rows[0]) == {"planId", "planName", "count", "revenue"}
    assert sum(r["count"] for r in rows) > 0
    counts = [r["count"] for r in rows]
    assert counts == sorted(counts, reverse=True), "most popular first"


def test_peak_hours_covers_all_24(client, seeded):
    rows = _data(client.get(f"{API}/dashboard/peak-hours", headers=seeded["admin_h"]))
    assert len(rows) == 24
    assert set(rows[0]) == {"hour", "checkIns"}
    assert [r["hour"] for r in rows] == list(range(24))
    assert sum(r["checkIns"] for r in rows) > 0


def test_athlete_activity(client, seeded, tokens):
    aid = seeded["athlete1_id"]
    rows = _data(client.get(f"{API}/dashboard/athlete/{aid}/activity",
                            headers=seeded["athlete1_h"]))
    assert len(rows) == 30
    assert set(rows[0]) == {"date", "checkedIn", "durationMinutes", "exercisesCompleted"}
    dates = [r["date"] for r in rows]
    assert dates == sorted(dates)
    assert all(isinstance(r["checkedIn"], bool) for r in rows)
    assert any(r["checkedIn"] for r in rows), "seed should give athlete1 check-ins"

    # Admin and coach may read any athlete; an unrelated athlete may not.
    assert client.get(f"{API}/dashboard/athlete/{aid}/activity",
                      headers=seeded["admin_h"]).status_code == 200
    assert client.get(f"{API}/dashboard/athlete/{aid}/activity",
                      headers=seeded["coach1_h"]).status_code == 200
    assert client.get(f"{API}/dashboard/athlete/{aid}/activity",
                      headers=tokens["AH"]).status_code == 403
    assert client.get(f"{API}/dashboard/athlete/ghost/activity",
                      headers=seeded["admin_h"]).status_code == 404


def test_analytics_is_staff_only(client, tokens, seeded):
    staff_paths = [
        f"{API}/dashboard/attendance-trend",
        f"{API}/dashboard/revenue-trend",
        f"{API}/dashboard/membership-distribution",
        f"{API}/dashboard/peak-hours",
    ]
    for path in staff_paths:
        assert client.get(path, headers=tokens["AH"]).status_code == 403, path
        assert client.get(path, headers=seeded["coach1_h"]).status_code == 403, path
        assert client.get(path, headers=seeded["reception_h"]).status_code == 200, path
        assert client.get(path).status_code in (401, 403), path


def test_analytics_param_bounds(client, seeded):
    h = seeded["admin_h"]
    for params in ({"days": 0}, {"days": 366}, {"days": -1}, {"days": "abc"}):
        assert client.get(f"{API}/dashboard/attendance-trend",
                          headers=h, params=params).status_code == 422, params
    for params in ({"days": 0}, {"days": 366}):
        assert client.get(f"{API}/dashboard/peak-hours",
                          headers=h, params=params).status_code == 422, params
    for params in ({"months": 0}, {"months": 25}):
        assert client.get(f"{API}/dashboard/revenue-trend",
                          headers=h, params=params).status_code == 422, params
    assert client.get(f"{API}/dashboard/athlete/{seeded['athlete1_id']}/activity",
                      headers=h, params={"days": 400}).status_code == 422


def test_existing_dashboard_routes_not_shadowed(client, seeded):
    """analytics shares the /dashboard prefix — the originals must still work."""
    assert "totalUsers" in _data(client.get(f"{API}/dashboard/stats",
                                            headers=seeded["admin_h"]))
    aid = seeded["athlete1_id"]
    assert "currentProgram" in _data(
        client.get(f"{API}/dashboard/athlete/{aid}", headers=seeded["athlete1_h"]))
    cid = seeded["coach1_id"]
    assert "athletes" in _data(
        client.get(f"{API}/dashboard/coach/{cid}", headers=seeded["coach1_h"]))


# ======= 6. Routes that had no client method until the coverage sweep =======
# These three server operations were reachable only by hand-writing a request:
# nothing in the frontend called them. Pinned here so the behaviour the new
# client methods rely on cannot drift.


def test_notification_delete_is_scoped_to_its_owner(client, tokens):
    """A delete is owner-scoped, and someone else's row is a 404 rather than a 403.

    The distinction matters to the UI: 403 means "ask someone with rights",
    404 means "it is gone, drop the row". The handler filters on
    ``user_id == current_user.id``, so a foreign id simply does not match.
    """
    athlete_id = tokens["athlete"]["user"]["id"]
    created = _data(client.post(f"{API}/notifications", headers=tokens["ADH"], json={
        "userId": athlete_id, "title": "حذف", "message": "متن", "type": "info"}))

    before = _data(client.get(f"{API}/notifications", headers=tokens["AH"]))
    assert any(n["id"] == created["id"] for n in before)

    # The admin owns neither row, so it cannot delete the athlete's.
    assert client.delete(f"{API}/notifications/{created['id']}",
                         headers=tokens["ADH"]).status_code == 404

    assert client.delete(f"{API}/notifications/{created['id']}",
                         headers=tokens["AH"]).status_code == 200

    after = _data(client.get(f"{API}/notifications", headers=tokens["AH"]))
    assert not any(n["id"] == created["id"] for n in after)
    assert len(after) == len(before) - 1

    # Second delete is a 404, so the UI can treat it as idempotent-on-retry.
    assert client.delete(f"{API}/notifications/{created['id']}",
                         headers=tokens["AH"]).status_code == 404


def test_revenue_series_shape_and_roles(client, tokens):
    """``GET /dashboard/revenue`` returns parallel arrays, not a list of points.

    This is the only endpoint with a *daily* revenue window;
    ``/dashboard/revenue-trend`` is monthly-only. The two are separate client
    methods for that reason, so the shape is asserted rather than assumed.
    """
    monthly = _data(client.get(f"{API}/dashboard/revenue", headers=tokens["ADH"]))
    assert set(monthly) == {"labels", "values"}
    assert len(monthly["labels"]) == len(monthly["values"]) == 6
    assert all(len(label) == 7 and label[4] == "-" for label in monthly["labels"])
    assert all(isinstance(v, (int, float)) and v >= 0 for v in monthly["values"])
    assert monthly["labels"] == sorted(monthly["labels"]), "series must be ascending"

    daily = _data(client.get(f"{API}/dashboard/revenue", headers=tokens["ADH"],
                             params={"period": "daily"}))
    assert len(daily["labels"]) == len(daily["values"]) == 30
    assert all(len(label) == 10 for label in daily["labels"])
    assert daily["labels"] == sorted(daily["labels"])

    windowed = _data(client.get(f"{API}/dashboard/revenue", headers=tokens["ADH"],
                                params={"months": 3}))
    assert len(windowed["labels"]) == 3

    # A coach may read it; the period is validated by a pattern, so a bad one
    # dies at 422 before the handler.
    assert client.get(f"{API}/dashboard/revenue", headers=tokens["COH"]).status_code == 200
    assert client.get(f"{API}/dashboard/revenue", headers=tokens["ADH"],
                      params={"period": "weekly"}).status_code == 422


def test_checkout_at_an_explicit_time(client, tokens):
    """``PUT /check-ins/{id}/checkout`` is a distinct route, not an alias of the POST.

    ``POST /check-ins/check-out`` always stamps *now*; this one takes the time
    in the body, which is how reception closes a session a member walked out of.
    Both refuse a session that is already closed.
    """
    athlete_id = tokens["athlete"]["user"]["id"]
    branch = _data(client.get(f"{API}/branches", headers=tokens["ADH"]))[0]

    opened = _data(client.post(f"{API}/check-ins", headers=tokens["ADH"], json={
        "userId": athlete_id, "branchId": branch["id"]}))
    assert opened["checkOutTime"] is None

    check_in_at = datetime.fromisoformat(opened["checkInTime"])
    # Microseconds are kept deliberately. The handler does
    # `int(total_seconds() / 60)`, which truncates, so a checkout time with its
    # microseconds zeroed sits 0.x s short of the full minute and reports 94.
    # Callers wanting a round duration have to align with the stored check-in.
    leaving_at = check_in_at + timedelta(minutes=95)

    closed = _data(client.put(f"{API}/check-ins/{opened['id']}/checkout",
                              headers=tokens["ADH"],
                              json={"checkOutTime": leaving_at.isoformat()}))
    assert closed["checkOutTime"] is not None
    assert closed["durationMinutes"] == 95, "duration is derived server-side"

    # Already closed: the route refuses rather than overwriting the stored time.
    assert client.put(f"{API}/check-ins/{opened['id']}/checkout",
                      headers=tokens["ADH"],
                      json={"checkOutTime": leaving_at.isoformat()}).status_code == 400

    assert client.put(f"{API}/check-ins/{uuid4().hex}/checkout", headers=tokens["ADH"],
                      json={"checkOutTime": leaving_at.isoformat()}).status_code == 404

    # The body is optional — omitting it defaults to now, per CheckOutUpdate.
    second = _data(client.post(f"{API}/check-ins", headers=tokens["ADH"], json={
        "userId": athlete_id, "branchId": branch["id"]}))
    assert client.put(f"{API}/check-ins/{second['id']}/checkout",
                      headers=tokens["ADH"], json={}).status_code == 200
