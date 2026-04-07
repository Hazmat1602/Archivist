from sqlalchemy import Column, Integer, String

from app.database import Base


class Archive(Base):
    __tablename__ = "Archives"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String, nullable=False)
    name = Column(String, nullable=False)
    address = Column(String, nullable=True)
