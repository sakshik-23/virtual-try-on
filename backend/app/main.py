"""
Spectra Optics - FastAPI Main Application
High-performance REST API service for Virtual Try-On, 3D Eyewear, and Biometric Storage.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
from .routers import catalog_router, tryon_router
from .models import product, tryon_session  # Ensure models are loaded into Base metadata

# Auto-create all relational tables on startup (PostgreSQL or SQLite)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Spectra Optics AR & Eyewear API",
    description="Backend microservice managing 3D eyewear specs, ACID checkout, and 6-DoF facial transformation matrix storage.",
    version="2.0.0"
)

# CORS Middleware (allows Vite React frontend on port 5173 to communicate seamlessly)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(catalog_router)
app.include_router(tryon_router)

@app.get("/")
def root():
    return {
        "service": "Spectra Optics Virtual Try-On API",
        "status": "online",
        "version": "2.0.0",
        "docs_url": "/docs",
        "database": str(engine.url)
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "engine": "FastAPI + SQLAlchemy",
        "acid_compliance": True
    }
