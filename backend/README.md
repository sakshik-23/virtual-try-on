# Spectra Optics - Python FastAPI Backend & Database Service

High-performance asynchronous backend providing:
1. **Eyewear Product Catalog**: Millimeter frame specs (`lens_width_mm`, `bridge_width_mm`, `frame_width_mm`) for real-world 3D scaling.
2. **Biometric Face Profile Storage**: Secure persistence of Pupillary Distance (PD), 6-DoF transformation matrix, and 478 MediaPipe landmarks (kept safely in the database, never exposed in client HTML).
3. **ACID Checkout Engine**: Transactions embedding measured PD directly onto optical prescription orders.

---

## 📁 Directory Structure

```
backend/
├── Dockerfile                  # Container definition for production deployment
├── docker-compose.yml          # 1-command startup for PostgreSQL, pgAdmin & FastAPI
├── requirements.txt            # Python dependencies (FastAPI, SQLAlchemy, etc.)
├── seed_data.py                # Pre-populates DB with 7 realistic eyewear models
├── main.py                     # Convenience runner for uvicorn
├── .env.example                # Sample environment variables
│
└── app/
    ├── __init__.py
    ├── main.py                 # FastAPI application instance & CORS middleware
    ├── database.py             # SQLAlchemy engine with PostgreSQL & SQLite auto-fallback
    │
    ├── models/                 # SQLAlchemy Relational ORM Models
    │   ├── __init__.py
    │   ├── product.py          # Eyewear Product table (millimeter specs & PBR assets)
    │   └── tryon_session.py    # FaceProfile (6-DoF matrices, PD) & Order tables
    │
    ├── schemas/                # Pydantic Request & Response Data Validation
    │   ├── __init__.py
    │   ├── product.py          # ProductBase, ProductCreate, ProductResponse
    │   └── tryon.py            # FaceProfileCreate, OrderCreate, etc.
    │
    └── routers/                # REST API Endpoints
        ├── __init__.py
        ├── catalog.py          # GET /api/products, GET /api/products/{id}
        └── tryon.py            # POST /api/tryon/face-profile, POST /api/orders/checkout
```

---

## 🚀 Quickstart: Running in 30 Seconds

### Step 1: Install Requirements
Open PowerShell in the `backend` folder and run:
```powershell
pip install -r requirements.txt
```

### Step 2: Seed the Database
Populate the database with the 7 optical frame models:
```powershell
python seed_data.py
```

### Step 3: Start the Backend Server
```powershell
uvicorn app.main:app --reload --port 8000
```

Visit the interactive Swagger API documentation in your browser:
👉 **[http://localhost:8000/docs](http://localhost:8000/docs)**
