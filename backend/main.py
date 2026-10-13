"""
Spectra Optics - FastAPI Root Runner
Re-exports the application from app.main for backward compatibility.
Enables running either `uvicorn app.main:app` or `uvicorn main:app` from backend folder.
"""

from app.main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
