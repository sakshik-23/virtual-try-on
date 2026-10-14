"""
Spectra Optics - Domain ORM Models
Object-Oriented Data Models implementing ACID relational mapping.
Stores 3D transformation matrices, Pupillary Distance, and product specifications.
"""

from sqlalchemy import Column, String, Integer, Float, Boolean, JSON, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from .database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Product(Base):
    """
    Eyewear Product ORM Model
    Contains real-world millimeter dimensions for 3D scaling.
    """
    __tablename__ = "products"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    sku = Column(String(64), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    brand = Column(String(100), nullable=False)
    price = Column(Float, nullable=False)
    original_price = Column(Float, nullable=False)
    shape = Column(String(50), nullable=False)   # 'wayfarer', 'aviator', etc.
    frame_type = Column(String(50), default="full-rim")
    size = Column(String(20), default="Medium")

    # Millimeter dimensions for true-to-life 3D fit
    lens_width_mm = Column(Integer, nullable=False)
    bridge_width_mm = Column(Integer, nullable=False)
    temple_length_mm = Column(Integer, nullable=False)
    frame_width_mm = Column(Integer, nullable=False)

    # 3D Asset metadata and PBR colors
    available_colors = Column(JSON, nullable=False)
    available_lens_tints = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class FaceProfile(Base):
    """
    User Face Biometrics & Transformation Matrix ORM Model
    Stores 6-DoF transformation matrix and 478 MediaPipe landmarks securely in the database.
    """
    __tablename__ = "face_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_token = Column(String(255), index=True, nullable=False)
    pupillary_distance_mm = Column(Float, nullable=False) # e.g. 63.4 mm
    face_width_mm = Column(Integer, nullable=False)       # e.g. 138 mm
    detected_face_shape = Column(String(50), nullable=False)

    # 6-DoF Transformation Matrix: { translation: {x,y,z}, rotation: {pitch,yaw,roll} }
    transformation_matrix = Column(JSON, nullable=False)
    
    # MediaPipe 478 Dense Landmark Coordinate Array
    facial_landmarks = Column(JSON, nullable=False)

    # Optional captured selfie texture for the Ditto Grid
    selfie_image_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Order(Base):
    """
    E-Commerce Order Model adhering to ACID transactional consistency.
    """
    __tablename__ = "orders"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    customer_email = Column(String(255), nullable=True)
    total_amount = Column(Float, nullable=False)
    pupillary_distance_mm = Column(Float, nullable=False) # Attached directly to optical lens prescription
    order_items = Column(JSON, nullable=False)
    status = Column(String(50), default="CONFIRMED")
    created_at = Column(DateTime, default=datetime.utcnow)

class User(Base):
    """
    User Account Model
    Stores registered user profile and salted password credentials.
    """
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(50), nullable=True)
    password_hash = Column(String(255), nullable=False)
    member_type = Column(String(50), default="Gold Member")
    created_at = Column(DateTime, default=datetime.utcnow)

