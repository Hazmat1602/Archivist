from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.box import Box
from app.models.folder import Folder
from app.models.location import Location
from app.models.retention_code import RetentionCode

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/")
def dashboard_stats(db: Session = Depends(get_db)):
    total_folders = db.query(Folder).count()
    total_boxes = db.query(Box).count()
    total_codes = db.query(RetentionCode).count()
    total_locations = db.query(Location).count()
    unassigned_folders = db.query(Folder).filter(Folder.box_id.is_(None)).count()

    today = date.today()
    expiring_soon = db.query(Folder).filter(
        Folder.expiry_date.isnot(None),
        Folder.expiry_date <= today + timedelta(days=365),
        Folder.expiry_date >= today,
    ).count()

    expired = db.query(Folder).filter(
        Folder.expiry_date.isnot(None),
        Folder.expiry_date < today,
    ).count()

    return {
        "total_folders": total_folders,
        "total_boxes": total_boxes,
        "total_codes": total_codes,
        "total_locations": total_locations,
        "unassigned_folders": unassigned_folders,
        "expiring_soon": expiring_soon,
        "expired": expired,
    }
