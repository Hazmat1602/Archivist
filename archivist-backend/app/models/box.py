from sqlalchemy import Column, Date, DateTime, Integer, String

from app.database import Base


class Box(Base):
    __tablename__ = "Boxes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String, nullable=False)
    name = Column(String, nullable=True)
    created_date = Column("createdDate", Date, nullable=False)
    expiry_date = Column("expiryDate", Date, nullable=True)
    location_id = Column("locationId", Integer, nullable=True)
    archive_id = Column("archiveId", Integer, nullable=True)
    created_by = Column("createdBy", Integer, nullable=True)
    modified_by = Column("modifiedBy", Integer, nullable=True)
    modified_at = Column("modifiedAt", DateTime, nullable=True)
