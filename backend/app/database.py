"""
Spectra Optics - Database Engine Configuration
ACID-Compliant Relational Data Layer supporting PostgreSQL and SQLite fallback.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# 1. Fetch DATABASE_URL from environment or fallback to SQLite
# Default SQLite allows running out-of-the-box without requiring PostgreSQL installation.
DEFAULT_SQLITE_URL = "sqlite:///./virtual_tryon.db"
DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_SQLITE_URL)

# Some cloud providers (Supabase, Neon, Render) output postgres:// instead of postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# SQLite concurrency configuration
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# 2. Connection Engine
engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

# 3. Session Maker for ACID Transactions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. Declarative Base for ORM Models
Base = declarative_base()

def get_db():
    """
    Dependency generator providing an isolated atomic database session per request.
    Automatically closes session after completion.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
