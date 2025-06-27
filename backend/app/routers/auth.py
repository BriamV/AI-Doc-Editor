"""
Authentication endpoints
T-02: OAuth 2.0 + JWT Roles implementation
"""
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.security import HTTPBearer
from authlib.integrations.httpx_client import AsyncOAuth2Client
import httpx
from datetime import datetime, timedelta
from typing import Optional

from app.core.config import settings
from app.models.auth import UserCreate, UserResponse, TokenResponse
from app.services.auth import AuthService

router = APIRouter()
security = HTTPBearer()

@router.post("/login")
async def login(provider: str):
    """
    Initiate OAuth 2.0 login flow
    T-02-ST1: OAuth 2.0 flow implementation
    """
    if provider not in ["google", "microsoft"]:
        raise HTTPException(
            status_code=400,
            detail="Unsupported provider. Use 'google' or 'microsoft'"
        )
    
    # TODO: Implement OAuth URLs generation
    redirect_uri = f"{settings.FRONTEND_URL}/auth/callback"
    
    if provider == "google":
        auth_url = f"https://accounts.google.com/o/oauth2/auth?client_id={settings.GOOGLE_CLIENT_ID}&redirect_uri={redirect_uri}&scope=openid email profile&response_type=code"
    elif provider == "microsoft":
        auth_url = f"https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id={settings.MICROSOFT_CLIENT_ID}&redirect_uri={redirect_uri}&scope=openid email profile&response_type=code"
    
    return JSONResponse({
        "auth_url": auth_url,
        "provider": provider,
        "state": "random_state_string"  # TODO: Generate secure state
    })

@router.get("/callback")
async def oauth_callback(code: str, state: Optional[str] = None, provider: str = "google"):
    """
    Handle OAuth callback
    T-02-ST1: OAuth callback handling + user creation
    """
    try:
        # TODO: Validate state parameter
        
        # Exchange code for tokens
        if provider == "google":
            token_url = "https://oauth2.googleapis.com/token"
            user_info_url = "https://www.googleapis.com/oauth2/v2/userinfo"
            client_id = settings.GOOGLE_CLIENT_ID
            client_secret = settings.GOOGLE_CLIENT_SECRET
        elif provider == "microsoft":
            token_url = "https://login.microsoftonline.com/common/oauth2/v2.0/token"
            user_info_url = "https://graph.microsoft.com/v1.0/me"
            client_id = settings.MICROSOFT_CLIENT_ID
            client_secret = settings.MICROSOFT_CLIENT_SECRET
        else:
            raise HTTPException(status_code=400, detail="Invalid provider")
        
        # Exchange authorization code for access token
        async with httpx.AsyncClient() as client:
            token_response = await client.post(token_url, data={
                "client_id": client_id,
                "client_secret": client_secret,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": f"{settings.FRONTEND_URL}/auth/callback"
            })
            
            if token_response.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to exchange code for token")
            
            token_data = token_response.json()
            access_token = token_data.get("access_token")
            
            # Get user info
            user_response = await client.get(
                user_info_url,
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            if user_response.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to get user info")
            
            user_info = user_response.json()
            
        # Create or update user in database
        # TODO: Implement database operations
        user_data = {
            "email": user_info.get("email"),
            "name": user_info.get("name"),
            "provider": provider,
            "role": "editor"  # Default role
        }
        
        # Generate JWT tokens
        auth_service = AuthService()
        jwt_tokens = auth_service.create_tokens(user_data)
        
        return JSONResponse({
            "access_token": jwt_tokens["access_token"],
            "refresh_token": jwt_tokens["refresh_token"],
            "token_type": "bearer",
            "user": user_data
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Authentication failed: {str(e)}")

@router.post("/refresh")
async def refresh_token(refresh_token: str):
    """
    Refresh JWT access token
    T-02-ST2: JWT refresh implementation
    """
    try:
        auth_service = AuthService()
        new_tokens = auth_service.refresh_tokens(refresh_token)
        
        return JSONResponse({
            "access_token": new_tokens["access_token"],
            "refresh_token": new_tokens["refresh_token"],
            "token_type": "bearer"
        })
        
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@router.get("/me")
async def get_current_user(token: str = Depends(security)):
    """
    Get current user profile
    T-02-ST2: User profile with roles
    """
    try:
        auth_service = AuthService()
        user_data = auth_service.verify_token(token.credentials)
        
        return JSONResponse({
            "user": user_data,
            "authenticated": True
        })
        
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")