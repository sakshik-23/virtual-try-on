"""
Try-On Session, Biometric Face Profile, and Order Models
Stores 6-DoF transformation matrices, Pupillary Distance (PD), and facial landmarks.
"""

from sqlalchemy import Column, String, Integer, Float, JSON, DateTime, Text
from datetime import datetime
import uuid

from ..database import Base

def generate_uuid():
    return str(uuid.uuid4())

class FaceProfile(Base):
    """
    Biometric profile holding real-time 3D camera calibration data.
    Stores estimated PD, face shape, and 6-DoF matrix in the database.
    """
    __tablename__ = "face_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_token = Column(String(255), index=True, nullable=False)
    pupillary_distance_mm = Column(Float, nullable=False)   # e.g., 63.5 mm
    face_width_mm = Column(Integer, nullable=False)         # e.g., 138 mm
    detected_face_shape = Column(String(50), nullable=False)# 'Oval', 'Square', etc.

    # 6-Degrees-of-Freedom transformation: {translation: {x,y,z}, rotation: {pitch,yaw,roll}}
    transformation_matrix = Column(JSON, nullable=False)

    # 478 MediaPipe 3D Landmark array
    facial_landmarks = Column(JSON, nullable=False)

    # Selfie capture URL or base64 preview
    selfie_image_url = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

class Order(Base):
    """
    ACID transactional Order model embedding user's prescription pupillary distance.
    """
    __tablename__ = "orders"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    customer_email = Column(String(255), nullable=True)
    total_amount = Column(Float, nullable=False)
    pupillary_distance_mm = Column(Float, nullable=False)
    order_items = Column(JSON, nullable=False)
    status = Column(String(50), default="CONFIRMED")
    created_at = Column(DateTime, default=datetime.utcnow)
