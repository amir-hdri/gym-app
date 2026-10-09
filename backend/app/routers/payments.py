from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth import get_current_user, require_roles
from app.database import get_db
from app.models import Membership, Payment, TrainingProgram, User
from app.responses import error_response, paginated_response, success_response
from app.schemas import PaymentCreate, PaymentResponse, PaymentStatusUpdate, PaymentUpdate

router = APIRouter(prefix="/api/v1/payments", tags=["Payments"])


@router.get("")
def list_payments(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    user_id: str = None,
    userId: str = None,
    status: str = None,
    method: str = None,
    date_from: str = None,
    date_to: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Accept both camelCase and snake_case filter spellings (the frontend mixes them).
    user_id = user_id or userId
    # Coaches get read-only visibility into their own athletes' payments
    # (writes stay staff-only) — the coach athlete-detail page needs this.
    if current_user.role == "coach":
        query = db.query(Payment).filter(
            Payment.user_id.in_(
                db.query(TrainingProgram.athlete_id).filter(TrainingProgram.coach_id == current_user.id)
            )
        )
        if user_id:
            query = query.filter(Payment.user_id == user_id)
        query = query.order_by(Payment.created_at.desc())
        total = query.count()
        payments = query.offset((page - 1) * page_size).limit(page_size).all()
        return paginated_response(
            data=[PaymentResponse.model_validate(p).model_dump(by_alias=True) for p in payments],
            total=total,
            page=page,
            page_size=page_size,
        )
    # Athletes can only list their own payments
    if current_user.role == "athlete":
        user_id = user_id or current_user.id
        if user_id != current_user.id:
            return error_response("Insufficient permissions", 403)

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
    if current_user.role == "coach":
        return error_response("Insufficient permissions", 403)
    # Athletes can only create payments for themselves
    if current_user.role == "athlete" and req.user_id != current_user.id:
        return error_response("Insufficient permissions", 403)
    # Validate user exists
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        return error_response("User not found", 404)
    if req.membership_id:
        membership = db.query(Membership).filter(Membership.id == req.membership_id).first()
        if not membership:
            return error_response("Membership not found", 404)
        if membership.user_id != req.user_id:
            return error_response("Membership does not belong to payment user", 400)
    payment = Payment(**req.model_dump(by_alias=False))
    # status is forced to pending at creation; paid_at set only on status transition
    payment.status = "pending"
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
    if current_user.role == "coach":
        coached = (
            db.query(TrainingProgram.id)
            .filter(
                TrainingProgram.coach_id == current_user.id,
                TrainingProgram.athlete_id == payment.user_id,
            )
            .first()
        )
        if not coached:
            return error_response("Insufficient permissions", 403)
    elif current_user.role == "athlete" and payment.user_id != current_user.id:
        return error_response("Insufficient permissions", 403)
    return success_response(data=PaymentResponse.model_validate(payment).model_dump(by_alias=True))


@router.put("/{payment_id}")
def update_payment(
    payment_id: str,
    req: PaymentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "receptionist")),
):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        return error_response("Payment not found", 404)
    update_data = req.model_dump(exclude_unset=True, by_alias=False)
    # `notes` is the wire name; it is persisted on Payment.description.
    if "notes" in update_data:
        payment.description = update_data.pop("notes")
    for key, value in update_data.items():
        setattr(payment, key, value)
    if payment.status == "completed" and not payment.paid_at:
        payment.paid_at = datetime.now(timezone.utc).replace(tzinfo=None)
    elif payment.status != "completed":
        # Backward transitions (completed → pending/failed/...) must not keep
        # a paid_at that claims money changed hands.
        payment.paid_at = None
    db.commit()
    db.refresh(payment)
    return success_response(
        data=PaymentResponse.model_validate(payment).model_dump(by_alias=True),
        message="Payment updated",
    )


@router.patch("/{payment_id}/status")
def update_payment_status(
    payment_id: str,
    req: PaymentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Only staff can transition payment status
    if current_user.role not in {"admin", "receptionist"}:
        return error_response("Only admin/receptionist can update payment status", 403)
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        return error_response("Payment not found", 404)
    allowed = {"pending", "completed", "failed", "refunded", "cancelled"}
    if req.status not in allowed:
        return error_response(f"Invalid status. Allowed: {', '.join(sorted(allowed))}", 400)
    payment.status = req.status
    if req.status == "completed" and not payment.paid_at:
        payment.paid_at = datetime.now(timezone.utc).replace(tzinfo=None)
    elif req.status != "completed":
        payment.paid_at = None
    db.commit()
    db.refresh(payment)
    return success_response(
        data=PaymentResponse.model_validate(payment).model_dump(by_alias=True),
        message="Payment status updated",
    )
