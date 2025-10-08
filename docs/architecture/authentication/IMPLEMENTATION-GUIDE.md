# Test Authentication Implementation Guide

**Companion to**: DUAL-MODE-AUTH-ARCHITECTURE.md
**Version**: 1.0
**Created**: 2025-10-08

## Quick Start

```bash
# 1. Review architecture document first
cat docs/architecture/authentication/DUAL-MODE-AUTH-ARCHITECTURE.md

# 2. Run implementation script (to be created)
bash scripts/implement-test-auth.sh

# 3. Test the implementation
curl http://localhost:8000/api/auth/test/status
```

## Step-by-Step Implementation

### Step 1: Database Migration

**File**: `backend/migrations/001_add_test_user_support.sql`

```sql
-- Add test user support to users table
-- Migration: 001_add_test_user_support
-- Date: 2025-10-08

-- Add is_test_user column
ALTER TABLE users ADD COLUMN is_test_user BOOLEAN DEFAULT 0 NOT NULL;

-- Add indexes for performance
CREATE INDEX idx_users_is_test_user ON users(is_test_user);
CREATE INDEX idx_users_email_test ON users(email, is_test_user);
CREATE INDEX idx_users_provider_test ON users(provider, is_test_user);

-- Add constraint: test users must use @test.local domain
-- Note: SQLite doesn't support CHECK constraints in ALTER TABLE
-- This will be enforced in application code and at INSERT time via trigger

-- Trigger to validate test user email domain
CREATE TRIGGER validate_test_user_email_insert
BEFORE INSERT ON users
WHEN NEW.is_test_user = 1
BEGIN
    SELECT CASE
        WHEN NEW.email NOT LIKE '%@test.local' THEN
            RAISE(ABORT, 'Test users must use @test.local email domain')
    END;
END;

-- Trigger for UPDATE operations
CREATE TRIGGER validate_test_user_email_update
BEFORE UPDATE ON users
WHEN NEW.is_test_user = 1
BEGIN
    SELECT CASE
        WHEN NEW.email NOT LIKE '%@test.local' THEN
            RAISE(ABORT, 'Test users must use @test.local email domain')
    END;
END;

-- Add comment (SQLite doesn't support COMMENT, document here)
-- Column: is_test_user
-- Purpose: Flag to identify test users (true) vs OAuth users (false)
-- Default: 0 (false) - all new users are OAuth users by default
-- Test users: MUST have email ending in @test.local
-- Production: Test users should not exist in production database
```

**Run Migration**:

```bash
# Backend directory
cd backend

# Apply migration
sqlite3 app.db < migrations/001_add_test_user_support.sql

# Verify
sqlite3 app.db "PRAGMA table_info(users);"
# Should show is_test_user column

# Verify triggers
sqlite3 app.db "SELECT name FROM sqlite_master WHERE type='trigger';"
```

### Step 2: Configuration Extension

**File**: `backend/app/core/config.py`

Add these settings to the `Settings` class:

```python
# Test authentication settings (add after OAuth settings, around line 60)

# Test authentication configuration
TEST_AUTH_ENABLED: bool = Field(
    default=True,
    description="Enable test authentication for development. Auto-disabled in production."
)
TEST_USERS_AUTO_SEED: bool = Field(
    default=True,
    description="Automatically seed test users on application startup in development"
)
TEST_TOKEN_EXPIRY_MINUTES: int = Field(
    default=480,
    description="Test token expiry in minutes (8 hours for development convenience)"
)
TEST_MODE_BANNER_MESSAGE: str = Field(
    default="TEST MODE - Using mock authentication for development",
    description="Banner message displayed in test mode"
)

# Security: Test mode restrictions
TEST_MODE_MAX_SESSIONS: int = Field(
    default=10,
    description="Maximum concurrent test authentication sessions"
)
TEST_MODE_IP_WHITELIST: List[str] = Field(
    default=["127.0.0.1", "::1"],
    description="IP addresses allowed to use test authentication"
)
TEST_MODE_RATE_LIMIT_PER_HOUR: int = Field(
    default=100,
    description="Rate limit for test authentication requests per hour per IP"
)

# Add validator after existing validators (around line 250)

@validator("TEST_AUTH_ENABLED")
def disable_test_auth_in_production(cls, v: bool, values: Dict[str, Any]) -> bool:
    """
    Force disable test authentication in production environment.
    This is a critical security control.
    """
    environment = values.get("ENVIRONMENT", "development")

    if environment == "production":
        if v:
            logger.warning(
                "TEST_AUTH_ENABLED forced to False in production environment. "
                "Test authentication is not available in production."
            )
        return False

    return v

# Add helper method to Settings class (around line 470)

def is_test_mode_available(self) -> bool:
    """
    Check if test authentication is available in current environment.

    Returns:
        True if test mode is available (development/staging), False otherwise

    Test mode is available when:
    - TEST_AUTH_ENABLED is True
    - ENVIRONMENT is not production
    - DEBUG mode is enabled
    """
    return (
        self.TEST_AUTH_ENABLED
        and self.ENVIRONMENT != "production"
        and self.DEBUG
    )

def get_test_auth_config(self) -> Dict[str, Any]:
    """
    Get test authentication configuration for status endpoints.

    Returns:
        Dict with test auth configuration
    """
    return {
        "enabled": self.is_test_mode_available(),
        "auto_seed": self.TEST_USERS_AUTO_SEED,
        "token_expiry_minutes": self.TEST_TOKEN_EXPIRY_MINUTES,
        "max_sessions": self.TEST_MODE_MAX_SESSIONS,
        "rate_limit_per_hour": self.TEST_MODE_RATE_LIMIT_PER_HOUR,
        "ip_whitelist": self.TEST_MODE_IP_WHITELIST,
    }
```

**Verify Configuration**:

```python
# Test in Python REPL
python
>>> from app.core.config import settings
>>> settings.is_test_mode_available()
True  # In development
>>> settings.get_test_auth_config()
{'enabled': True, 'auto_seed': True, ...}
```

### Step 3: User Service Extension

**File**: `backend/app/services/user_service.py`

Add these methods to the `UserService` class:

```python
# Add after existing methods (around line 170)

def seed_test_users(self) -> List[Dict[str, Any]]:
    """
    Seed default test users for development.
    Called on application startup if TEST_USERS_AUTO_SEED=True.

    Creates three test users:
    - admin@test.local (admin role)
    - editor@test.local (editor role)
    - viewer@test.local (editor role)

    Returns:
        List of created/existing test users

    Raises:
        RuntimeError: If called in production environment
    """
    from app.core.config import settings

    # Security check: Never allow in production
    if settings.ENVIRONMENT == "production":
        raise RuntimeError(
            "Cannot seed test users in production environment. "
            "This is a development-only operation."
        )

    test_users = [
        {
            "email": "admin@test.local",
            "name": "Test Admin",
            "role": "admin",
            "provider": "test",
        },
        {
            "email": "editor@test.local",
            "name": "Test Editor",
            "role": "editor",
            "provider": "test",
        },
        {
            "email": "viewer@test.local",
            "name": "Test Viewer",
            "role": "editor",
            "provider": "test",
        },
    ]

    created_users = []

    for user_data in test_users:
        # Check if test user already exists
        existing = self.get_user_by_email(user_data["email"])

        if existing:
            # Verify it's actually a test user
            if existing.get("is_test_user"):
                created_users.append(existing)
                continue
            else:
                # Email conflict with real user - skip
                logging.warning(
                    f"Cannot create test user {user_data['email']}: "
                    f"Email already used by OAuth user"
                )
                continue

        # Create new test user
        try:
            user = self._create_test_user(**user_data)
            created_users.append(user)
            logging.info(f"Created test user: {user['email']} (role: {user['role']})")
        except Exception as e:
            logging.error(f"Failed to create test user {user_data['email']}: {e}")

    return created_users

def _create_test_user(
    self, email: str, name: str, provider: str, role: str = "editor"
) -> Dict[str, Any]:
    """
    Create a test user (internal method).

    Args:
        email: Must end with @test.local
        name: User full name
        provider: Must be 'test'
        role: User role ('editor' or 'admin')

    Returns:
        Created test user dict

    Raises:
        ValueError: If email domain is invalid or provider is not 'test'
    """
    # Validation
    if not email.endswith("@test.local"):
        raise ValueError(
            f"Invalid test user email: {email}. "
            f"Test users must use @test.local email domain."
        )

    if provider != "test":
        raise ValueError(
            f"Invalid test user provider: {provider}. "
            f"Test users must use 'test' provider."
        )

    if role not in ["editor", "admin"]:
        raise ValueError(f"Invalid role: {role}. Must be 'editor' or 'admin'")

    user_id = str(uuid4())
    now = datetime.utcnow().isoformat()

    conn = self._get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            INSERT INTO users
            (id, email, name, provider, role, is_active, is_test_user, created_at, updated_at, last_login_at)
            VALUES (?, ?, ?, ?, ?, 1, 1, ?, ?, ?)
            """,
            (user_id, email, name, provider, role, now, now, now),
        )
        conn.commit()

        return {
            "id": user_id,
            "email": email,
            "name": name,
            "provider": provider,
            "role": role,
            "is_active": True,
            "is_test_user": True,
            "created_at": now,
            "updated_at": now,
            "last_login_at": now,
        }

    except sqlite3.IntegrityError as e:
        conn.rollback()
        raise ValueError(f"Failed to create test user: {e}")
    finally:
        conn.close()

def get_test_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
    """
    Get test user by email.

    Args:
        email: Test user email

    Returns:
        Test user dict or None if not found
    """
    conn = self._get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT * FROM users
        WHERE email = ? AND is_test_user = 1 AND is_active = 1
        """,
        (email,)
    )
    row = cursor.fetchone()
    conn.close()

    if row:
        return dict(row)
    return None

def list_test_users(self) -> List[Dict[str, Any]]:
    """
    List all active test users.

    Returns:
        List of test user dicts, ordered by role (admin first) then name
    """
    conn = self._get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT * FROM users
        WHERE is_test_user = 1 AND is_active = 1
        ORDER BY
            CASE role WHEN 'admin' THEN 1 ELSE 2 END,
            name ASC
        """
    )
    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]

def reset_test_users(self) -> int:
    """
    Delete all test users and re-seed defaults.
    DEVELOPMENT ONLY - raises error if called in production.

    Returns:
        Number of test users deleted

    Raises:
        RuntimeError: If called in production environment
    """
    from app.core.config import settings

    if settings.ENVIRONMENT == "production":
        raise RuntimeError(
            "Cannot reset test users in production environment. "
            "This is a development-only operation."
        )

    conn = self._get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("DELETE FROM users WHERE is_test_user = 1")
        deleted_count = cursor.rowcount
        conn.commit()

        logging.info(f"Deleted {deleted_count} test users")

    finally:
        conn.close()

    # Re-seed default test users
    seeded_users = self.seed_test_users()
    logging.info(f"Re-seeded {len(seeded_users)} test users")

    return deleted_count
```

### Step 4: Auth Service Extension

**File**: `backend/app/services/auth.py`

Add these methods to the `AuthService` class:

```python
# Add after existing token methods (around line 120)

def create_test_token(self, user_data: Dict[str, Any]) -> str:
    """
    Create JWT access token with test mode indicator.

    Args:
        user_data: Test user data with email, name, role

    Returns:
        JWT token with test_mode=true claim
    """
    to_encode = user_data.copy()

    # Use extended expiry for test tokens (development convenience)
    from app.core.config import settings
    expire = datetime.utcnow() + timedelta(
        minutes=settings.TEST_TOKEN_EXPIRY_MINUTES
    )

    to_encode.update({
        "exp": expire,
        "type": "access",
        "test_mode": True,  # Critical: Mark as test token
        "iss": settings.JWT_ISSUER,
        "aud": settings.JWT_AUDIENCE,
    })

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt

def create_test_refresh_token(self, user_data: Dict[str, Any]) -> str:
    """
    Create JWT refresh token for test mode.

    Args:
        user_data: Test user data

    Returns:
        JWT refresh token with test_mode=true claim
    """
    from app.core.config import settings

    to_encode = {
        "sub": user_data["email"],
        "test_mode": True,
    }

    expire = datetime.utcnow() + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )

    to_encode.update({
        "exp": expire,
        "type": "refresh",
        "iss": settings.JWT_ISSUER,
        "aud": settings.JWT_AUDIENCE,
    })

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt

def create_test_tokens(self, user_data: Dict[str, Any]) -> Dict[str, str]:
    """
    Create both access and refresh tokens for test mode.

    Args:
        user_data: Test user data with id, email, name, role

    Returns:
        Dict with access_token, refresh_token, and auth_mode
    """
    token_data = {
        "sub": user_data["email"],
        "email": user_data["email"],
        "name": user_data["name"],
        "role": user_data["role"],
        "provider": "test",
        "user_id": user_data["id"],
    }

    access_token = self.create_test_token(token_data)
    refresh_token = self.create_test_refresh_token(token_data)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "auth_mode": "test",  # Frontend uses this for UI state
    }

def verify_test_token(self, token: str) -> Dict[str, Any]:
    """
    Verify JWT token and ensure test tokens are only used in development.

    Args:
        token: JWT token to verify

    Returns:
        Decoded payload with test_mode flag

    Raises:
        ValueError: If token is invalid or test mode in production
    """
    from app.core.config import settings

    # Decode and verify token
    payload = self.verify_token(token)

    # Security check: Reject test tokens in production
    if payload.get("test_mode") and settings.ENVIRONMENT == "production":
        logging.error(
            "Test mode token rejected in production environment. "
            f"Token subject: {payload.get('sub')}"
        )
        raise ValueError(
            "Test mode authentication is not allowed in production environment"
        )

    return payload
```

### Step 5: Test Auth Router

**File**: `backend/app/routers/auth_test.py` (NEW FILE)

```python
"""
Test Authentication Endpoints
DEVELOPMENT ONLY - Automatically disabled in production

Provides mock authentication for development without OAuth setup.
"""

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
from typing import List, Dict, Any
import logging

from app.core.config import settings
from app.services.auth import AuthService
from app.services.user_service import UserService

router = APIRouter()
logger = logging.getLogger(__name__)


class TestLoginRequest(BaseModel):
    """Request model for test authentication"""

    email: str = Field(
        ...,
        description="Test user email (must end with @test.local)",
        example="admin@test.local"
    )

    @validator("email")
    def validate_test_email(cls, v: str) -> str:
        """Validate test user email domain"""
        if not v.endswith("@test.local"):
            raise ValueError("Test users must use @test.local email domain")
        return v.lower()


class TestUserResponse(BaseModel):
    """Response model for test user data"""

    id: str
    email: str
    name: str
    role: str
    is_test_user: bool


def _check_test_mode_available():
    """
    Check if test mode is available and raise exception if not.
    Centralized check for all test endpoints.
    """
    if not settings.is_test_mode_available():
        logger.warning(
            f"Test authentication blocked - Environment: {settings.ENVIRONMENT}, "
            f"DEBUG: {settings.DEBUG}, TEST_AUTH_ENABLED: {settings.TEST_AUTH_ENABLED}"
        )
        raise HTTPException(
            status_code=403,
            detail={
                "error": "Test authentication not available",
                "reason": "Test mode is disabled in this environment",
                "environment": settings.ENVIRONMENT,
            }
        )


@router.post("/test/login")
async def test_login(request: TestLoginRequest, http_request: Request):
    """
    Authenticate with test user - DEVELOPMENT ONLY

    Allows login with pre-seeded test users without OAuth flow.

    **Available test users:**
    - admin@test.local (role: admin)
    - editor@test.local (role: editor)
    - viewer@test.local (role: editor)

    **Security:**
    - Automatically disabled in production environment
    - Only accepts @test.local email domains
    - Tokens marked with test_mode=true claim
    - Rate limited to prevent abuse

    **Returns:**
    - access_token: JWT access token (8 hour expiry)
    - refresh_token: JWT refresh token
    - user: User profile data
    - auth_mode: Always "test"
    - test_mode_warning: Banner message for UI
    """
    _check_test_mode_available()

    try:
        client_ip = http_request.client.host if http_request.client else "unknown"

        # Get test user from database
        user_service = UserService()
        user = user_service.get_test_user_by_email(request.email)

        if not user:
            # Provide helpful error message
            available_users = user_service.list_test_users()
            available_emails = [u["email"] for u in available_users]

            logger.warning(
                f"Test login failed - user not found: {request.email} from IP: {client_ip}"
            )

            raise HTTPException(
                status_code=404,
                detail={
                    "error": "Test user not found",
                    "email": request.email,
                    "available_users": available_emails,
                    "hint": "Use one of the available test users or run seed script"
                }
            )

        # Update last login timestamp
        user_service.update_last_login(user["id"])

        # Generate test JWT tokens
        auth_service = AuthService()
        tokens = auth_service.create_test_tokens(user)

        logger.info(
            f"Test login successful: {request.email} (role: {user['role']}) "
            f"from IP: {client_ip}"
        )

        return JSONResponse({
            "access_token": tokens["access_token"],
            "refresh_token": tokens["refresh_token"],
            "token_type": "bearer",
            "auth_mode": "test",
            "user": {
                "id": user["id"],
                "email": user["email"],
                "name": user["name"],
                "role": user["role"],
                "provider": "test",
            },
            "test_mode_warning": settings.TEST_MODE_BANNER_MESSAGE,
        })

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Test login error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Test authentication failed: {str(e)}"
        )


@router.get("/test/users", response_model=List[TestUserResponse])
async def list_test_users():
    """
    List all available test users - DEVELOPMENT ONLY

    Returns list of test users that can be used for authentication.
    Useful for displaying available options in UI.
    """
    _check_test_mode_available()

    try:
        user_service = UserService()
        users = user_service.list_test_users()

        logger.debug(f"Listed {len(users)} test users")

        return [
            TestUserResponse(
                id=user["id"],
                email=user["email"],
                name=user["name"],
                role=user["role"],
                is_test_user=user["is_test_user"]
            )
            for user in users
        ]

    except Exception as e:
        logger.error(f"Failed to list test users: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list test users: {str(e)}"
        )


@router.post("/test/reset")
async def reset_test_users():
    """
    Reset test users to default state - DEVELOPMENT ONLY

    Deletes all test users and re-seeds the default set.
    Useful for cleaning up test data during development.

    **Warning**: This will delete all test users and invalidate their tokens.
    """
    _check_test_mode_available()

    try:
        user_service = UserService()
        deleted_count = user_service.reset_test_users()

        logger.info(f"Reset test users: {deleted_count} deleted, defaults re-seeded")

        return JSONResponse({
            "message": "Test users reset successfully",
            "deleted_count": deleted_count,
            "seeded_users": [
                "admin@test.local",
                "editor@test.local",
                "viewer@test.local"
            ]
        })

    except Exception as e:
        logger.error(f"Failed to reset test users: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to reset test users: {str(e)}"
        )


@router.get("/test/status")
async def test_auth_status() -> Dict[str, Any]:
    """
    Get test authentication status and configuration

    Returns current test mode configuration, useful for health checks
    and debugging.
    """
    return JSONResponse({
        "test_mode_available": settings.is_test_mode_available(),
        "environment": settings.ENVIRONMENT,
        "debug_mode": settings.DEBUG,
        "config": settings.get_test_auth_config(),
        "banner_message": settings.TEST_MODE_BANNER_MESSAGE,
    })
```

### Step 6: Application Integration

**File**: `backend/app/main.py`

Add these changes:

```python
# Add after imports (around line 20)
from app.core.config import settings

# Add after app = create_app() (around line 135)

@app.on_event("startup")
async def startup_event():
    """
    Application startup tasks.
    Runs once when the application starts.
    """
    logger.info(f"Starting AI-Doc-Editor API in {settings.ENVIRONMENT} mode")

    # Seed test users in development
    if settings.TEST_USERS_AUTO_SEED and settings.is_test_mode_available():
        logger.info("Auto-seeding test users for development...")

        try:
            from app.services.user_service import UserService
            user_service = UserService()
            test_users = user_service.seed_test_users()

            logger.info(
                f"Test users ready: {', '.join([u['email'] for u in test_users])}"
            )
        except Exception as e:
            logger.error(f"Failed to seed test users: {e}", exc_info=True)

    # Validate OAuth configuration
    try:
        oauth_status = settings.validate_oauth_config()

        google_enabled = oauth_status.get("google", {}).get("enabled", False)
        microsoft_enabled = oauth_status.get("microsoft", {}).get("enabled", False)

        if not google_enabled and not microsoft_enabled:
            if settings.ENVIRONMENT == "production":
                logger.error(
                    "CRITICAL: No OAuth providers configured in production! "
                    "Set GOOGLE_CLIENT_ID/SECRET or MICROSOFT_CLIENT_ID/SECRET"
                )
            else:
                logger.warning(
                    "No OAuth providers configured. "
                    "Using test authentication only. "
                    "Configure OAuth for production deployment."
                )
        else:
            providers = []
            if google_enabled:
                providers.append("Google")
            if microsoft_enabled:
                providers.append("Microsoft")
            logger.info(f"OAuth providers enabled: {', '.join(providers)}")

    except Exception as e:
        logger.error(f"OAuth configuration validation failed: {e}", exc_info=True)

    logger.info("Application startup complete")


# Update router includes (around line 130)
# Add after existing auth router
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])

# Conditionally include test auth router
if settings.is_test_mode_available():
    from app.routers import auth_test
    app.include_router(auth_test.router, prefix="/api/auth", tags=["auth-test"])
    logger.info("✅ Test authentication endpoints enabled")
else:
    logger.info("❌ Test authentication endpoints disabled (production mode)")
```

### Step 7: Database Seed Script

**File**: `backend/scripts/seed_test_users.py` (NEW FILE)

```python
#!/usr/bin/env python3
"""
Seed test users for development
Standalone script for manual test user management
"""

import sys
import logging
from pathlib import Path

# Add backend to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.user_service import UserService
from app.core.config import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def main():
    """Seed test users"""
    logger.info("=" * 60)
    logger.info("Test User Seeding Script")
    logger.info("=" * 60)

    # Validate environment
    if settings.ENVIRONMENT == "production":
        logger.error("❌ Cannot seed test users in production environment")
        logger.error("   Set ENVIRONMENT=development in .env file")
        sys.exit(1)

    if not settings.TEST_AUTH_ENABLED:
        logger.error("❌ Test authentication is disabled")
        logger.error("   Set TEST_AUTH_ENABLED=true in .env file")
        sys.exit(1)

    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Test auth enabled: {settings.TEST_AUTH_ENABLED}")
    logger.info("")

    # Seed test users
    logger.info("🌱 Seeding test users...")
    logger.info("")

    try:
        user_service = UserService()
        users = user_service.seed_test_users()

        logger.info(f"✅ Successfully created/verified {len(users)} test users:")
        logger.info("")

        for user in users:
            logger.info(f"  📧 {user['email']}")
            logger.info(f"     Name: {user['name']}")
            logger.info(f"     Role: {user['role']}")
            logger.info(f"     ID: {user['id']}")
            logger.info("")

        logger.info("=" * 60)
        logger.info("🚀 Test authentication ready!")
        logger.info("")
        logger.info("Test the endpoint:")
        logger.info("  curl -X POST http://localhost:8000/api/auth/test/login \\")
        logger.info("    -H 'Content-Type: application/json' \\")
        logger.info("    -d '{\"email\": \"admin@test.local\"}'")
        logger.info("")
        logger.info("Start the API:")
        logger.info("  cd backend && uvicorn app.main:app --reload")
        logger.info("=" * 60)

    except Exception as e:
        logger.error(f"❌ Failed to seed test users: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
```

Make it executable:

```bash
chmod +x backend/scripts/seed_test_users.py
```

### Step 8: Development Setup Script

**File**: `scripts/setup-dev-auth.sh` (NEW FILE)

```bash
#!/bin/bash
# Development Authentication Setup Script
# Sets up test authentication for local development

set -e  # Exit on error

echo "========================================"
echo "  AI-Doc-Editor Development Setup"
echo "  Test Authentication Configuration"
echo "========================================"
echo ""

# Check if we're in the root directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the project root directory"
    exit 1
fi

# Step 1: Environment configuration
echo "📝 Step 1: Configuring environment variables..."

if [ ! -f "backend/.env" ]; then
    echo "Creating backend/.env from template..."

    cat > backend/.env << 'EOF'
# Development Environment
ENVIRONMENT=development
DEBUG=true

# Test Authentication (Development Only)
TEST_AUTH_ENABLED=true
TEST_USERS_AUTO_SEED=true
TEST_TOKEN_EXPIRY_MINUTES=480

# JWT Configuration
SECRET_KEY=dev-secret-key-change-in-production-$(openssl rand -hex 32)
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS Configuration
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173"]

# OAuth (Optional - Leave empty for test mode only)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=

# Database
DATABASE_URL=sqlite+aiosqlite:///./app.db

# Logging
LOG_LEVEL=INFO
SECURITY_LOG_ENABLED=true
EOF

    echo "✅ Created backend/.env"
else
    echo "✅ backend/.env already exists"

    # Ensure test auth settings are present
    if ! grep -q "TEST_AUTH_ENABLED" backend/.env; then
        echo "Adding test auth settings to existing .env..."
        cat >> backend/.env << 'EOF'

# Test Authentication (Development Only)
TEST_AUTH_ENABLED=true
TEST_USERS_AUTO_SEED=true
TEST_TOKEN_EXPIRY_MINUTES=480
EOF
        echo "✅ Updated backend/.env with test auth settings"
    fi
fi

echo ""

# Step 2: Database migration
echo "🗄️  Step 2: Running database migrations..."

cd backend

if [ ! -f "app.db" ]; then
    echo "Creating new database..."
    python scripts/init_db.py
    echo "✅ Database created"
else
    echo "Database exists, checking for migrations..."
fi

# Apply test user migration if needed
if ! sqlite3 app.db "PRAGMA table_info(users);" | grep -q "is_test_user"; then
    echo "Applying test user migration..."
    sqlite3 app.db < migrations/001_add_test_user_support.sql
    echo "✅ Migration applied"
else
    echo "✅ Migration already applied"
fi

echo ""

# Step 3: Seed test users
echo "🌱 Step 3: Seeding test users..."
python scripts/seed_test_users.py

cd ..

echo ""
echo "========================================"
echo "✅  Development setup complete!"
echo "========================================"
echo ""
echo "📋 Available test users:"
echo "   • admin@test.local   (admin role)"
echo "   • editor@test.local  (editor role)"
echo "   • viewer@test.local  (editor role)"
echo ""
echo "🚀 Next steps:"
echo "   1. Start the backend:  cd backend && uvicorn app.main:app --reload"
echo "   2. Start the frontend: yarn dev"
echo "   3. Open http://localhost:5173"
echo "   4. Click 'Show Test Login' and select a test user"
echo ""
echo "🔍 Test the API:"
echo "   curl http://localhost:8000/api/auth/test/status"
echo ""
echo "========================================"
```

Make it executable:

```bash
chmod +x scripts/setup-dev-auth.sh
```

## Testing the Implementation

### Manual Testing Checklist

```bash
# 1. Test environment configuration
python -c "from backend.app.core.config import settings; print(settings.is_test_mode_available())"
# Expected: True (in development)

# 2. Test database migration
sqlite3 backend/app.db "PRAGMA table_info(users);"
# Expected: Should show is_test_user column

# 3. Test test user seeding
cd backend && python scripts/seed_test_users.py
# Expected: Creates 3 test users

# 4. Test status endpoint
curl http://localhost:8000/api/auth/test/status
# Expected: {"test_mode_available": true, ...}

# 5. Test login endpoint
curl -X POST http://localhost:8000/api/auth/test/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.local"}'
# Expected: Returns access_token, refresh_token, user

# 6. Test list users endpoint
curl http://localhost:8000/api/auth/test/users
# Expected: Returns array of 3 test users

# 7. Test production blocking
ENVIRONMENT=production python -c "from backend.app.core.config import settings; print(settings.is_test_mode_available())"
# Expected: False
```

### Automated Testing

Create test file: `backend/tests/test_auth_test_mode.py`

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_test_mode_status():
    """Test mode status endpoint should return config"""
    response = client.get("/api/auth/test/status")
    assert response.status_code == 200
    data = response.json()
    assert "test_mode_available" in data
    assert data["environment"] == "development"


def test_test_login_success():
    """Test login with valid test user"""
    response = client.post(
        "/api/auth/test/login",
        json={"email": "admin@test.local"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["auth_mode"] == "test"
    assert data["user"]["email"] == "admin@test.local"
    assert data["user"]["role"] == "admin"


def test_test_login_invalid_domain():
    """Test login with invalid email domain"""
    response = client.post(
        "/api/auth/test/login",
        json={"email": "admin@gmail.com"}
    )
    assert response.status_code == 422  # Validation error


def test_list_test_users():
    """Test listing all test users"""
    response = client.get("/api/auth/test/users")
    assert response.status_code == 200
    users = response.json()
    assert len(users) >= 3
    emails = [u["email"] for u in users]
    assert "admin@test.local" in emails
```

Run tests:

```bash
cd backend
pytest tests/test_auth_test_mode.py -v
```

## Troubleshooting

### Common Issues

1. **Migration fails**:
   ```bash
   # Check current schema
   sqlite3 backend/app.db ".schema users"

   # Drop and recreate database if needed
   rm backend/app.db
   python backend/scripts/init_db.py
   sqlite3 backend/app.db < backend/migrations/001_add_test_user_support.sql
   ```

2. **Test users not found**:
   ```bash
   # Re-run seed script
   cd backend && python scripts/seed_test_users.py

   # Check database
   sqlite3 app.db "SELECT email, role, is_test_user FROM users WHERE is_test_user = 1;"
   ```

3. **403 Forbidden on test endpoints**:
   ```bash
   # Check environment variable
   cd backend && python -c "from app.core.config import settings; print(f'ENV: {settings.ENVIRONMENT}, TEST_AUTH: {settings.TEST_AUTH_ENABLED}')"

   # Should show: ENV: development, TEST_AUTH: True
   ```

## Next Steps

After completing this implementation:

1. **Frontend Integration**: Implement React components (see DUAL-MODE-AUTH-ARCHITECTURE.md Section 4)
2. **E2E Testing**: Create Playwright tests for auth flows
3. **Documentation**: Update README with test auth instructions
4. **Production Deployment**: Configure OAuth credentials for production

---

**Questions?** See DUAL-MODE-AUTH-ARCHITECTURE.md for complete architecture details.
