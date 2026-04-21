from app.routes.auth import router as auth_router
from app.routes.categories import router as categories_router
from app.routes.retention_codes import router as codes_router
from app.routes.locations import router as locations_router
from app.routes.archives import router as archives_router
from app.routes.boxes import router as boxes_router
from app.routes.folders import router as folders_router
from app.routes.stats import router as stats_router
from app.routes.imports import router as imports_router

__all__ = [
    "auth_router",
    "categories_router",
    "codes_router",
    "locations_router",
    "archives_router",
    "boxes_router",
    "folders_router",
    "stats_router",
    "imports_router",
]
