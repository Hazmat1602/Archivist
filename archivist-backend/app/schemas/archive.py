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

    model_config = {"from_attributes": True}
