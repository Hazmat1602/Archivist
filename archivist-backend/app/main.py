from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

@app.on_event("startup")
def on_startup():
    try:
        Folder.__table__.create(bind=engine, checkfirst=True)
        Box.__table__.create(bind=engine, checkfirst=True)
        Location.__table__.create(bind=engine, checkfirst=True)
        RetentionCode.__table__.create(bind=engine, checkfirst=True)
        Category.__table__.create(bind=engine, checkfirst=True)
        Location.__table__.create(bind=engine, checkfirst=True)
        Archive.__table__.create(bind=engine, checkfirst=True)
        User.__table__.create(bind=engine, checkfirst=True)
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
