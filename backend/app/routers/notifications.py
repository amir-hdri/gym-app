from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Notification, User
from app.responses import error_response, paginated_response, success_response
from app.schemas import NotificationCreate, NotificationResponse

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
    current_user: User = Depends(get_current_user),
):
    notification = Notification(**req.model_dump(by_alias=False))
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return success_response(
        data=NotificationResponse.model_validate(notification).model_dump(by_alias=True),
        message="Notification created",
    )


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
