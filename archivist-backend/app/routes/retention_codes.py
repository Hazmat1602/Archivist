from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.retention_code import RetentionCode
from app.schemas.retention_code import RetentionCodeCreate, RetentionCodeRead, RetentionCodeUpdate

router = APIRouter(prefix="/codes", tags=["retention-codes"])


@router.get("/", response_model=list[RetentionCodeRead])
def list_codes(db: Session = Depends(get_db)):
    return db.query(RetentionCode).all()


@router.get("/{code_id}", response_model=RetentionCodeRead)
def get_code(code_id: int, db: Session = Depends(get_db)):
    code = db.get(RetentionCode, code_id)
    if not code:
        raise HTTPException(404, "Code not found")
    return code


@router.post("/", response_model=RetentionCodeRead, status_code=201)
def create_code(body: RetentionCodeCreate, db: Session = Depends(get_db)):
    code = RetentionCode(**body.model_dump())
    db.add(code)
    db.commit()
    db.refresh(code)
    return code


@router.patch("/{code_id}", response_model=RetentionCodeRead)
def update_code(code_id: int, body: RetentionCodeUpdate, db: Session = Depends(get_db)):
    code = db.get(RetentionCode, code_id)
    if not code:
        raise HTTPException(404, "Code not found")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(code, key, value)
    db.commit()
    db.refresh(code)
    return code


@router.delete("/{code_id}", status_code=204)
def delete_code(code_id: int, db: Session = Depends(get_db)):
    code = db.get(RetentionCode, code_id)
    if not code:
        raise HTTPException(404, "Code not found")
    db.delete(code)
    db.commit()
