from sqlalchemy import Boolean, Column, Integer, String

from app.database import Base


class Category(Base):
    __tablename__ = "RetentionCategory"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    is_subcategory = Column("subCategory", Boolean, default=False, nullable=False)
    parent_id = Column("parentCategory", Integer, nullable=True)
