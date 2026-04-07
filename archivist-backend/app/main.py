from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.models import Archive, Box, Category, Folder, Location, RetentionCode  # noqa: F401
from app.routes import (
    archives_router,
    boxes_router,
    categories_router,
    codes_router,
    folders_router,
    locations_router,
    stats_router,
)

app = FastAPI(title="Archivist API", version="2.0.0")

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Only create the Archives table if it doesn't exist (new table).
# All other tables already exist in the SQL Server database.
Archive.__table__.create(bind=engine, checkfirst=True)

# Register routers
app.include_router(categories_router, prefix="/api")
app.include_router(codes_router, prefix="/api")
app.include_router(locations_router, prefix="/api")
app.include_router(archives_router, prefix="/api")
app.include_router(boxes_router, prefix="/api")
app.include_router(folders_router, prefix="/api")
app.include_router(stats_router, prefix="/api")


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}
