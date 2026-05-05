from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session
from sqlalchemy.schema import CreateColumn

from app.auth import hash_password
from app.database import Base, engine
from app.models import Archive, Box, Category, Folder, Location, RetentionCode, User  # noqa: F401
from app.routes import (
    auth_router,
    archives_router,
    boxes_router,
    categories_router,
    codes_router,
    folders_router,
    locations_router,
    stats_router,
    imports_router,
    users_router,
    labels_router,
    admin_router,
)

app = FastAPI(title="Archivist API", version="1.0.0")

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)


def sync_table_structure() -> None:
    """Create missing tables and append missing columns without dropping data."""
    inspector = inspect(engine)

    for table in Base.metadata.sorted_tables:
        table.create(bind=engine, checkfirst=True)

        existing_columns = {column["name"] for column in inspector.get_columns(table.name)}
        for column in table.columns:
            if column.name in existing_columns:
                continue

            compiled_column = CreateColumn(column).compile(dialect=engine.dialect)
            safe_table_name = table.name.replace("]", "]]" )
            with engine.begin() as conn:
                conn.execute(
                    text(f"ALTER TABLE [{safe_table_name}] ADD {compiled_column}")
                    )

@app.on_event("startup")
def on_startup():
    try:
        sync_table_structure()
        
        with Session(engine) as session:
            admin_user = session.query(User).filter(User.username == "admin").first()
            if not admin_user:
                session.add(
                    User(
                        username="admin",
                        email="admin@archivist.local",
                        hashed_password=hash_password("admin"),
                        full_name="Administrator",
                        is_active=True,
                        is_admin=True,
                        password_temporary=False,
                    )
                )
                session.commit()
    except Exception:
        # Connection may not be available at import time (e.g. during CI);
        # tables will be created on first successful connection.
        pass

# Register routers
app.include_router(auth_router, prefix="/api")
app.include_router(categories_router, prefix="/api")
app.include_router(codes_router, prefix="/api")
app.include_router(locations_router, prefix="/api")
app.include_router(archives_router, prefix="/api")
app.include_router(boxes_router, prefix="/api")
app.include_router(folders_router, prefix="/api")
app.include_router(stats_router, prefix="/api")
app.include_router(imports_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(labels_router, prefix="/api")
app.include_router(admin_router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok"}
