from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth import get_current_user, require_roles
from app.database import get_db
from app.models import Notification, User
from app.responses import error_response, paginated_response, success_response
from app.schemas import NotificationBroadcast, NotificationCreate, NotificationResponse

router = APIRouter(prefix="/api/v1/notifications", tags=["Notifications"])


@router.get("")
def list_notifications(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    unread_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    if unread_only:
        query = query.filter(Notification.is_read == False)
    query = query.order_by(Notification.created_at.desc())
    total = query.count()
    notifications = query.offset((page - 1) * page_size).limit(page_size).all()
    return paginated_response(
        data=[NotificationResponse.model_validate(n).model_dump(by_alias=True) for n in notifications],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("")
def create_notification(
    req: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "receptionist")),
):
    recipient = db.query(User).filter(User.id == req.user_id).first()
    if not recipient:
        return error_response("User not found", 404)
    notification = Notification(**req.model_dump(by_alias=False))
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return success_response(
        data=NotificationResponse.model_validate(notification).model_dump(by_alias=True),
        message="Notification created",
    )


@router.post("/broadcast")
def broadcast_notification(
    req: NotificationBroadcast,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "receptionist")),
):
    query = db.query(User).filter(User.status == "active")
    if req.role:
        allowed_roles = {"athlete", "coach", "admin", "receptionist"}
        if req.role not in allowed_roles:
            return error_response(
                f"Invalid role. Allowed: {', '.join(sorted(allowed_roles))}", 400
            )
        query = query.filter(User.role == req.role)
    if req.branch_id:
        query = query.filter(User.branch_id == req.branch_id)

    recipients = query.all()
    for recipient in recipients:
        db.add(
            Notification(
                user_id=recipient.id,
                title=req.title,
                message=req.message,
                type=req.type,
                action_url=req.action_url,
            )
        )
    db.commit()
    return success_response(
        data={"sent": len(recipients)},
        message=f"Notification sent to {len(recipients)} user(s)",
    )


@router.post("/read-all")
@router.patch("/read-all")
def mark_all_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updated = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id, Notification.is_read == False)
        .update({"is_read": True}, synchronize_session="fetch")
    )
    db.commit()
    return success_response(message=f"{updated} notifications marked as read")


@router.post("/{notification_id}/read")
@router.patch("/{notification_id}/read")
def mark_as_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
        .first()
    )
    if not notification:
        return error_response("Notification not found", 404)
    notification.is_read = True
    db.commit()
    return success_response(message="Notification marked as read")


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
        .first()
    )
    if not notification:
        return error_response("Notification not found", 404)
    db.delete(notification)
    db.commit()
    return success_response(message="Notification deleted")
