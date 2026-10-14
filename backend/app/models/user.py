"""
Spectra Optics - User Account & Authentication ORM Model
Stores registered user identities, encrypted credentials, and profile metrics.
"""

from sqlalchemy import Column, String, DateTime
from datetime import datetime
import uuid

from ..database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    """
    User Account Table
    Stores user credentials (salted hash), profile details, and membership type.
    """
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(50), nullable=True)
    password_hash = Column(String(255), nullable=False)
    member_type = Column(String(50), default="Gold Member")
    created_at = Column(DateTime, default=datetime.utcnow)
