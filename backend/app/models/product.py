"""
Eyewear Product ORM Model
Stores physical dimensions (mm), 3D asset metadata, and material finishes.
"""

from sqlalchemy import Column, String, Integer, Float, JSON, DateTime, Text
from datetime import datetime
import uuid

from ..database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Product(Base):
    __tablename__ = "products"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    sku = Column(String(64), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    brand = Column(String(100), nullable=False)
    price = Column(Float, nullable=False)
    original_price = Column(Float, nullable=False)
    shape = Column(String(50), nullable=False)        # 'wayfarer', 'round', 'cat-eye', 'rectangle'
    frame_type = Column(String(50), default="full-rim") # 'full-rim', 'rimless'
    size = Column(String(20), default="Medium")        # 'Narrow', 'Medium', 'Wide'
    description = Column(Text, nullable=True)

    # Physical Millimeter dimensions for realistic 3D face mesh scaling
    lens_width_mm = Column(Integer, nullable=False)
    bridge_width_mm = Column(Integer, nullable=False)
    temple_length_mm = Column(Integer, nullable=False)
    frame_width_mm = Column(Integer, nullable=False)

    # Visual assets & PBR materials
    image = Column(String(255), nullable=True)
    front_image = Column(String(255), nullable=True)
    available_colors = Column(JSON, nullable=False, default=list)
    available_lens_tints = Column(JSON, nullable=False, default=list)
    recommended_face_shapes = Column(JSON, nullable=False, default=list)

    created_at = Column(DateTime, default=datetime.utcnow)
