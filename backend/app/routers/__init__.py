from .catalog import router as catalog_router
from .tryon import router as tryon_router
from .auth import router as auth_router

__all__ = ["catalog_router", "tryon_router", "auth_router"]
