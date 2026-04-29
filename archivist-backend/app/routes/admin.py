from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.archive import Archive
from app.models.box import Box
from app.models.category import Category
from app.models.folder import Folder
from app.models.location import Location
from app.models.retention_code import RetentionCode
from app.models.user import User
from app.routes.users import require_admin

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/clear-database")
def clear_database(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    db.query(Folder).delete(synchronize_session=False)
    db.query(Box).delete(synchronize_session=False)
    db.query(RetentionCode).delete(synchronize_session=False)
    db.query(Category).delete(synchronize_session=False)
    db.query(Location).delete(synchronize_session=False)
    db.query(Archive).delete(synchronize_session=False)
    db.commit()
    return {"status": "ok"}
