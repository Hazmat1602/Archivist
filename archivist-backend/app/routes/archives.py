from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.archive import Archive
from app.schemas.archive import ArchiveCreate, ArchiveRead, ArchiveUpdate

router = APIRouter(prefix="/archives", tags=["archives"])


@router.get("/", response_model=list[ArchiveRead])
def list_archives(db: Session = Depends(get_db)):
    return db.query(Archive).all()


@router.get("/{archive_id}", response_model=ArchiveRead)
def get_archive(archive_id: int, db: Session = Depends(get_db)):
    arc = db.get(Archive, archive_id)
    if not arc:
        raise HTTPException(404, "Archive not found")
    return arc


@router.post("/", response_model=ArchiveRead, status_code=201)
def create_archive(body: ArchiveCreate, db: Session = Depends(get_db)):
    arc = Archive(**body.model_dump())
    db.add(arc)
    db.commit()
    db.refresh(arc)
    return arc


@router.patch("/{archive_id}", response_model=ArchiveRead)
def update_archive(archive_id: int, body: ArchiveUpdate, db: Session = Depends(get_db)):
    arc = db.get(Archive, archive_id)
    if not arc:
        raise HTTPException(404, "Archive not found")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(arc, key, value)
    db.commit()
    db.refresh(arc)
    return arc


@router.delete("/{archive_id}", status_code=204)
def delete_archive(archive_id: int, db: Session = Depends(get_db)):
    arc = db.get(Archive, archive_id)
    if not arc:
        raise HTTPException(404, "Archive not found")
    db.delete(arc)
    db.commit()
