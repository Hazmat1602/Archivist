from sqlalchemy import Column, Date, Integer, String

from app.database import Base


class RetentionCode(Base):
    __tablename__ = "RetentionCodes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    category_id = Column("categoryId", Integer, nullable=False)
    code = Column(String, nullable=False)
    name = Column(String, nullable=False)
    code_description = Column("codeDescription", String, nullable=False)
    period_description = Column("periodDescription", String, nullable=False)
    period = Column(Integer, nullable=True)       # years; -1 = permanent
    m_period = Column("mPeriod", Integer, nullable=True)      # months
    date = Column(Date, nullable=True)             # fixed expiry date
