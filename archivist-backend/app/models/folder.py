from sqlalchemy import Column, Date, Integer, String

from app.database import Base


class Folder(Base):
    __tablename__ = "Folders"

    id = Column(Integer, primary_key=True, autoincrement=True)
    # "code" DB column stores the auto-generated retention ID string (e.g. F2026-0001-HR01)
    retention_id = Column("code", String, nullable=False)
    # "retentionId" DB column is FK to RetentionCodes.id
    retention_code_id = Column("retentionId", Integer, nullable=False)
    name = Column(String, nullable=False)
    created_date = Column("createdDate", Date, nullable=False)
    start_date = Column("startDate", Date, nullable=False)
    expiry_date = Column("expiryDate", Date, nullable=True)
    box_id = Column("boxId", Integer, nullable=True)
    destruction_id = Column("destructionId", Integer, nullable=True)
    department_id = Column("departmentId", Integer, nullable=True)
