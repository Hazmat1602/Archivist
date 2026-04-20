from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models.retention_code import RetentionCode
from app.models.user import User
from app.schemas.retention_code import RetentionCodeCreate, RetentionCodeRead, RetentionCodeUpdate

router = APIRouter(prefix="/codes", tags=["retention-codes"])


@router.get("/", response_model=list[RetentionCodeRead])
def list_codes(
    offset: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    return db.query(RetentionCode).order_by(RetentionCode.id).offset(offset).limit(limit).all()


@router.get("/{code_id}", response_model=RetentionCodeRead)
def get_code(code_id: int, db: Session = Depends(get_db), _user: User = Depends(get_current_user)):
    code = db.get(RetentionCode, code_id)
    if not code:
        raise HTTPException(404, "Code not found")
    return code


@router.post("/", response_model=RetentionCodeRead, status_code=201)
def create_code(body: RetentionCodeCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    code = RetentionCode(**body.model_dump(), created_by=user.id)
    db.add(code)
    db.commit()
    db.refresh(code)
    return code


@router.patch("/{code_id}", response_model=RetentionCodeRead)
def update_code(code_id: int, body: RetentionCodeUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    code = db.get(RetentionCode, code_id)
    if not code:
        raise HTTPException(404, "Code not found")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(code, key, value)
    code.modified_by = user.id
    code.modified_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(code)
    return code


@router.delete("/{code_id}", status_code=204)
def delete_code(code_id: int, db: Session = Depends(get_db), _user: User = Depends(get_current_user)):
    code = db.get(RetentionCode, code_id)
    if not code:
        raise HTTPException(404, "Code not found")
    db.delete(code)
    db.commit()
