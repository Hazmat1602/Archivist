"""Database engine and session configuration for SQL Server via pyodbc."""
from dotenv import load_dotenv
load_dotenv() # Load .env for SQL Server Information

import os
from urllib.parse import quote_plus

from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.exc import DBAPIError

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

def ensure_database_exists(database_url: str) -> None:
    """Create the target SQL Server database when it is missing."""
    url = make_url(database_url)

    # Only applicable to SQL Server URLs with an explicit database name.
    if not url.drivername.startswith("mssql") or not url.database:
        return

    master_url = url.set(database="master")
    safe_db_name = url.database.replace("]", "]]")
    safe_db_literal = url.database.replace("'", "''")

    with create_engine(master_url, isolation_level="AUTOCOMMIT").connect() as connection:
        connection.execute(
            text(f"IF DB_ID(N'{safe_db_literal}') IS NULL CREATE DATABASE [{safe_db_name}]")
        )


def build_engine(database_url: str):
    """Build the app engine and create the database on first-run when required."""
    engine = create_engine(database_url)
    url = make_url(database_url)

    if not url.drivername.startswith("mssql") or not url.database:
        return engine

    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except DBAPIError as exc:
        if "Cannot open database" not in str(exc):
            raise
        ensure_database_exists(database_url)
        engine.dispose()
        engine = create_engine(database_url)

    return engine


engine = build_engine(DATABASE_URL)

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
