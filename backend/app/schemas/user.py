"""
User Authentication & Profile Pydantic Schemas
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=4, max_length=128)
    phone: Optional[str] = None
    member_type: Optional[str] = "Gold Member"

class UserLoginRequest(BaseModel):
    email: str = Field(..., description="Email address or mobile number")
    password: str = Field(..., min_length=1)

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    member_type: str = "Gold Member"
    initials: str
    created_at: datetime

    class Config:
        from_attributes = True
