from datetime import datetime

from pydantic import BaseModel


class CategoryCreate(BaseModel):
    name: str
    is_subcategory: bool = False
    parent_id: int | None = None


class CategoryRead(BaseModel):
    id: int
    name: str
    is_subcategory: bool
    parent_id: int | None
    created_by: int | None = None
    modified_by: int | None = None
    modified_at: datetime | None = None

    model_config = {"from_attributes": True}
