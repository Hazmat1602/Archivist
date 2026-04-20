import re
from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models.box import Box
from app.models.folder import Folder
from app.models.user import User
from app.schemas.box import BoxCreate, BoxRead, BoxUpdate

router = APIRouter(prefix="/boxes", tags=["boxes"])


def _box_to_read(box: Box, db: Session) -> BoxRead:
    folder_count = db.query(Folder).filter(Folder.box_id == box.id).count()
    return BoxRead(
        id=box.id,
        code=box.code,
        name=box.name,
        created_date=box.created_date,
        expiry_date=box.expiry_date,
        location_id=box.location_id,
        archive_id=box.archive_id,
        folder_count=folder_count,
        created_by=box.created_by,
        modified_by=box.modified_by,
        modified_at=box.modified_at,
    )


def _generate_box_code(db: Session) -> str:
    year = date.today().year
    prefix = f"B{year}-"
    max_code = (
        db.query(func.max(Box.code))
        .filter(Box.code.like(f"{prefix}%"))
        .scalar()
    )
    if max_code:
        match = re.search(r"(\d{4})$", max_code)
        seq = int(match.group(1)) + 1 if match else 1
    else:
        seq = 1
    return f"{prefix}{seq:04d}"


def _create_box_with_retry(db: Session, body: BoxCreate, user_id: int, max_retries: int = 3) -> Box:
    for attempt in range(max_retries):
        code = _generate_box_code(db)
        box = Box(
            code=code,
            name=body.name,
            created_date=date.today(),
            expiry_date=body.expiry_date,
            location_id=body.location_id,
            created_by=user_id,
        )
        db.add(box)
        try:
            db.flush()
            return box
        except IntegrityError:
            db.rollback()
    raise HTTPException(409, "Failed to generate unique box code after retries")


@router.get("/", response_model=list[BoxRead])
def list_boxes(
    offset: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    boxes = db.query(Box).offset(offset).limit(limit).all()
    box_ids = [b.id for b in boxes]
    folder_counts = {}
    if box_ids:
        folder_counts = dict(
            db.query(Folder.box_id, func.count(Folder.id))
            .filter(Folder.box_id.in_(box_ids))
            .group_by(Folder.box_id)
            .all()
        )

    return [
        BoxRead(
            id=box.id,
            code=box.code,
            name=box.name,
            created_date=box.created_date,
            expiry_date=box.expiry_date,
            location_id=box.location_id,
            archive_id=box.archive_id,
            folder_count=folder_counts.get(box.id, 0),
            created_by=box.created_by,
            modified_by=box.modified_by,
            modified_at=box.modified_at,
        )
        for box in boxes
    ]


@router.get("/{box_id}", response_model=BoxRead)
def get_box(box_id: int, db: Session = Depends(get_db), _user: User = Depends(get_current_user)):
    box = db.get(Box, box_id)
    if not box:
        raise HTTPException(404, "Box not found")
    return _box_to_read(box, db)


@router.post("/", response_model=BoxRead, status_code=201)
def create_box(body: BoxCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    box = _create_box_with_retry(db, body, user.id)
    db.commit()
    db.refresh(box)
    return _box_to_read(box, db)


@router.patch("/{box_id}", response_model=BoxRead)
def update_box(box_id: int, body: BoxUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    box = db.get(Box, box_id)
    if not box:
        raise HTTPException(404, "Box not found")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(box, key, value)
    box.modified_by = user.id
    box.modified_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(box)
    return _box_to_read(box, db)


@router.delete("/{box_id}", status_code=204)
def delete_box(box_id: int, db: Session = Depends(get_db), _user: User = Depends(get_current_user)):
    box = db.get(Box, box_id)
    if not box:
        raise HTTPException(404, "Box not found")
    # Unassign folders before deleting
    db.query(Folder).filter(Folder.box_id == box_id).update({"box_id": None})
    db.delete(box)
    db.commit()


@router.post("/{box_id}/assign-folders")
def assign_folders_to_box(box_id: int, folder_ids: list[int], db: Session = Depends(get_db), _user: User = Depends(get_current_user)):
    box = db.get(Box, box_id)
    if not box:
        raise HTTPException(404, "Box not found")
    updated = db.query(Folder).filter(Folder.id.in_(folder_ids)).update({"box_id": box_id})
    db.commit()
    return {"assigned": updated}
