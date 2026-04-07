from datetime import datetime

from pydantic import BaseModel


class ArchiveCreate(BaseModel):
    code: str
    name: str
    address: str | None = None


class ArchiveUpdate(BaseModel):
    code: str | None = None
    name: str | None = None
    address: str | None = None


class ArchiveRead(BaseModel):
    id: int
    code: str
    name: str
    address: str | None
    created_by: int | None = None
    modified_by: int | None = None
    modified_at: datetime | None = None

    model_config = {"from_attributes": True}
