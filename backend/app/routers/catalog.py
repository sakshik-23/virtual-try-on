"""
Product Catalog Router
Serves eyewear catalog with precise millimeter frame specs.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models.product import Product
from ..schemas.product import ProductResponse, ProductCreate

router = APIRouter(prefix="/api/products", tags=["Product Catalog"])

@router.get("", response_model=List[ProductResponse])
def list_products(
    shape: Optional[str] = Query(None, description="Filter by frame shape (e.g., wayfarer, round)"),
    size: Optional[str] = Query(None, description="Filter by frame size (Narrow, Medium, Wide)"),
    frame_type: Optional[str] = Query(None, description="Filter by rim type (full-rim, rimless)"),
    db: Session = Depends(get_db)
):
    """
    Fetch all optical frames with physical millimeter dimensions for 3D face mesh scaling.
    """
    query = db.query(Product)
    if shape and shape != "all":
        query = query.filter(Product.shape.ilike(f"%{shape}%"))
    if size and size != "all":
        query = query.filter(Product.size.ilike(f"%{size}%"))
    if frame_type and frame_type != "all":
        query = query.filter(Product.frame_type.ilike(f"%{frame_type}%"))
    return query.all()

@router.get("/{product_id}", response_model=ProductResponse)
def get_product_by_id(product_id: str, db: Session = Depends(get_db)):
    """
    Fetch a single eyewear frame by its UUID or SKU.
    """
    product = db.query(Product).filter(
        (Product.id == product_id) | (Product.sku == product_id)
    ).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product '{product_id}' not found"
        )
    return product

@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product_in: ProductCreate, db: Session = Depends(get_db)):
    """
    Create a new eyewear product in the catalog.
    """
    existing = db.query(Product).filter(Product.sku == product_in.sku).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product with SKU '{product_in.sku}' already exists"
        )
    
    product = Product(**product_in.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product
