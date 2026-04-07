from sqlalchemy import Column, DateTime, Integer, String

from app.database import Base


class Archive(Base):
    __tablename__ = "Archives"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String, nullable=False)
    name = Column(String, nullable=False)
    address = Column(String, nullable=True)
    created_by = Column("createdBy", Integer, nullable=True)
    modified_by = Column("modifiedBy", Integer, nullable=True)
    modified_at = Column("modifiedAt", DateTime, nullable=True)
