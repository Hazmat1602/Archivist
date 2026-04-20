from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models.location import Location
from app.models.user import User
from app.schemas.location import LocationCreate, LocationRead, LocationUpdate

router = APIRouter(prefix="/locations", tags=["locations"])


@router.get("/", response_model=list[LocationRead])
def list_locations(
    offset: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    return db.query(Location).order_by(Location.id).offset(offset).limit(limit).all()


@router.get("/{location_id}", response_model=LocationRead)
def get_location(location_id: int, db: Session = Depends(get_db), _user: User = Depends(get_current_user)):
    loc = db.get(Location, location_id)
    if not loc:
        raise HTTPException(404, "Location not found")
    return loc


@router.post("/", response_model=LocationRead, status_code=201)
def create_location(body: LocationCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    loc = Location(**body.model_dump(), created_by=user.id)
    db.add(loc)
    db.commit()
    db.refresh(loc)
    return loc


@router.patch("/{location_id}", response_model=LocationRead)
def update_location(location_id: int, body: LocationUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    loc = db.get(Location, location_id)
    if not loc:
        raise HTTPException(404, "Location not found")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(loc, key, value)
    loc.modified_by = user.id
    loc.modified_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(loc)
    return loc


@router.delete("/{location_id}", status_code=204)
def delete_location(location_id: int, db: Session = Depends(get_db), _user: User = Depends(get_current_user)):
    loc = db.get(Location, location_id)
    if not loc:
        raise HTTPException(404, "Location not found")
    db.delete(loc)
    db.commit()
