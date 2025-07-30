"""
Authentication service
T-02: OAuth 2.0 + JWT implementation
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer
from pydantic import BaseModel

from app.core.config import settings

# Security scheme
security = HTTPBearer()


class User(BaseModel):
    """User model for dependency injection"""

    id: str
    email: str
    name: str
    role: str
    provider: str


class AuthService:
    def __init__(self):
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    def create_access_token(self, data: Dict[str, Any]) -> str:
        """
        Create JWT access token
        T-02-ST2: JWT generation with roles
        """
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire, "type": "access"})

        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt

    def create_refresh_token(self, data: Dict[str, Any]) -> str:
        """
        Create JWT refresh token
        T-02-ST2: Refresh token generation
        """
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        to_encode.update({"exp": expire, "type": "refresh"})

        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt

    def create_tokens(self, user_data: Dict[str, Any]) -> Dict[str, str]:
        """
        Create both access and refresh tokens
        T-02-ST2: Complete token generation
        """
        token_data = {
            "sub": user_data["email"],
            "email": user_data["email"],
            "name": user_data["name"],
            "role": user_data["role"],
            "provider": user_data["provider"],
        }

        access_token = self.create_access_token(token_data)
        refresh_token = self.create_refresh_token({"sub": user_data["email"]})

        return {"access_token": access_token, "refresh_token": refresh_token}

    def verify_token(self, token: str) -> Dict[str, Any]:
        """
        Verify and decode JWT token
        T-02-ST2: Token validation
        """
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])

            email: str = payload.get("sub")
            if email is None:
                raise JWTError("Invalid token")

            return payload

        except JWTError:
            raise ValueError("Invalid token")

    def refresh_tokens(self, refresh_token: str) -> Dict[str, str]:
        """
        Generate new tokens from refresh token
        T-02-ST2: Token refresh logic
        """
        try:
            payload = jwt.decode(
                refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
            )

            email: str = payload.get("sub")
            token_type: str = payload.get("type")

            if email is None or token_type != "refresh":
                raise JWTError("Invalid refresh token")

            # TODO: Get user data from database
            user_data = {
                "email": email,
                "name": "User Name",  # Get from DB
                "role": "editor",  # Get from DB
                "provider": "google",  # Get from DB
            }

            return self.create_tokens(user_data)

        except JWTError:
            raise ValueError("Invalid refresh token")


# Global auth service instance
auth_service = AuthService()


async def get_current_user(token: str = Depends(security)) -> User:
    """
    Dependency to get current authenticated user from JWT token
    T-02-ST2: JWT authentication dependency
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Extract token from credentials
        token_str = token.credentials if hasattr(token, "credentials") else str(token)

        # Verify and decode token
        payload = auth_service.verify_token(token_str)

        # Create user from payload
        user = User(
            id=payload.get("sub", ""),
            email=payload.get("email", ""),
            name=payload.get("name", ""),
            role=payload.get("role", "editor"),
            provider=payload.get("provider", "google"),
        )

        return user

    except (ValueError, JWTError):
        raise credentials_exception
