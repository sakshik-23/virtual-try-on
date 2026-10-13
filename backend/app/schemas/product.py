"""
Pydantic schemas for Eyewear Products
Validates physical dimensions, styling, and pricing.
"""

from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime

class ProductBase(BaseModel):
    sku: str
    name: str
    brand: str
    price: float
    original_price: float
    shape: str
    frame_type: str = "full-rim"
    size: str = "Medium"
    description: Optional[str] = None
    lens_width_mm: int
    bridge_width_mm: int
    temple_length_mm: int
    frame_width_mm: int
    image: Optional[str] = None
    front_image: Optional[str] = None
    available_colors: List[Dict[str, Any]] = []
    available_lens_tints: List[Dict[str, Any]] = []
    recommended_face_shapes: List[str] = []

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
