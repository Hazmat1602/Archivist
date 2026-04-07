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

    model_config = {"from_attributes": True}
