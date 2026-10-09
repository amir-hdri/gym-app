"""Athlete <-> coach messaging (API contract v2, section 1).

A conversation is uniquely keyed by ``(athlete_id, coach_id)``. The parties are
the athlete and the coach; an ``admin`` may read any conversation (and is shown
the athlete as the `participant`). Everyone else gets 403.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Conversation, Message, User
from app.responses import error_response, paginated_response, success_response
from app.schemas import (
    ConversationCreate,
    ConversationLastMessage,
    ConversationParticipant,
    ConversationResponse,
    MessageCreate,
    MessageResponse,
)

router = APIRouter(prefix="/api/v1/messages", tags=["Messages"])


def _utcnow_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _is_participant(conversation: Conversation, user: User) -> bool:
    if user.role == "admin":
        return True
    return user.id in (conversation.athlete_id, conversation.coach_id)


def _other_party_id(conversation: Conversation, user: User) -> str:
    """The id of the party shown as `participant` to this caller.

    For an admin (an observer, never a party) that is the athlete.
    """
    if user.id == conversation.athlete_id:
        return conversation.coach_id
    if user.id == conversation.coach_id:
        return conversation.athlete_id
    return conversation.athlete_id


def _unread_count(db: Session, conversation_id: str, user: User) -> int:
    return (
        db.query(func.count(Message.id))
        .filter(
            Message.conversation_id == conversation_id,
            Message.sender_id != user.id,
            Message.read_at.is_(None),
        )
        .scalar()
        or 0
    )


def _last_message(db: Session, conversation_id: str) -> Message | None:
    return (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.desc(), Message.id.desc())
        .first()
    )


def _conversation_payload(
    db: Session,
    conversation: Conversation,
    user: User,
    unread_count: int | None = None,
) -> dict:
    participant_id = _other_party_id(conversation, user)
    participant = (
        conversation.athlete
        if participant_id == conversation.athlete_id
        else conversation.coach
    )
    if participant is None or participant.id != participant_id:
        participant = db.query(User).filter(User.id == participant_id).first()

    last = _last_message(db, conversation.id)
    payload = ConversationResponse.model_validate(conversation).model_dump(by_alias=True)
    payload["participant"] = (
        ConversationParticipant.model_validate(participant).model_dump(by_alias=True)
        if participant is not None
        else None
    )
    payload["lastMessage"] = (
        ConversationLastMessage.model_validate(last).model_dump(by_alias=True)
        if last is not None
        else None
    )
    payload["unreadCount"] = (
        _unread_count(db, conversation.id, user) if unread_count is None else unread_count
    )
    return payload


def _visible_conversations(db: Session, user: User):
    """Query of the conversations this caller may see (empty for outsiders)."""
    query = db.query(Conversation)
    if user.role == "admin":
        return query
    if user.role == "athlete":
        return query.filter(Conversation.athlete_id == user.id)
    if user.role == "coach":
        return query.filter(Conversation.coach_id == user.id)
    # Receptionists (and any other role) are not parties to any conversation.
    return query.filter(Conversation.id.is_(None))


@router.get("/conversations")
def list_conversations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = _visible_conversations(db, current_user).order_by(
        func.coalesce(Conversation.last_message_at, Conversation.created_at).desc()
    )
    total = query.count()
    conversations = query.offset((page - 1) * page_size).limit(page_size).all()

    unread_map: dict[str, int] = {}
    if conversations:
        rows = (
            db.query(Message.conversation_id, func.count(Message.id))
            .filter(
                Message.conversation_id.in_([c.id for c in conversations]),
                Message.sender_id != current_user.id,
                Message.read_at.is_(None),
            )
            .group_by(Message.conversation_id)
            .all()
        )
        unread_map = {conversation_id: count for conversation_id, count in rows}

    return paginated_response(
        data=[
            _conversation_payload(db, c, current_user, unread_map.get(c.id, 0))
            for c in conversations
        ],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("/conversations")
def create_conversation(
    req: ConversationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if req.participant_id == current_user.id:
        return error_response("Cannot open a conversation with yourself", 400)

    participant = db.query(User).filter(User.id == req.participant_id).first()
    if participant is None:
        return error_response("Participant not found", 404)

    # The (athlete, coach) pair has to be derivable from the two parties.
    if current_user.role == "athlete" and participant.role == "coach":
        athlete_id, coach_id = current_user.id, participant.id
    elif current_user.role == "coach" and participant.role == "athlete":
        athlete_id, coach_id = participant.id, current_user.id
    else:
        return error_response("A conversation must be between an athlete and a coach", 400)

    existing = (
        db.query(Conversation)
        .filter(Conversation.athlete_id == athlete_id, Conversation.coach_id == coach_id)
        .first()
    )
    if existing is not None:
        # Idempotent: the same pair always maps to the same conversation.
        return success_response(
            data=_conversation_payload(db, existing, current_user),
            message="Conversation retrieved",
        )

    conversation = Conversation(athlete_id=athlete_id, coach_id=coach_id)
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return success_response(
        data=_conversation_payload(db, conversation, current_user),
        message="Conversation created",
    )


@router.get("/unread-count")
def unread_message_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conversation_ids = [c.id for c in _visible_conversations(db, current_user).all()]
    if not conversation_ids:
        return success_response(data={"count": 0})
    count = (
        db.query(func.count(Message.id))
        .filter(
            Message.conversation_id.in_(conversation_ids),
            Message.sender_id != current_user.id,
            Message.read_at.is_(None),
        )
        .scalar()
        or 0
    )
    return success_response(data={"count": count})


@router.get("/conversations/{conversation_id}")
def get_conversation(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if conversation is None:
        return error_response("Conversation not found", 404)
    if not _is_participant(conversation, current_user):
        return error_response("Insufficient permissions", 403)
    return success_response(data=_conversation_payload(db, conversation, current_user))


@router.get("/conversations/{conversation_id}/messages")
def list_messages(
    conversation_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if conversation is None:
        return error_response("Conversation not found", 404)
    if not _is_participant(conversation, current_user):
        return error_response("Insufficient permissions", 403)

    query = db.query(Message).filter(Message.conversation_id == conversation_id)
    total = query.count()
    messages = (
        query.order_by(Message.created_at.asc(), Message.id.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return paginated_response(
        data=[MessageResponse.model_validate(m).model_dump(by_alias=True) for m in messages],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("/conversations/{conversation_id}/messages")
def send_message(
    conversation_id: str,
    req: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if conversation is None:
        return error_response("Conversation not found", 404)
    if not _is_participant(conversation, current_user):
        return error_response("Insufficient permissions", 403)
    # Admins are observers (module docstring): they may read any thread but
    # are never a party, so a send would persist a sender_id that belongs to
    # neither side and confuse both clients' read receipts.
    if current_user.role == "admin":
        return error_response("Admins cannot send messages in athlete-coach conversations", 403)

    body = req.body.strip()
    if not body:
        return error_response("Message body cannot be empty", 400)

    now = _utcnow_naive()
    message = Message(
        conversation_id=conversation.id,
        sender_id=current_user.id,
        body=body,
        created_at=now,
    )
    db.add(message)
    conversation.last_message_at = now
    db.commit()
    db.refresh(message)
    return success_response(
        data=MessageResponse.model_validate(message).model_dump(by_alias=True),
        message="Message sent",
    )


@router.post("/conversations/{conversation_id}/read")
def mark_conversation_read(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if conversation is None:
        return error_response("Conversation not found", 404)
    if not _is_participant(conversation, current_user):
        return error_response("Insufficient permissions", 403)
    # Same observer rule as sends: an admin "read" would stamp the other
    # party's messages with a reader who is not a participant.
    if current_user.role == "admin":
        return error_response("Admins cannot mark messages as read", 403)

    updated = (
        db.query(Message)
        .filter(
            Message.conversation_id == conversation_id,
            Message.sender_id != current_user.id,
            Message.read_at.is_(None),
        )
        .update({"read_at": _utcnow_naive()}, synchronize_session="fetch")
    )
    db.commit()
    return success_response(data={"updated": updated}, message="Conversation marked as read")
