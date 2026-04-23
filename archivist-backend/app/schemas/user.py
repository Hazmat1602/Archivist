from datetime import datetime

from pydantic import BaseModel


class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: str | None = None


class UserLogin(BaseModel):
    username: str
    password: str


class UserRead(BaseModel):
    id: int
    username: str
    email: str
    full_name: str | None
    is_active: bool
    is_admin: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserAdminCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: str | None = None
    is_active: bool = True
    is_admin: bool = False


class UserAdminUpdate(BaseModel):
    email: str | None = None
    full_name: str | None = None
    is_active: bool | None = None
    is_admin: bool | None = None
    password: str | None = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead
