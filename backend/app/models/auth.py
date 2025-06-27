"""
Authentication data models
T-02: OAuth 2.0 + JWT Roles
"""
from pydantic import BaseModel, EmailStr
from typing import Optional, Literal
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    provider: Literal["google", "microsoft"]
    role: Literal["editor", "admin"] = "editor"

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    name: str
    provider: str
    role: str
    created_at: datetime
    updated_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse

class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None

class UserCredentials(BaseModel):
    openai_api_key: str

class UserCredentialsResponse(BaseModel):
    has_api_key: bool
    key_preview: Optional[str] = None