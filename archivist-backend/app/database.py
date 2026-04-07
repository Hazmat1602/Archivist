"""Database engine and session configuration for SQL Server via pyodbc."""

import os
from urllib.parse import quote_plus

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# SQL Server connection settings from environment variables
DB_SERVER = os.environ.get("DB_SERVER", "localhost")
DB_NAME = os.environ.get("DB_NAME", "Archivist")
DB_USERNAME = os.environ.get("DB_USERNAME", "sa")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "")
DB_DRIVER = os.environ.get("DB_DRIVER", "ODBC Driver 18 for SQL Server")
DB_ENCRYPT = os.environ.get("DB_ENCRYPT", "Optional")
DB_TRUST_CERT = os.environ.get("DB_TRUST_CERT", "Yes")

# Allow a full DATABASE_URL override for flexibility
_DEFAULT_URL = (
    f"mssql+pyodbc://{quote_plus(DB_USERNAME)}:{quote_plus(DB_PASSWORD)}"
    f"@{DB_SERVER}/{DB_NAME}"
    f"?driver={quote_plus(DB_DRIVER)}"
    f"&Encrypt={quote_plus(DB_ENCRYPT)}"
    f"&TrustServerCertificate={quote_plus(DB_TRUST_CERT)}"
)
DATABASE_URL = os.environ.get("DATABASE_URL", _DEFAULT_URL)

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """FastAPI dependency that yields a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
