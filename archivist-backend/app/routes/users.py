from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import get_current_user, hash_password
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserAdminCreate, UserAdminUpdate, UserRead

router = APIRouter(prefix="/users", tags=["users"])


def _active_admin_count(db: Session) -> int:
    return db.query(func.count(User.id)).filter(User.is_admin.is_(True), User.is_active.is_(True)).scalar() or 0


def _would_remove_last_active_admin(target: User, changes: dict[str, object]) -> bool:
    is_admin_after = bool(changes.get("is_admin", target.is_admin))
    is_active_after = bool(changes.get("is_active", target.is_active))
    return target.is_admin and target.is_active and (not is_admin_after or not is_active_after)


def require_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user


@router.get("/", response_model=list[UserRead])
def list_users(
    offset: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    return db.query(User).order_by(User.id).offset(offset).limit(limit).all()


@router.post("/", response_model=UserRead, status_code=201)
def create_user(
    body: UserAdminCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    if db.query(User).filter(User.username == body.username).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "Username already taken")
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")

    user = User(
        username=body.username,
        email=body.email,
        hashed_password=hash_password(body.password),
        full_name=body.full_name,
        is_active=body.is_active,
        is_admin=body.is_admin,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}", response_model=UserRead)
def update_user(
    user_id: int,
    body: UserAdminUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    changes = body.model_dump(exclude_unset=True)

    if "email" in changes and changes["email"] != user.email:
        if db.query(User).filter(User.email == changes["email"], User.id != user_id).first():
            raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")

    if _would_remove_last_active_admin(user, changes) and _active_admin_count(db) <= 1:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "At least one active admin account is required",
        )

    password = changes.pop("password", None)
    for key, value in changes.items():
        setattr(user, key, value)

    if password:
        user.hashed_password = hash_password(password)

    if current_admin.id == user.id and not user.is_admin:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "You cannot remove your own admin access")

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    if user.id == current_admin.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "You cannot delete your own account")
    if user.is_admin and user.is_active and _active_admin_count(db) <= 1:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "At least one active admin account is required",
        )

    db.delete(user)
    db.commit()
