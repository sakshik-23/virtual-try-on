"""
Spectra Optics - User Authentication & Account Router
Implements secure user registration, password verification, and credential persistence in ACID SQLite database.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import hashlib
import secrets
from datetime import datetime

from ..database import get_db
from ..models.user import User
from ..schemas.user import UserRegisterRequest, UserLoginRequest, UserResponse

router = APIRouter(prefix="/api/auth", tags=["User Authentication"])

def hash_password(password: str) -> str:
    """Hash password using PBKDF2-HMAC-SHA256 with a unique cryptographic salt."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100_000
    ).hex()
    return f"{salt}${key}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password in constant-time against stored salt and key."""
    try:
        salt, key = hashed_password.split('$')
        computed_key = hashlib.pbkdf2_hmac(
            'sha256',
            plain_password.encode('utf-8'),
            salt.encode('utf-8'),
            100_000
        ).hex()
        return secrets.compare_digest(key, computed_key)
    except Exception:
        return False

def get_initials(name: str) -> str:
    """Calculate 2-letter uppercase initials from full name."""
    parts = [p for p in name.strip().split() if p]
    if len(parts) >= 2:
        return (parts[0][0] + parts[1][0]).upper()
    elif len(parts) == 1:
        return parts[0][:2].upper()
    return "SM"

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    """
    Register a new user account into the relational database.
    Verifies email uniqueness, hashes password, and persists credentials.
    """
    clean_email = payload.email.strip().lower()
    clean_name = payload.name.strip()

    # Check if user already exists
    existing = db.query(User).filter(User.email.ilike(clean_email)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please sign in instead."
        )

    # Hash password securely
    hashed_pwd = hash_password(payload.password)

    new_user = User(
        name=clean_name,
        email=clean_email,
        phone=payload.phone.strip() if payload.phone else None,
        password_hash=hashed_pwd,
        member_type=payload.member_type or "Gold Member",
        created_at=datetime.utcnow()
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return UserResponse(
        id=new_user.id,
        name=new_user.name,
        email=new_user.email,
        phone=new_user.phone,
        member_type=new_user.member_type,
        initials=get_initials(new_user.name),
        created_at=new_user.created_at
    )

@router.post("/login", response_model=UserResponse)
def login_user(payload: UserLoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user against credentials saved in the database.
    Accepts email or mobile number.
    """
    identifier = payload.email.strip()

    # Find user by email or phone
    user = db.query(User).filter(
        (User.email.ilike(identifier)) | (User.phone == identifier)
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email or mobile number. Please register first."
        )

    # Verify password hash
    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Please verify and try again."
        )

    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        phone=user.phone,
        member_type=user.member_type,
        initials=get_initials(user.name),
        created_at=user.created_at
    )

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(email: str, db: Session = Depends(get_db)):
    """
    Fetch current user profile data by email.
    """
    clean_email = email.strip().lower()
    user = db.query(User).filter(User.email.ilike(clean_email)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        phone=user.phone,
        member_type=user.member_type,
        initials=get_initials(user.name),
        created_at=user.created_at
    )
