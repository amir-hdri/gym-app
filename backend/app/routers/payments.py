from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Payment, User
from app.responses import error_response, paginated_response, success_response
from app.schemas import PaymentCreate, PaymentResponse, PaymentStatusUpdate

router = APIRouter(prefix="/api/v1/payments", tags=["Payments"])


@router.get("")
def list_payments(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    user_id: str = None,
    status: str = None,
    method: str = None,
    date_from: str = None,
    date_to: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Payment)
    if user_id:
        query = query.filter(Payment.user_id == user_id)
    if status:
        query = query.filter(Payment.status == status)
    if method:
        query = query.filter(Payment.method == method)
    if date_from:
        try:
            parsed_from = datetime.fromisoformat(date_from)
        except ValueError:
            return error_response("Invalid date_from format. Use ISO format (e.g. 2024-01-01T00:00:00)", 400)
        query = query.filter(Payment.created_at >= parsed_from)
    if date_to:
        try:
            parsed_to = datetime.fromisoformat(date_to)
        except ValueError:
            return error_response("Invalid date_to format. Use ISO format (e.g. 2024-01-01T00:00:00)", 400)
        query = query.filter(Payment.created_at <= parsed_to)
    query = query.order_by(Payment.created_at.desc())
    total = query.count()
    payments = query.offset((page - 1) * page_size).limit(page_size).all()
    return paginated_response(
        data=[PaymentResponse.model_validate(p).model_dump(by_alias=True) for p in payments],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("")
def create_payment(
    req: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payment = Payment(**req.model_dump(by_alias=False))
    if req.status == "completed":
        payment.paid_at = datetime.utcnow()
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return success_response(
        data=PaymentResponse.model_validate(payment).model_dump(by_alias=True),
        message="Payment created",
    )


@router.get("/{payment_id}")
def get_payment(payment_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        return error_response("Payment not found", 404)
    return success_response(data=PaymentResponse.model_validate(payment).model_dump(by_alias=True))


@router.patch("/{payment_id}/status")
def update_payment_status(
    payment_id: str,
    req: PaymentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        return error_response("Payment not found", 404)
    payment.status = req.status
    if req.status == "completed" and not payment.paid_at:
        payment.paid_at = datetime.utcnow()
    db.commit()
    db.refresh(payment)
    return success_response(
        data=PaymentResponse.model_validate(payment).model_dump(by_alias=True),
        message="Payment status updated",
    )
