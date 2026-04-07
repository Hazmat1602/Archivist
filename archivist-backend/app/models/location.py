from sqlalchemy import Boolean, Column, Integer, String

from app.database import Base


class Location(Base):
    __tablename__ = "Locations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String, nullable=False)
    description = Column("desc", String, nullable=False)
    local_storage = Column(Boolean, default=True, nullable=False)
