"""Shared helper functions used across multiple route modules."""
from datetime import date

from dateutil.relativedelta import relativedelta
from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.box import Box
from app.models.folder import Folder
from app.models.retention_code import RetentionCode


def calc_expiry(code_obj: RetentionCode, start: date) -> date | None:
    """Calculate expiry date from a retention code and a start date."""
    if code_obj.period == -1:
        return None  # permanent
    if code_obj.period is not None:
        return start + relativedelta(years=code_obj.period)
    if code_obj.date is not None:
        return code_obj.date
    if code_obj.m_period is not None:
        return start + relativedelta(months=code_obj.m_period)
    return None


def sync_box_expiry_from_folders(db: Session, box_id: int) -> None:
    """Recalculate a box's expiry date as the earliest folder expiry."""
    box = db.get(Box, box_id)
    if not box:
        raise HTTPException(404, "Box not found")

    oldest_folder_expiry = (
        db.query(func.min(Folder.expiry_date))
        .filter(Folder.box_id == box_id, Folder.expiry_date.is_not(None))
        .scalar()
    )
    box.expiry_date = oldest_folder_expiry
