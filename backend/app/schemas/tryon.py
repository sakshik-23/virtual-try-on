"""
Pydantic schemas for Biometric Face Profiles and Orders
Validates 6-DoF transformation matrix and 478 MediaPipe landmarks.
"""

from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime

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
    face_width_mm: int
    detected_face_shape: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class OrderCreate(BaseModel):
    customer_email: Optional[str] = None
    total_amount: float
    pupillary_distance_mm: float
    order_items: List[Dict[str, Any]]

class OrderResponse(BaseModel):
    id: str
    customer_email: Optional[str] = None
    total_amount: float
    pupillary_distance_mm: float
    status: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
