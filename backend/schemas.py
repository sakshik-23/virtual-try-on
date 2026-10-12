"""
Spectra Optics - Pydantic DTO Schemas
Implements strict validation for incoming requests and outgoing responses.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ProductBase(BaseModel):
    sku: str
    name: str
    brand: str
    price: float
    original_price: float
    shape: str
    frame_type: str = "full-rim"
    size: str = "Medium"
    lens_width_mm: int
    bridge_width_mm: int
    temple_length_mm: int
    frame_width_mm: int
    available_colors: List[Dict[str, Any]]
    available_lens_tints: List[Dict[str, Any]]

class ProductResponse(ProductBase):
    id: str

    class Config:
        orm_mode = True

class FaceProfileCreate(BaseModel):
    session_token: str
    pupillary_distance_mm: float
    face_width_mm: int
    detected_face_shape: str
    transformation_matrix: Dict[str, Any]
    facial_landmarks: List[Any]
    selfie_image_url: Optional[str] = None

class FaceProfileResponse(BaseModel):
    id: str
    session_token: str
    pupillary_distance_mm: float
    detected_face_shape: str

    class Config:
        orm_mode = True

class OrderCreate(BaseModel):
    customer_email: Optional[str] = None
    total_amount: float
    pupillary_distance_mm: float
    order_items: List[Dict[str, Any]]
