"""
Spectra Optics - Database Engine Configuration
ACID-Compliant Relational Data Layer supporting PostgreSQL and SQLite fallback.
"""

import os
import re
import urllib.parse
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# 1. Load variables from .env file
load_dotenv()

def normalize_db_url(url: str) -> str:
    """
    Normalizes database connection string:
    - Automatically maps PostgreSQL drivers (psycopg2)
    - Safely URL-encodes special characters in passwords (e.g. '@' -> '%40')
    - Falls back to local SQLite if unspecified
    """
    if not url:
        return "sqlite:///./virtual_tryon.db"
    
    # Cloud providers like Supabase/Neon output postgres://
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+psycopg2://", 1)
    elif url.startswith("postgresql://") and "+psycopg2" not in url:
        url = url.replace("postgresql://", "postgresql+psycopg2://", 1)

    # Safely encode '@' in passwords if present (e.g., postgres:Admin@123@localhost:5432)
    pattern = r"^(postgresql\+psycopg2:\/\/)([^:]+):(.*)@([^@\/]+(?::\d+)?\/.*)$"
    match = re.match(pattern, url)
    if match:
        proto, user, password, host_part = match.groups()
        if "@" in password and "%40" not in password:
            quoted_pw = urllib.parse.quote_plus(password)
            url = f"{proto}{user}:{quoted_pw}@{host_part}"

    return url

RAW_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./virtual_tryon.db")
DATABASE_URL = normalize_db_url(RAW_DATABASE_URL)

# SQLite concurrency configuration
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# 2. Connection Engine with automatic failover
try:
    engine = create_engine(
        DATABASE_URL,
        connect_args=connect_args,
        pool_pre_ping=True
    )
except Exception as err:
    print(f"[Database Warning] Failed connecting to {DATABASE_URL}: {err}")
    print("[Database Fallback] Falling back to local SQLite engine: sqlite:///./virtual_tryon.db")
    DATABASE_URL = "sqlite:///./virtual_tryon.db"
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
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
