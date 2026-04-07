from sqlalchemy import Column, Date, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class RetentionCode(Base):
    __tablename__ = "retention_codes"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    code = Column(String, nullable=False, index=True)
    name = Column(String, nullable=False)
    code_description = Column(String, nullable=False)
    period_description = Column(String, nullable=False)
    period = Column(Integer, nullable=True)       # years; -1 = permanent
    m_period = Column(Integer, nullable=True)      # months
    date = Column(Date, nullable=True)             # fixed expiry date

    category = relationship("Category", back_populates="codes")
    folders = relationship("Folder", back_populates="retention_code")
