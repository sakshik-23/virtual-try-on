"""
Seed script to populate PostgreSQL / SQLite database with the 7 eyewear products.
Run with: python seed_data.py
"""

from app.database import SessionLocal, engine, Base
from app.models.product import Product

PRODUCTS_SEED = [
    {
        "sku": "WC-001",
        "name": "Wayfarer Classic Acetate",
        "brand": "Vincent Chase",
        "price": 1499.0,
        "original_price": 2999.0,
        "shape": "wayfarer",
        "frame_type": "full-rim",
        "size": "Medium",
        "description": "Timeless hand-crafted Italian acetate wayfarer with reinforced barrel hinges and scratch-resistant finish.",
        "lens_width_mm": 52,
        "bridge_width_mm": 18,
        "temple_length_mm": 142,
        "frame_width_mm": 138,
        "image": "/images/eyewear/wayfarer_black.jpg",
        "front_image": "/images/eyewear/front_wayfarer.png",
        "available_colors": [
            {"id": "black", "name": "Matte Black", "hex": "#1a1a1a"},
            {"id": "tortoise", "name": "Havana Tortoise", "hex": "#5c3317"}
        ],
        "available_lens_tints": [
            {"id": "clear", "name": "Anti-Glare Clear", "hex": "#ffffff", "opacity": 0.05},
            {"id": "blu", "name": "BLU Computer Cut", "hex": "#cffafe", "opacity": 0.20}
        ],
        "recommended_face_shapes": ["Oval", "Round", "Heart"]
    },
    {
        "sku": "AP-002",
        "name": "Aviator Titanium Pro",
        "brand": "John Jacobs",
        "price": 2499.0,
        "original_price": 4999.0,
        "shape": "aviator",
        "frame_type": "full-rim",
        "size": "Wide",
        "description": "Ultra-lightweight Japanese aerospace-grade titanium frame with iconic teardrop silhouette and silicone nose pads.",
        "lens_width_mm": 58,
        "bridge_width_mm": 14,
        "temple_length_mm": 140,
        "frame_width_mm": 140,
        "image": "/images/eyewear/aviator_gold.jpg",
        "front_image": "/images/eyewear/front_round_gold.png",
        "available_colors": [
            {"id": "gold", "name": "Champagne Gold", "hex": "#d4af37"},
            {"id": "gunmetal", "name": "Gunmetal Gray", "hex": "#4a4a4a"}
        ],
        "available_lens_tints": [
            {"id": "clear", "name": "Anti-Glare Clear", "hex": "#ffffff", "opacity": 0.05},
            {"id": "green", "name": "G-15 Polarized", "hex": "#2e5d34", "opacity": 0.65}
        ],
        "recommended_face_shapes": ["Square", "Oval", "Heart"]
    },
    {
        "sku": "RW-003",
        "name": "Round Wire Minimalist",
        "brand": "Lenskart Air",
        "price": 1199.0,
        "original_price": 2499.0,
        "shape": "round",
        "frame_type": "full-rim",
        "size": "Narrow",
        "description": "Featherweight stainless steel wire frame inspired by 1960s intellectual aesthetics. Weighs only 11 grams.",
        "lens_width_mm": 48,
        "bridge_width_mm": 20,
        "temple_length_mm": 145,
        "frame_width_mm": 132,
        "image": "/images/eyewear/round_silver.jpg",
        "front_image": "/images/eyewear/front_round.png",
        "available_colors": [
            {"id": "silver", "name": "Brushed Silver", "hex": "#c0c0c0"},
            {"id": "black", "name": "Satin Black", "hex": "#222222"}
        ],
        "available_lens_tints": [
            {"id": "clear", "name": "Anti-Glare Clear", "hex": "#ffffff", "opacity": 0.05},
            {"id": "blu", "name": "BLU Screen Guard", "hex": "#cffafe", "opacity": 0.20}
        ],
        "recommended_face_shapes": ["Square", "Oblong", "Diamond"]
    },
    {
        "sku": "CE-004",
        "name": "Cat-Eye Hollywood Glam",
        "brand": "Vincent Chase",
        "price": 1799.0,
        "original_price": 3499.0,
        "shape": "cat-eye",
        "frame_type": "full-rim",
        "size": "Medium",
        "description": "Dramatic upswept browline crafted from premium glossy acetate. Elevates cheekbones and sharpens jawlines.",
        "lens_width_mm": 54,
        "bridge_width_mm": 16,
        "temple_length_mm": 140,
        "frame_width_mm": 136,
        "image": "/images/eyewear/cateye_tortoise.jpg",
        "front_image": "/images/eyewear/front_cateye.png",
        "available_colors": [
            {"id": "tortoise", "name": "Amber Tortoise", "hex": "#733618"},
            {"id": "black", "name": "Onyx Black", "hex": "#111111"}
        ],
        "available_lens_tints": [
            {"id": "clear", "name": "Anti-Glare Clear", "hex": "#ffffff", "opacity": 0.05},
            {"id": "rose", "name": "Rose Gold Gradient", "hex": "#f43f5e", "opacity": 0.40}
        ],
        "recommended_face_shapes": ["Round", "Oval", "Square"]
    },
    {
        "sku": "SE-005",
        "name": "Square Executive Acetate",
        "brand": "John Jacobs",
        "price": 2199.0,
        "original_price": 4299.0,
        "shape": "rectangle",
        "frame_type": "full-rim",
        "size": "Wide",
        "description": "Substantial geometric square architecture engineered with German five-barrel hinges for executive poise.",
        "lens_width_mm": 56,
        "bridge_width_mm": 17,
        "temple_length_mm": 145,
        "frame_width_mm": 142,
        "image": "/images/eyewear/square_black.jpg",
        "front_image": "/images/eyewear/front_rectangle.png",
        "available_colors": [
            {"id": "black", "name": "Glossy Jet Black", "hex": "#0a0a0a"},
            {"id": "blue", "name": "Midnight Indigo", "hex": "#1e3a5f"}
        ],
        "available_lens_tints": [
            {"id": "clear", "name": "Anti-Glare Clear", "hex": "#ffffff", "opacity": 0.05},
            {"id": "blu", "name": "BLU Max Blue Light", "hex": "#cffafe", "opacity": 0.25}
        ],
        "recommended_face_shapes": ["Round", "Oval"]
    },
    {
        "sku": "CV-006",
        "name": "Clubmaster Vintage Browline",
        "brand": "Vincent Chase",
        "price": 1699.0,
        "original_price": 3299.0,
        "shape": "rectangle",
        "frame_type": "full-rim",
        "size": "Medium",
        "description": "Mid-century intellectual styling featuring an acetate brow accent mounted onto a filigree-etched metal rim.",
        "lens_width_mm": 51,
        "bridge_width_mm": 21,
        "temple_length_mm": 145,
        "frame_width_mm": 139,
        "image": "/images/eyewear/clubmaster_black.jpg",
        "front_image": "/images/eyewear/front_clubmaster.png",
        "available_colors": [
            {"id": "black_gold", "name": "Black & Polished Gold", "hex": "#1c1917"},
            {"id": "tortoise_gold", "name": "Tortoise & Gold", "hex": "#451a03"}
        ],
        "available_lens_tints": [
            {"id": "clear", "name": "Anti-Glare Clear", "hex": "#ffffff", "opacity": 0.05},
            {"id": "amber", "name": "Amber Drive Contrast", "hex": "#d97706", "opacity": 0.45}
        ],
        "recommended_face_shapes": ["Oval", "Round", "Diamond"]
    },
    {
        "sku": "RT-007",
        "name": "Round Acetate Tortoise",
        "brand": "Lenskart Studio",
        "price": 1399.0,
        "original_price": 2799.0,
        "shape": "round",
        "frame_type": "full-rim",
        "size": "Medium",
        "description": "Rich artisanal tortoise acetate sculpted into a scholarly circular contour with keyhole bridge.",
        "lens_width_mm": 49,
        "bridge_width_mm": 19,
        "temple_length_mm": 142,
        "frame_width_mm": 134,
        "image": "/images/eyewear/round_tortoise.jpg",
        "front_image": "/images/eyewear/front_wayfarer_tortoise.png",
        "available_colors": [
            {"id": "tortoise", "name": "Tokyo Tortoise", "hex": "#6b3e1b"},
            {"id": "caramel", "name": "Caramel Honey", "hex": "#b45309"}
        ],
        "available_lens_tints": [
            {"id": "clear", "name": "Anti-Glare Clear", "hex": "#ffffff", "opacity": 0.05},
            {"id": "blu", "name": "BLU Screen Guard", "hex": "#cffafe", "opacity": 0.20}
        ],
        "recommended_face_shapes": ["Square", "Oblong", "Heart"]
    }
]

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        created_count = 0
        for item in PRODUCTS_SEED:
            existing = db.query(Product).filter(Product.sku == item["sku"]).first()
            if not existing:
                prod = Product(**item)
                db.add(prod)
                created_count += 1
        db.commit()
        print(f"Successfully seeded {created_count} eyewear products into database!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
