from datetime import date, datetime

from pydantic import BaseModel


class FolderCreate(BaseModel):
    code: str
    name: str
    start_date: date
    box_id: int | None = None


class FolderUpdate(BaseModel):
    name: str | None = None
    start_date: date | None = None
    expiry_date: date | None = None
    box_id: int | None = None


class FolderRead(BaseModel):
    id: int
    retention_id: str
    code: str
    name: str
    created_date: date
    start_date: date
    expiry_date: date | None
    box_id: int | None
    retention_code_id: int | None
    created_by: int | None = None
    modified_by: int | None = None
    modified_at: datetime | None = None

    model_config = {"from_attributes": True}
