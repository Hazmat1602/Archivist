from datetime import date, datetime, timezone
from io import BytesIO
from pathlib import Path

import pandas as pd
from dateutil.relativedelta import relativedelta
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models.box import Box
from app.models.category import Category
from app.models.folder import Folder
from app.models.location import Location
from app.models.retention_code import RetentionCode
from app.models.user import User

router = APIRouter(prefix="/imports", tags=["imports"])


class _UploadEvent:
    def __init__(self, upload: UploadFile):
        self.name = upload.filename or ""
        self.content: bytes = b""


async def _read_spreadsheet(upload: UploadFile) -> pd.DataFrame:
    event = _UploadEvent(upload)
    ext = Path(event.name).suffix.lower()
    if ext not in (".xlsx", ".xlsm"):
        raise HTTPException(status_code=400, detail="The file provided is not a valid type.")

    event.content = await upload.read()
    try:
        return pd.read_excel(BytesIO(event.content))
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Failed to read Excel file.") from exc


def _split_period(period_value: object) -> tuple[int | None, int | None]:
    try:
        numeric_period = float(period_value)
    except (TypeError, ValueError):
        return None, None

    if numeric_period.is_integer():
        return int(numeric_period), None

    return None, int(round(numeric_period * 12))


def _get_or_create_category(
    db: Session,
    name: str,
    is_subcategory: bool,
    user_id: int,
    parent_id: int | None = None,
) -> Category:
    existing = db.query(Category).filter(Category.name == str(name).strip()).first()
    if existing:
        return existing

    category = Category(
        name=str(name).strip(),
        is_subcategory=is_subcategory,
        parent_id=parent_id,
        created_by=user_id,
        modified_by=user_id,
        modified_at=datetime.now(timezone.utc),
    )
    db.add(category)
    db.flush()
    return category


@router.post("/codes")
async def import_codes(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    df = await _read_spreadsheet(file)
    created = 0
    duplicates: list[str] = []
    failed: list[str] = []

    for row_index, row in df.iterrows():
        if pd.isna(row.get("Code")):
            failed.append(f"Row {row_index + 2}: missing Code")
            continue

        code_value = str(row.get("Code")).strip()
        if db.query(RetentionCode).filter(RetentionCode.code == code_value).first():
            duplicates.append(code_value)
            continue

        try:
            category = _get_or_create_category(db, row.get("Category"), False, user.id)
            subcategory = _get_or_create_category(db, row.get("Sub-Category"), True, user.id, category.id)

            m_period = None
            period = None
            fixed_date = None

            if not pd.isna(row.get("Retention Period")):
                period, m_period = _split_period(row.get("Retention Period"))
            elif not pd.isna(row.get("Retention Date")):
                fixed_date = pd.to_datetime(row.get("Retention Date")).date()

            code = RetentionCode(
                category_id=subcategory.id,
                code=code_value,
                name=str(row.get("Name") or "").strip(),
                code_description=str(row.get("Description") or "").strip(),
                period_description=str(row.get("Retention Description") or "").strip(),
                m_period=m_period,
                period=period,
                date=fixed_date,
                created_by=user.id,
                modified_by=user.id,
                modified_at=datetime.now(timezone.utc),
            )
            db.add(code)
            created += 1
        except Exception as exc:
            failed.append(f"Row {row_index + 2} ({code_value}): {exc}")

    db.commit()
    return {"created": created, "duplicates": duplicates, "failed": failed}


@router.post("/locations")
async def import_locations(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    df = await _read_spreadsheet(file)
    created = 0
    duplicates: list[str] = []
    failed: list[str] = []

    for row_index, row in df.iterrows():
        if pd.isna(row.get("Code")):
            failed.append(f"Row {row_index + 2}: missing Code")
            continue

        room_code = str(row.get("Code")).strip()
        if db.query(Location).filter(Location.code == room_code).first():
            duplicates.append(room_code)
            continue

        try:
            location = Location(
                code=room_code,
                description=str(row.get("Description") or "").strip(),
                local_storage=bool(row.get("On Site")),
                created_by=user.id,
                modified_by=user.id,
                modified_at=datetime.now(timezone.utc),
            )
            db.add(location)
            created += 1
        except Exception as exc:
            failed.append(f"Row {row_index + 2} ({room_code}): {exc}")

    db.commit()
    return {"created": created, "duplicates": duplicates, "failed": failed}


def _calc_expiry(code_obj: RetentionCode, start_date: date) -> date | None:
    if code_obj.period == -1:
        return None
    if code_obj.period is not None:
        return start_date + relativedelta(years=code_obj.period)
    if code_obj.date is not None:
        return code_obj.date
    if code_obj.m_period is not None:
        return start_date + relativedelta(months=code_obj.m_period)
    return None


def _next_folder_retention_id(db: Session, folder_code: str, year: int) -> str:
    prefix = f"F{year}-"
    max_id = db.query(func.max(Folder.retention_id)).filter(Folder.retention_id.like(f"{prefix}%")).scalar()
    seq = 1
    if isinstance(max_id, str):
        parts = max_id.split("-")
        if len(parts) > 1 and parts[1].isdigit():
            seq = int(parts[1]) + 1
    return f"F{year}-{seq:04d}-{folder_code}"


@router.post("/folders")
async def import_folders(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    df = await _read_spreadsheet(file)
    retention_ids: list[str] = []
    duplicates: list[str] = []
    failed: list[str] = []

    for row_index, row in df.iterrows():
        if pd.isna(row.get("Code")):
            failed.append(f"Row {row_index + 2}: missing Code")
            continue

        folder_name = row.get("Name")
        folder_code = str(row.get("Code")).strip()
        folder_start = row.get("Start Date")

        if pd.isna(folder_start):
            failed.append(f"Row {row_index + 2} ({folder_code}): missing Start Date")
            continue

        if pd.isna(folder_name):
            failed.append(f"Row {row_index + 2} ({folder_code}): missing Name")
            continue

        try:
            start_date = pd.to_datetime(folder_start).date()
        except (TypeError, ValueError):
            failed.append(f"Row {row_index + 2} ({folder_code}): invalid Start Date")
            continue

        created_date = date.today()
        retention_code = db.query(RetentionCode).filter(RetentionCode.code == folder_code).first()
        if not retention_code:
            failed.append(f"Row {row_index + 2} ({folder_code}): retention code not found")
            continue

        expiry_date = _calc_expiry(retention_code, start_date)
        retention_code_id = retention_code.id

        retention_id = _next_folder_retention_id(db, folder_code, created_date.year)
        if db.query(Folder).filter(Folder.retention_id == retention_id).first():
            duplicates.append(retention_id)
            continue

        folder = Folder(
            retention_id=retention_id,
            retention_code_id=retention_code_id,
            name=str(folder_name).strip(),
            created_date=created_date,
            start_date=start_date,
            expiry_date=expiry_date,
            created_by=user.id,
            modified_by=user.id,
            modified_at=datetime.now(timezone.utc),
        )
        db.add(folder)
        db.flush()
        retention_ids.append(retention_id)

    db.commit()
    return {"created": len(retention_ids), "retention_ids": retention_ids, "duplicates": duplicates, "failed": failed}


def _next_box_code(db: Session, year: int) -> str:
    prefix = f"B{year}-"
    max_code = db.query(func.max(Box.code)).filter(Box.code.like(f"{prefix}%")).scalar()
    seq = 1
    if isinstance(max_code, str):
        parts = max_code.split("-")
        if len(parts) > 1 and parts[1].isdigit():
            seq = int(parts[1]) + 1
    return f"B{year}-{seq:04d}"


@router.post("/boxes")
async def import_boxes(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    df = await _read_spreadsheet(file)
    created_codes: list[str] = []
    duplicates: list[str] = []
    failed: list[str] = []

    for row_index, row in df.iterrows():
        box_name = row.get("Name")
        if pd.isna(box_name):
            failed.append(f"Row {row_index + 2}: missing Name")
            continue

        box_name = str(box_name).strip()
        created_date = date.today()

        retention_ids_raw = row.get("Retention IDs", "")
        retention_ids: list[str] = []
        if not pd.isna(retention_ids_raw) and str(retention_ids_raw).strip():
            retention_ids = [rid.strip() for rid in str(retention_ids_raw).split(",") if rid.strip()]

        existing = db.query(Box).filter(Box.name == box_name).first()
        if existing:
            duplicates.append(box_name)
            continue

        folders_to_assign = db.query(Folder).filter(Folder.retention_id.in_(retention_ids)).all() if retention_ids else []
        expiry_dates = [folder.expiry_date for folder in folders_to_assign if folder.expiry_date is not None]
        expiry_date = max(expiry_dates) if expiry_dates else None

        box_code = _next_box_code(db, created_date.year)
        box = Box(
            code=box_code,
            name=box_name,
            created_date=created_date,
            expiry_date=expiry_date,
            created_by=user.id,
            modified_by=user.id,
            modified_at=datetime.now(timezone.utc),
        )
        db.add(box)
        db.flush()
        created_codes.append(box_code)

        for folder in folders_to_assign:
            folder.box_id = box.id
            folder.modified_by = user.id
            folder.modified_at = datetime.now(timezone.utc)

    db.commit()
    return {"created": len(created_codes), "box_codes": created_codes, "duplicates": duplicates, "failed": failed}
