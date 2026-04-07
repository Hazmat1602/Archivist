from sqlalchemy import Boolean, Column, DateTime, Integer, String

from app.database import Base


class Category(Base):
    __tablename__ = "RetentionCategory"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    is_subcategory = Column("subCategory", Boolean, default=False, nullable=False)
    parent_id = Column("parentCategory", Integer, nullable=True)
    created_by = Column("createdBy", Integer, nullable=True)
    modified_by = Column("modifiedBy", Integer, nullable=True)
    modified_at = Column("modifiedAt", DateTime, nullable=True)
