from sqlalchemy import Column, Date, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class Box(Base):
    __tablename__ = "boxes"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, nullable=False, unique=True)
    name = Column(String, nullable=True)
    created_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    archive_id = Column(Integer, ForeignKey("archives.id"), nullable=True)

    location = relationship("Location", back_populates="boxes")
    archive = relationship("Archive", back_populates="boxes")
    folders = relationship("Folder", back_populates="box")
