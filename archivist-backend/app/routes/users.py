from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserListRead

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=list[UserListRead])
def list_users(
    offset: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    users = db.query(User).order_by(User.id).offset(offset).limit(limit).all()
    return [{"id": user.id, "username": user.username} for user in users]
