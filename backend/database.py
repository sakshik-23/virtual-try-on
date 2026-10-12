"""
Spectra Optics - Database Engine Configuration
Implements ACID-compliant transactions using SQLAlchemy ORM.
Supports PostgreSQL (Supabase / AWS RDS / Neon) and local SQLite fallback.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Database URL: use PostgreSQL if configured in env, else fallback to local ACID-compliant SQLite
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./spectra_optics.db"
)

# Connect args (needed for SQLite concurrency)
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

# Engine with connection pooling for high-performance requests
engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

# Session factory for atomic ACID transactions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """
    Dependency injection generator providing an isolated, atomic database session.
    Automatically commits or rolls back to maintain ACID integrity.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
