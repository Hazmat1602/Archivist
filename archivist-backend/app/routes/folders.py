import re
from datetime import date, datetime, timezone

from dateutil.relativedelta import relativedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models.folder import Folder
from app.models.retention_code import RetentionCode
from app.models.user import User
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


def _folder_to_read(folder: Folder, db: Session, code_str: str | None = None) -> FolderRead:
    """Build a FolderRead from a Folder, looking up the retention code string."""
    resolved_code = code_str if code_str is not None else ""
    if resolved_code == "" and folder.retention_code_id:
        rc = db.get(RetentionCode, folder.retention_code_id)
        if rc:
            resolved_code = rc.code
    return FolderRead(
        id=folder.id,
        retention_id=folder.retention_id,
        code=resolved_code,
        name=folder.name,
        created_date=folder.created_date,
        start_date=folder.start_date,
        expiry_date=folder.expiry_date,
        box_id=folder.box_id,
        retention_code_id=folder.retention_code_id,
        created_by=folder.created_by,
        modified_by=folder.modified_by,
        modified_at=folder.modified_at,
    )


@router.get("/", response_model=list[FolderRead])
def list_folders(
    unassigned: bool = False,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    query = db.query(Folder)
    if unassigned:
        query = query.filter(Folder.box_id.is_(None))
    folders = query.all()
    retention_ids = {folder.retention_code_id for folder in folders if folder.retention_code_id}
    code_lookup = {}
    if retention_ids:
        code_lookup = dict(
            db.query(RetentionCode.id, RetentionCode.code)
            .filter(RetentionCode.id.in_(retention_ids))
            .all()
        )
    return [_folder_to_read(f, db, code_lookup.get(f.retention_code_id, "")) for f in folders]


@router.get("/{folder_id}", response_model=FolderRead)
def get_folder(folder_id: int, db: Session = Depends(get_db), _user: User = Depends(get_current_user)):
    folder = db.get(Folder, folder_id)
    if not folder:
        raise HTTPException(404, "Folder not found")
    return _folder_to_read(folder, db)


@router.post("/", response_model=FolderRead, status_code=201)
def create_folder(body: FolderCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    code_records = db.query(RetentionCode).filter(RetentionCode.code == body.code).all()
    expiry_date = None
    code_id = None
    if code_records:
        code_obj = code_records[0]
        code_id = code_obj.id
        expiry_date = _calc_expiry(code_obj, body.start_date)

    if not code_id:
        raise HTTPException(400, f"Retention code '{body.code}' not found")

    for _attempt in range(3):
        retention_id = _generate_retention_id(db, body.code)
        folder = Folder(
            retention_id=retention_id,
            retention_code_id=code_id,
            name=body.name,
            created_date=date.today(),
            start_date=body.start_date,
            expiry_date=expiry_date,
            box_id=body.box_id,
            created_by=user.id,
        )
        db.add(folder)
        try:
            db.flush()
            db.commit()
            db.refresh(folder)
            return _folder_to_read(folder, db)
        except IntegrityError:
            db.rollback()
    raise HTTPException(409, "Failed to generate unique retention ID after retries")


@router.patch("/{folder_id}", response_model=FolderRead)
def update_folder(folder_id: int, body: FolderUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    folder = db.get(Folder, folder_id)
    if not folder:
        raise HTTPException(404, "Folder not found")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(folder, key, value)
    folder.modified_by = user.id
    folder.modified_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(folder)
    return _folder_to_read(folder, db)


@router.delete("/{folder_id}", status_code=204)
def delete_folder(folder_id: int, db: Session = Depends(get_db), _user: User = Depends(get_current_user)):
    folder = db.get(Folder, folder_id)
    if not folder:
        raise HTTPException(404, "Folder not found")
    db.delete(folder)
    db.commit()


@router.post("/{folder_id}/assign/{box_id}", response_model=FolderRead)
def assign_folder_to_box(folder_id: int, box_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    folder = db.get(Folder, folder_id)
    if not folder:
        raise HTTPException(404, "Folder not found")
    folder.box_id = box_id
    folder.modified_by = user.id
    folder.modified_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(folder)
    return _folder_to_read(folder, db)


@router.post("/{folder_id}/unassign", response_model=FolderRead)
def unassign_folder(folder_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    folder = db.get(Folder, folder_id)
    if not folder:
        raise HTTPException(404, "Folder not found")
    folder.box_id = None
    folder.modified_by = user.id
    folder.modified_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(folder)
    return _folder_to_read(folder, db)
