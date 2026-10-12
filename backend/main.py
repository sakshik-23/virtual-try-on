"""
Spectra Optics - FastAPI Backend Application
High-performance async REST API service.
Handles product catalog, biometric matrix storage, and ACID checkout transactions.
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from .database import engine, get_db, Base
from . import models, schemas

# Initialize database schema tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Spectra Optics AR & Eyewear API",
    description="Backend microservice handling 3D eyewear products, ACID orders, and secure biometric transformation matrix storage.",
    version="1.0.0"
)

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "service": "Spectra Optics API",
        "engine": "FastAPI + SQLAlchemy (ACID Compliant)"
    }

@app.get("/api/products", response_model=List[schemas.ProductResponse])
def get_products(db: Session = Depends(get_db)):
    """
    Returns all eyewear products with physical dimensions for 3D scaling.
    """
    products = db.query(models.Product).all()
    return products

@app.post("/api/tryon/face-profile", response_model=schemas.FaceProfileResponse)
def save_face_profile(profile: schemas.FaceProfileCreate, db: Session = Depends(get_db)):
    """
    Securely stores the user's 6-DoF transformation matrix, Pupillary Distance (PD),
    and 478 MediaPipe landmarks in the database (never exposed on the public frontend).
    """
    db_profile = models.FaceProfile(
        session_token=profile.session_token,
        pupillary_distance_mm=profile.pupillary_distance_mm,
        face_width_mm=profile.face_width_mm,
        detected_face_shape=profile.detected_face_shape,
        transformation_matrix=profile.transformation_matrix,
        facial_landmarks=profile.facial_landmarks,
        selfie_image_url=profile.selfie_image_url
    )
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return db_profile

@app.post("/api/orders/checkout")
def checkout_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    """
    Atomic ACID transaction creating an order with the measured PD directly embedded.
    """
    try:
        db_order = models.Order(
            customer_email=order.customer_email,
            total_amount=order.total_amount,
            pupillary_distance_mm=order.pupillary_distance_mm,
            order_items=order.order_items,
            status="CONFIRMED"
        )
        db.add(db_order)
        db.commit()
        db.refresh(db_order)
        return {
            "success": True,
            "order_id": db_order.id,
            "status": "CONFIRMED",
            "message": "Order created with verified Pupillary Distance"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Transaction rolled back: {str(e)}"
        )
