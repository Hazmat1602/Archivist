from sqlalchemy import Boolean, Column, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, nullable=False, unique=True)
    description = Column(String, nullable=False)
    local_storage = Column(Boolean, default=True, nullable=False)

    boxes = relationship("Box", back_populates="location")
