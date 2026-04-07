from datetime import datetime

from pydantic import BaseModel


class LocationCreate(BaseModel):
    code: str
    description: str
    local_storage: bool = True


class LocationUpdate(BaseModel):
    code: str | None = None
    description: str | None = None
    local_storage: bool | None = None


class LocationRead(BaseModel):
    id: int
    code: str
    description: str
    local_storage: bool
    created_by: int | None = None
    modified_by: int | None = None
    modified_at: datetime | None = None

    model_config = {"from_attributes": True}
