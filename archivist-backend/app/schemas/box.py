from datetime import date

from pydantic import BaseModel


class BoxCreate(BaseModel):
    name: str
    location_id: int | None = None
    expiry_date: date | None = None


class BoxUpdate(BaseModel):
    name: str | None = None
    location_id: int | None = None
    archive_id: int | None = None
    expiry_date: date | None = None


class BoxRead(BaseModel):
    id: int
    code: str
    name: str | None
    created_date: date
    expiry_date: date | None
    location_id: int | None
    archive_id: int | None
    folder_count: int = 0

    model_config = {"from_attributes": True}
