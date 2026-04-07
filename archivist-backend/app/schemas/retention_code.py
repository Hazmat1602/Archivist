from datetime import date as DateType
from typing import Optional

from pydantic import BaseModel


class RetentionCodeCreate(BaseModel):
    category_id: int
    code: str
    name: str
    code_description: str
    period_description: str
    period: Optional[int] = None
    m_period: Optional[int] = None
    date: Optional[DateType] = None


class RetentionCodeUpdate(BaseModel):
    name: Optional[str] = None
    code_description: Optional[str] = None
    period_description: Optional[str] = None
    period: Optional[int] = None
    m_period: Optional[int] = None
    date: Optional[DateType] = None


class RetentionCodeRead(BaseModel):
    id: int
    category_id: int
    code: str
    name: str
    code_description: str
    period_description: str
    period: Optional[int]
    m_period: Optional[int]
    date: Optional[DateType]

    model_config = {"from_attributes": True}
