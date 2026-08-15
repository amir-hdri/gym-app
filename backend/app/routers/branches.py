from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Branch, User
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
def create_branch(req: BranchCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
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
    current_user: User = Depends(get_current_user),
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
