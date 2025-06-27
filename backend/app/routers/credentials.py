"""
User credentials management endpoints
T-41: User API Key Management
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from app.models.auth import UserCredentials, UserCredentialsResponse
from app.services.auth import get_current_user, User
from app.services.credentials import credentials_service
from typing import Dict
import json
import os

router = APIRouter(prefix="/user", tags=["credentials"])
security = HTTPBearer()

# In-memory storage for development (replace with database in production)
user_credentials_store: Dict[str, str] = {}

@router.post("/credentials", response_model=UserCredentialsResponse)
async def store_user_credentials(
    credentials: UserCredentials,
    current_user: User = Depends(get_current_user)
):
    """
    Store encrypted OpenAI API key for the current user
    """
    # Validate API key format
    if not credentials_service.validate_openai_key_format(credentials.openai_api_key):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OpenAI API key format. Key must start with 'sk-'"
        )
    
    # Encrypt the API key
    encrypted_key = credentials_service.encrypt_api_key(credentials.openai_api_key)
    
    # Store encrypted key (in production, this would go to database)
    user_credentials_store[current_user.id] = encrypted_key
    
    # Return response with preview
    key_preview = credentials_service.get_key_preview(credentials.openai_api_key)
    
    return UserCredentialsResponse(
        has_api_key=True,
        key_preview=key_preview
    )

@router.get("/credentials", response_model=UserCredentialsResponse)
async def get_user_credentials_status(
    current_user: User = Depends(get_current_user)
):
    """
    Get user's API key status (without returning the actual key)
    """
    has_key = current_user.id in user_credentials_store
    
    if has_key:
        # Decrypt to get preview
        encrypted_key = user_credentials_store[current_user.id]
        decrypted_key = credentials_service.decrypt_api_key(encrypted_key)
        key_preview = credentials_service.get_key_preview(decrypted_key)
        
        return UserCredentialsResponse(
            has_api_key=True,
            key_preview=key_preview
        )
    
    return UserCredentialsResponse(has_api_key=False)

@router.delete("/credentials")
async def delete_user_credentials(
    current_user: User = Depends(get_current_user)
):
    """
    Delete user's stored API key
    """
    if current_user.id in user_credentials_store:
        del user_credentials_store[current_user.id]
        return {"message": "API key deleted successfully"}
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="No API key found for user"
    )

def get_user_openai_key(user_id: str) -> str:
    """
    Internal function to retrieve decrypted API key for AI calls
    Returns the actual API key for use with OpenAI
    """
    if user_id not in user_credentials_store:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="User has not provided OpenAI API key"
        )
    
    encrypted_key = user_credentials_store[user_id]
    return credentials_service.decrypt_api_key(encrypted_key)