from sqlalchemy import Column, Date, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class Folder(Base):
    __tablename__ = "folders"

    id = Column(Integer, primary_key=True, index=True)
    retention_id = Column(String, nullable=False, unique=True)
    code = Column(String, nullable=False)
    name = Column(String, nullable=False)
    created_date = Column(Date, nullable=False)
    start_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=True)
    box_id = Column(Integer, ForeignKey("boxes.id"), nullable=True)
    retention_code_id = Column(Integer, ForeignKey("retention_codes.id"), nullable=True)

    box = relationship("Box", back_populates="folders")
    retention_code = relationship("RetentionCode", back_populates="folders")
