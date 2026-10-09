from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import get_current_user, require_roles
from app.database import get_db
from app.models import Branch, Membership, User
from app.responses import error_response, success_response
from app.schemas import BranchCreate, BranchResponse, BranchUpdate

router = APIRouter(prefix="/api/v1/branches", tags=["Branches"])


@router.get("")
def list_branches(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    branches = db.query(Branch).all()
    return success_response(
        data=[BranchResponse.model_validate(b).model_dump(by_alias=True) for b in branches]
    )


@router.post("")
def create_branch(
    req: BranchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin")),
):
    branch = Branch(**req.model_dump(by_alias=False))
    db.add(branch)
    db.commit()
    db.refresh(branch)
    return success_response(
        data=BranchResponse.model_validate(branch).model_dump(by_alias=True),
        message="Branch created",
    )


@router.get("/{branch_id}")
def get_branch(branch_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not branch:
        return error_response("Branch not found", 404)
    return success_response(data=BranchResponse.model_validate(branch).model_dump(by_alias=True))


@router.put("/{branch_id}")
def update_branch(
    branch_id: str,
    req: BranchUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin")),
):
    branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not branch:
        return error_response("Branch not found", 404)
    update_data = req.model_dump(exclude_unset=True, by_alias=False)
    for key, value in update_data.items():
        setattr(branch, key, value)
    db.commit()
    db.refresh(branch)
    return success_response(
        data=BranchResponse.model_validate(branch).model_dump(by_alias=True),
        message="Branch updated",
    )


@router.delete("/{branch_id}")
def delete_branch(
    branch_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin")),
):
    branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not branch:
        return error_response("Branch not found", 404)
    members = db.query(func.count(User.id)).filter(User.branch_id == branch_id).scalar() or 0
    memberships = (
        db.query(func.count(Membership.id)).filter(Membership.branch_id == branch_id).scalar() or 0
    )
    if members or memberships:
        return error_response(
            f"Branch still has {members} member(s) and {memberships} membership(s); "
            "set isActive=false instead of deleting",
            409,
        )
    db.delete(branch)
    db.commit()
    return success_response(message="Branch deleted")
