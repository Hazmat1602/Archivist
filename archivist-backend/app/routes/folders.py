import re
from datetime import date

from dateutil.relativedelta import relativedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.folder import Folder
from app.models.retention_code import RetentionCode
from app.schemas.folder import FolderCreate, FolderRead, FolderUpdate

router = APIRouter(prefix="/folders", tags=["folders"])


def _generate_retention_id(db: Session, code: str) -> str:
    year = date.today().year
    prefix = f"F{year}-"
    max_id = (
        db.query(func.max(Folder.retention_id))
        .filter(Folder.retention_id.like(f"{prefix}%"))
        .scalar()
    )
    if max_id:
        match = re.search(r"F\d{4}-(\d{4})-", max_id)
        seq = int(match.group(1)) + 1 if match else 1
    else:
        seq = 1
    return f"{prefix}{seq:04d}-{code}"


def _calc_expiry(code_obj: RetentionCode, start: date) -> date | None:
    if code_obj.period == -1:
        return None  # permanent
    if code_obj.period is not None:
        return start + relativedelta(years=code_obj.period)
    if code_obj.date is not None:
        return code_obj.date
    if code_obj.m_period is not None:
        return start + relativedelta(months=code_obj.m_period)
    return None


@router.get("/", response_model=list[FolderRead])
def list_folders(
    unassigned: bool = False,
    db: Session = Depends(get_db),
):
    query = db.query(Folder)
    if unassigned:
        query = query.filter(Folder.box_id.is_(None))
    return query.all()


@router.get("/{folder_id}", response_model=FolderRead)
def get_folder(folder_id: int, db: Session = Depends(get_db)):
    folder = db.get(Folder, folder_id)
    if not folder:
        raise HTTPException(404, "Folder not found")
    return folder


@router.post("/", response_model=FolderRead, status_code=201)
def create_folder(body: FolderCreate, db: Session = Depends(get_db)):
    code_records = db.query(RetentionCode).filter(RetentionCode.code == body.code).all()
    expiry_date = None
    code_id = None
    if code_records:
        code_obj = code_records[0]
        code_id = code_obj.id
        expiry_date = _calc_expiry(code_obj, body.start_date)

    for _attempt in range(3):
        retention_id = _generate_retention_id(db, body.code)
        folder = Folder(
            retention_id=retention_id,
            code=body.code,
            name=body.name,
            created_date=date.today(),
            start_date=body.start_date,
            expiry_date=expiry_date,
            box_id=body.box_id,
            retention_code_id=code_id,
        )
        db.add(folder)
        try:
            db.flush()
            db.commit()
            db.refresh(folder)
            return folder
        except IntegrityError:
            db.rollback()
    raise HTTPException(409, "Failed to generate unique retention ID after retries")


@router.patch("/{folder_id}", response_model=FolderRead)
def update_folder(folder_id: int, body: FolderUpdate, db: Session = Depends(get_db)):
    folder = db.get(Folder, folder_id)
    if not folder:
        raise HTTPException(404, "Folder not found")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(folder, key, value)
    db.commit()
    db.refresh(folder)
    return folder


@router.delete("/{folder_id}", status_code=204)
def delete_folder(folder_id: int, db: Session = Depends(get_db)):
    folder = db.get(Folder, folder_id)
    if not folder:
        raise HTTPException(404, "Folder not found")
    db.delete(folder)
    db.commit()


@router.post("/{folder_id}/assign/{box_id}", response_model=FolderRead)
def assign_folder_to_box(folder_id: int, box_id: int, db: Session = Depends(get_db)):
    folder = db.get(Folder, folder_id)
    if not folder:
        raise HTTPException(404, "Folder not found")
    folder.box_id = box_id
    db.commit()
    db.refresh(folder)
    return folder


@router.post("/{folder_id}/unassign", response_model=FolderRead)
def unassign_folder(folder_id: int, db: Session = Depends(get_db)):
    folder = db.get(Folder, folder_id)
    if not folder:
        raise HTTPException(404, "Folder not found")
    folder.box_id = None
    db.commit()
    db.refresh(folder)
    return folder
