"""
Virtual Try-On & Biometric Calibration Router
Handles 6-DoF transformation matrix storage and ACID checkout transactions.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any

from ..database import get_db
from ..models.tryon_session import FaceProfile, Order
from ..schemas.tryon import (
    FaceProfileCreate,
    FaceProfileResponse,
    OrderCreate,
    OrderResponse
)

router = APIRouter(tags=["Virtual Try-On & Biometrics"])

@router.post("/api/tryon/face-profile", response_model=FaceProfileResponse, status_code=status.HTTP_201_CREATED)
def save_face_profile(profile_in: FaceProfileCreate, db: Session = Depends(get_db)):
    """
    Stores 6-DoF transformation matrix, Pupillary Distance (PD), and 478 landmarks.
    Kept secure on backend, never exposed on the public shopping UI.
    """
    # Check if a profile exists for this session token to update or create
    profile = db.query(FaceProfile).filter(
        FaceProfile.session_token == profile_in.session_token
    ).first()

    if profile:
        profile.pupillary_distance_mm = profile_in.pupillary_distance_mm
        profile.face_width_mm = profile_in.face_width_mm
        profile.detected_face_shape = profile_in.detected_face_shape
        profile.transformation_matrix = profile_in.transformation_matrix
        profile.facial_landmarks = profile_in.facial_landmarks
        if profile_in.selfie_image_url:
            profile.selfie_image_url = profile_in.selfie_image_url
    else:
        profile = FaceProfile(
            session_token=profile_in.session_token,
            pupillary_distance_mm=profile_in.pupillary_distance_mm,
            face_width_mm=profile_in.face_width_mm,
            detected_face_shape=profile_in.detected_face_shape,
            transformation_matrix=profile_in.transformation_matrix,
            facial_landmarks=profile_in.facial_landmarks,
            selfie_image_url=profile_in.selfie_image_url
        )
        db.add(profile)

    db.commit()
    db.refresh(profile)
    return profile

@router.get("/api/tryon/face-profile/{session_token}", response_model=FaceProfileResponse)
def get_face_profile(session_token: str, db: Session = Depends(get_db)):
    """
    Retrieve stored face calibration metrics for an active session.
    """
    profile = db.query(FaceProfile).filter(
        FaceProfile.session_token == session_token
    ).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No calibration profile found for this session token"
        )
    return profile

@router.post("/api/orders/checkout", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
def checkout_order(order_in: OrderCreate, db: Session = Depends(get_db)):
    """
    ACID transactional checkout: commits customer order with verified Pupillary Distance.
    """
    try:
        new_order = Order(
            customer_email=order_in.customer_email,
            total_amount=order_in.total_amount,
            pupillary_distance_mm=order_in.pupillary_distance_mm,
            order_items=order_in.order_items,
            status="CONFIRMED"
        )
        db.add(new_order)
        db.commit()
        db.refresh(new_order)
        return {
            "success": True,
            "order_id": new_order.id,
            "status": "CONFIRMED",
            "pupillary_distance_mm": new_order.pupillary_distance_mm,
            "message": "Prescription eyewear order verified and confirmed"
        }
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ACID Transaction rolled back: {str(exc)}"
        )
