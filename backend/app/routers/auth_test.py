"""
Test authentication endpoints for development.
Part of dual-mode authentication architecture.

Security:
- Auto-disabled in production (ENVIRONMENT != development)
- Only works with @test.local users
- Tokens marked with test_mode: true
- Extended expiry (8 hours vs 30 minutes)

Endpoints:
- POST /api/auth/test/login      - Login with test user
- GET  /api/auth/test/users      - List available test users
- POST /api/auth/test/reset      - Reset test users
- GET  /api/auth/test/status     - Test mode status
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from pathlib import Path

from app.core.config import settings
from app.services.user_service import UserService
from app.services.auth import AuthService

router = APIRouter(prefix="/test", tags=["test-auth"])


class TestLoginRequest(BaseModel):
    """Test login request - only requires email."""

    email: str  # Note: Cannot use EmailStr because @test.local is reserved domain


class TestUserResponse(BaseModel):
    """Test user information."""

    email: str
    name: str
    role: str
    provider: str


def _check_test_mode_enabled():
    """Verify test mode is enabled, raise 403 if not."""
    if settings.ENVIRONMENT != "development":
        raise HTTPException(
            status_code=403,
            detail={
                "error": "test_mode_disabled",
                "message": "Test authentication is only available in development environment",
                "environment": settings.ENVIRONMENT,
                "hint": "Set ENVIRONMENT=development in .env to enable test mode",
            },
        )


@router.post("/login")
async def test_login(request: TestLoginRequest):
    """
    Login with test user (development only).

    No password required - just provide email.
    Returns JWT token with extended expiry (8 hours).

    Security:
    - Only works in development environment
    - Only works with @test.local email addresses
    - Tokens marked with test_mode: true
    - Auto-disabled in production

    Example:
        POST /api/auth/test/login
        {
            "email": "admin@test.local"
        }

    Returns:
        {
            "access_token": "eyJ...",
            "refresh_token": "eyJ...",
            "token_type": "bearer",
            "user": {...},
            "test_mode": true
        }
    """
    _check_test_mode_enabled()

    # Validate @test.local domain
    if not request.email.endswith("@test.local"):
        raise HTTPException(
            status_code=400,
            detail={
                "error": "invalid_test_email",
                "message": "Test login only works with @test.local email addresses",
                "provided": request.email,
                "hint": "Use: admin@test.local, editor@test.local, or viewer@test.local",
            },
        )

    # Get user from database
    user_service = UserService()
    user = user_service.get_user_by_email(request.email)

    if not user:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "test_user_not_found",
                "message": f"Test user not found: {request.email}",
                "hint": "Run: python scripts/seed_test_users.py",
                "available_users": ["admin@test.local", "editor@test.local", "viewer@test.local"],
            },
        )

    # Verify it's a test user
    if not user.get("is_test_user"):
        raise HTTPException(
            status_code=403,
            detail={
                "error": "not_test_user",
                "message": "This user is not a test user",
                "hint": "Only users with is_test_user=1 can use test login",
            },
        )

    # Update last login
    user_service.update_last_login(user["id"])

    # Generate JWT tokens with test_mode claim and extended expiry
    user_data = {
        "sub": user["email"],  # JWT standard subject field (required)
        "user_id": user["id"],  # Include user_id for document operations
        "email": user["email"],
        "name": user["name"],
        "provider": user["provider"],
        "role": user["role"],
        "test_mode": True,  # Mark token as test mode
    }

    auth_service = AuthService()

    # Create access token with 8-hour expiry for development
    access_token = auth_service.create_access_token(user_data, expires_minutes=480)  # 8 hours

    # Create refresh token with 7-day expiry
    refresh_token = auth_service.create_refresh_token({"sub": user["email"]})

    return JSONResponse(
        {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": 480 * 60,  # 8 hours in seconds
            "user": {
                "id": user["id"],
                "email": user["email"],
                "name": user["name"],
                "role": user["role"],
                "provider": user["provider"],
            },
            "test_mode": True,  # Flag to frontend
            "warning": "Test authentication - not for production use",
        }
    )


@router.get("/users")
async def list_test_users():
    """
    List available test users (development only).

    Returns all test users registered in the system.
    Useful for discovering available test accounts.

    Example:
        GET /api/auth/test/users

    Returns:
        {
            "users": [
                {
                    "email": "admin@test.local",
                    "name": "Admin Test User",
                    "role": "admin",
                    "provider": "test"
                },
                ...
            ],
            "count": 3,
            "test_mode": true
        }
    """
    _check_test_mode_enabled()

    user_service = UserService()

    # Get all test users
    import sqlite3

    conn = user_service._get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT email, name, role, provider, created_at, last_login_at
        FROM users
        WHERE is_test_user = 1
        ORDER BY role DESC, email ASC
    """
    )

    users = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return JSONResponse(
        {"users": users, "count": len(users), "test_mode": True, "environment": "development"}
    )


@router.post("/reset")
async def reset_test_users():
    """
    Reset test users to defaults (development only).

    Deletes all existing test users and recreates the default set:
    - admin@test.local (admin)
    - editor@test.local (editor)
    - viewer@test.local (editor)

    Useful for cleaning up test data.

    Example:
        POST /api/auth/test/reset

    Returns:
        {
            "deleted": 3,
            "created": 3,
            "users": [...],
            "test_mode": true
        }
    """
    _check_test_mode_enabled()

    import subprocess
    import sys

    # Run seed script with --reset flag
    result = subprocess.run(
        [sys.executable, "scripts/seed_test_users.py", "--reset"],
        capture_output=True,
        text=True,
        cwd="backend" if Path("backend").exists() else ".",
    )

    if result.returncode != 0:
        raise HTTPException(
            status_code=500,
            detail={
                "error": "reset_failed",
                "message": "Failed to reset test users",
                "output": result.stderr,
            },
        )

    # Get updated user list
    user_service = UserService()
    import sqlite3

    conn = user_service._get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute(
        "SELECT email, name, role FROM users WHERE is_test_user = 1 ORDER BY role DESC, email"
    )
    users = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return JSONResponse(
        {
            "message": "Test users reset successfully",
            "deleted": 3,  # Hardcoded for now
            "created": len(users),
            "users": users,
            "test_mode": True,
        }
    )


@router.get("/status")
async def test_mode_status():
    """
    Get test mode configuration status.

    Returns current test mode configuration and environment details.
    Useful for debugging and verifying setup.

    Example:
        GET /api/auth/test/status

    Returns:
        {
            "test_mode_enabled": true,
            "environment": "development",
            "test_users_count": 3,
            "configuration": {...}
        }
    """
    # This endpoint works in all environments (returns status)
    test_mode_enabled = settings.ENVIRONMENT == "development"

    if test_mode_enabled:
        user_service = UserService()
        conn = user_service._get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM users WHERE is_test_user = 1")
        test_users_count = cursor.fetchone()[0]
        conn.close()
    else:
        test_users_count = 0

    return JSONResponse(
        {
            "test_mode_enabled": test_mode_enabled,
            "environment": settings.ENVIRONMENT,
            "test_users_count": test_users_count,
            "configuration": {
                "oauth_google_configured": bool(settings.GOOGLE_CLIENT_ID),
                "oauth_microsoft_configured": bool(settings.MICROSOFT_CLIENT_ID),
                "database_url": settings.DATABASE_URL,
            },
            "endpoints": {
                "test_login": "/api/auth/test/login" if test_mode_enabled else None,
                "test_users": "/api/auth/test/users" if test_mode_enabled else None,
                "test_reset": "/api/auth/test/reset" if test_mode_enabled else None,
                "oauth_login": "/api/auth/login",
                "oauth_callback": "/api/auth/callback",
            },
        }
    )
