# Dual-Mode Authentication Architecture

**Status**: Design Proposal
**Version**: 1.0
**Created**: 2025-10-08
**Authors**: Backend Architect

**IMPORTANT CLARIFICATION**: This document describes **dual authentication providers** (OAuth vs Test), NOT API key storage modes. As of Issue #29 (completed 2025-10-11), API key management uses **single-mode backend-only storage** with no localStorage fallback. This authentication architecture is independent of API key management.

## Executive Summary

This document provides a comprehensive architecture for implementing dual-mode authentication in AI-Doc-Editor, enabling both production OAuth 2.0 and test authentication modes without compromising security or developer experience.

## Problem Statement

**Current State**: Production OAuth (Google/Microsoft) requires external setup (Cloud Console, Azure AD, client credentials, redirect URIs).

**Challenge**: Cannot test authenticated features without completing OAuth provider setup first.

**Requirements**:
1. Support BOTH production OAuth AND test authentication simultaneously
2. Test all app features without OAuth credentials
3. Support multiple test users with different roles (admin/editor)
4. Maintain production security integrity
5. Easy toggle between test and production modes
6. Clear visual indicators when in test mode

## System Architecture

### 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Authentication UI Layer                      │   │
│  │  ┌───────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │ Login Screen  │  │ Test Banner  │  │ User Profile │  │   │
│  │  └───────────────┘  └──────────────┘  └──────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Zustand Auth Store                          │   │
│  │  • isAuthenticated  • user  • authMode (oauth|test)     │   │
│  │  • accessToken  • refreshToken  • isTestMode flag       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  │ HTTPS + JWT
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (FastAPI)                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Auth Routing Layer                          │   │
│  │  ┌──────────────┐           ┌──────────────┐            │   │
│  │  │ OAuth Routes │           │ Test Routes  │            │   │
│  │  │ /auth/login  │           │ /auth/test/* │            │   │
│  │  │ /auth/callback│          │ (disabled in │            │   │
│  │  │ /auth/refresh│           │  production) │            │   │
│  │  └──────────────┘           └──────────────┘            │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Auth Service Layer                          │   │
│  │  • JWT generation/validation (shared)                    │   │
│  │  • Token refresh logic (shared)                         │   │
│  │  • User verification (mode-aware)                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              User Service Layer                          │   │
│  │  • get_or_create_user (OAuth flow)                      │   │
│  │  • get_test_user (Test flow)                            │   │
│  │  • seed_test_users (Development only)                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE (SQLite)                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │   users table                                            │   │
│  │   • id, email, name, provider, role                      │   │
│  │   • is_test_user (boolean flag)                         │   │
│  │   • is_active, created_at, updated_at, last_login_at    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Authentication Flow Comparison

#### Production OAuth Flow (Unchanged)
```
User → Click "Login with Google"
    → Backend /auth/login?provider=google
    → Redirect to Google OAuth consent
    → User approves
    → Google callback with code
    → Backend /auth/callback?code=xxx
    → Exchange code for access token
    → Fetch user info from Google
    → Create/update user in DB (provider=google, is_test_user=false)
    → Generate JWT tokens
    → Return {accessToken, refreshToken, user}
    → Frontend stores tokens + user
```

#### Test Authentication Flow (New)
```
User → Click "Login as Test User"
    → Backend /auth/test/login
    → Request body: {email: "admin@test.local"}
    → Validate test mode enabled (ENVIRONMENT != production)
    → Lookup test user in DB (is_test_user=true)
    → Generate JWT tokens (include test_mode claim)
    → Return {accessToken, refreshToken, user, authMode: "test"}
    → Frontend stores tokens + sets isTestMode flag
    → Display test mode banner
```

## Implementation Design

### 3. Backend Components

#### 3.1 Configuration Extension (app/core/config.py)

```python
class Settings(BaseSettings):
    # Existing OAuth settings...

    # Test authentication settings
    TEST_AUTH_ENABLED: bool = True  # Auto-disabled in production
    TEST_USERS_AUTO_SEED: bool = True  # Auto-seed test users on startup
    TEST_TOKEN_EXPIRY_MINUTES: int = 480  # 8 hours for development convenience
    TEST_MODE_BANNER_MESSAGE: str = "TEST MODE - Using mock authentication"

    # Security: Test mode restrictions
    TEST_MODE_MAX_SESSIONS: int = 10  # Limit concurrent test sessions
    TEST_MODE_IP_WHITELIST: List[str] = ["127.0.0.1", "localhost"]

    @validator("TEST_AUTH_ENABLED")
    def disable_test_auth_in_production(cls, v: bool, values: Dict[str, Any]) -> bool:
        """Force disable test auth in production environment"""
        environment = values.get("ENVIRONMENT", "development")
        if environment == "production":
            if v:
                logging.warning("TEST_AUTH_ENABLED forced to False in production")
            return False
        return v

    def is_test_mode_available(self) -> bool:
        """Check if test authentication is available"""
        return (
            self.TEST_AUTH_ENABLED
            and self.ENVIRONMENT != "production"
            and self.DEBUG
        )
```

#### 3.2 Database Migration (Add is_test_user column)

```sql
-- Migration: Add test user support
ALTER TABLE users ADD COLUMN is_test_user BOOLEAN DEFAULT 0;
CREATE INDEX idx_users_is_test_user ON users(is_test_user);
CREATE INDEX idx_users_provider_test ON users(provider, is_test_user);

-- Add constraint: test users must have @test.local domain
CREATE TRIGGER validate_test_user_email
BEFORE INSERT ON users
WHEN NEW.is_test_user = 1 AND NEW.email NOT LIKE '%@test.local'
BEGIN
    SELECT RAISE(ABORT, 'Test users must use @test.local email domain');
END;
```

#### 3.3 User Service Extension (app/services/user_service.py)

```python
class UserService:
    # Existing methods...

    def seed_test_users(self) -> List[Dict[str, Any]]:
        """
        Seed default test users for development.
        Called on application startup if TEST_USERS_AUTO_SEED=True.

        Returns:
            List of created test users
        """
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
            if existing and existing.get("is_test_user"):
                created_users.append(existing)
                continue

            # Create test user
            user = self._create_test_user(**user_data)
            created_users.append(user)

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
        """
        # Validation
        if not email.endswith("@test.local"):
            raise ValueError("Test users must use @test.local email domain")
        if provider != "test":
            raise ValueError("Test users must use 'test' provider")

        user_id = str(uuid4())
        now = datetime.utcnow().isoformat()

        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT INTO users
            (id, email, name, provider, role, is_active, is_test_user, created_at, updated_at, last_login_at)
            VALUES (?, ?, ?, ?, ?, 1, 1, ?, ?, ?)
            """,
            (user_id, email, name, provider, role, now, now, now),
        )
        conn.commit()
        conn.close()

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

    def get_test_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """
        Get test user by email.

        Args:
            email: Test user email

        Returns:
            Test user dict or None
        """
        conn = self._get_connection()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute(
            "SELECT * FROM users WHERE email = ? AND is_test_user = 1 AND is_active = 1",
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
            List of test user dicts
        """
        conn = self._get_connection()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute(
            "SELECT * FROM users WHERE is_test_user = 1 AND is_active = 1 ORDER BY role DESC, name ASC"
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
        """
        from app.core.config import settings
        if settings.ENVIRONMENT == "production":
            raise RuntimeError("Cannot reset test users in production environment")

        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute("DELETE FROM users WHERE is_test_user = 1")
        deleted_count = cursor.rowcount
        conn.commit()
        conn.close()

        # Re-seed default test users
        self.seed_test_users()

        return deleted_count
```

#### 3.4 Auth Service Extension (app/services/auth.py)

```python
class AuthService:
    # Existing methods...

    def create_test_token(self, user_data: Dict[str, Any]) -> str:
        """
        Create JWT access token with test mode indicator.

        Args:
            user_data: Test user data

        Returns:
            JWT token with test_mode=true claim
        """
        to_encode = user_data.copy()

        # Use extended expiry for test tokens (convenience)
        expire = datetime.utcnow() + timedelta(minutes=settings.TEST_TOKEN_EXPIRY_MINUTES)

        to_encode.update({
            "exp": expire,
            "type": "access",
            "test_mode": True,  # Critical: Mark as test token
            "iss": settings.JWT_ISSUER,
            "aud": settings.JWT_AUDIENCE,
        })

        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt

    def create_test_tokens(self, user_data: Dict[str, Any]) -> Dict[str, str]:
        """
        Create both access and refresh tokens for test mode.

        Args:
            user_data: Test user data

        Returns:
            Dict with access_token and refresh_token
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

        # Refresh token also marked as test mode
        refresh_data = {
            "sub": user_data["email"],
            "test_mode": True,
        }
        refresh_token = self.create_refresh_token(refresh_data)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "auth_mode": "test",  # Frontend uses this for UI state
        }

    def verify_test_token(self, token: str) -> Dict[str, Any]:
        """
        Verify JWT token and check if it's a test token.

        Args:
            token: JWT token to verify

        Returns:
            Decoded payload with test_mode flag

        Raises:
            ValueError: If token is invalid or test mode in production
        """
        from app.core.config import settings

        payload = self.verify_token(token)

        # Security check: Reject test tokens in production
        if payload.get("test_mode") and settings.ENVIRONMENT == "production":
            raise ValueError("Test mode tokens not allowed in production")

        return payload
```

#### 3.5 Test Auth Router (app/routers/auth_test.py) - NEW FILE

```python
"""
Test Authentication Endpoints
DEVELOPMENT ONLY - Disabled in production
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List
import logging

from app.core.config import settings
from app.services.auth import AuthService
from app.services.user_service import UserService

# Conditional router - only active in development
router = APIRouter()
logger = logging.getLogger(__name__)


class TestLoginRequest(BaseModel):
    """Request model for test login"""
    email: str = Field(..., description="Test user email (must end with @test.local)")

    class Config:
        schema_extra = {
            "example": {
                "email": "admin@test.local"
            }
        }


class TestUserResponse(BaseModel):
    """Response model for test user listing"""
    id: str
    email: str
    name: str
    role: str
    is_test_user: bool


# Middleware to block test endpoints in production
@router.middleware("http")
async def block_in_production(request: Request, call_next):
    """Block all test auth endpoints in production"""
    if settings.ENVIRONMENT == "production":
        logger.warning(f"Test auth endpoint blocked in production: {request.url.path}")
        return JSONResponse(
            status_code=403,
            content={"error": "Test authentication not available in production"}
        )
    return await call_next(request)


@router.post("/test/login")
async def test_login(request: TestLoginRequest):
    """
    Test authentication endpoint - DEVELOPMENT ONLY

    Allows login with pre-seeded test users without OAuth flow.

    Available test users:
    - admin@test.local (role: admin)
    - editor@test.local (role: editor)
    - viewer@test.local (role: editor)

    **Security**:
    - Automatically disabled in production environment
    - Only accepts @test.local email domains
    - Tokens marked with test_mode=true claim
    """
    if not settings.is_test_mode_available():
        raise HTTPException(
            status_code=403,
            detail="Test authentication is disabled"
        )

    try:
        # Validate test email domain
        if not request.email.endswith("@test.local"):
            raise HTTPException(
                status_code=400,
                detail="Test users must use @test.local email domain"
            )

        # Get test user from database
        user_service = UserService()
        user = user_service.get_test_user_by_email(request.email)

        if not user:
            raise HTTPException(
                status_code=404,
                detail=f"Test user not found: {request.email}. "
                       f"Available: admin@test.local, editor@test.local, viewer@test.local"
            )

        # Update last login
        user_service.update_last_login(user["id"])

        # Generate test JWT tokens
        auth_service = AuthService()
        tokens = auth_service.create_test_tokens(user)

        logger.info(f"Test login successful: {request.email} (role: {user['role']})")

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
        logger.error(f"Test login failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Test authentication failed: {str(e)}"
        )


@router.get("/test/users")
async def list_test_users() -> List[TestUserResponse]:
    """
    List all available test users - DEVELOPMENT ONLY

    Returns list of test users that can be used for authentication.
    """
    if not settings.is_test_mode_available():
        raise HTTPException(
            status_code=403,
            detail="Test authentication is disabled"
        )

    try:
        user_service = UserService()
        users = user_service.list_test_users()

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
        logger.error(f"Failed to list test users: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list test users: {str(e)}"
        )


@router.post("/test/reset")
async def reset_test_users():
    """
    Reset test users to default state - DEVELOPMENT ONLY

    Deletes all test users and re-seeds the default set.
    Useful for cleaning up test data.
    """
    if not settings.is_test_mode_available():
        raise HTTPException(
            status_code=403,
            detail="Test authentication is disabled"
        )

    try:
        user_service = UserService()
        deleted_count = user_service.reset_test_users()

        logger.info(f"Reset test users: {deleted_count} deleted, defaults re-seeded")

        return JSONResponse({
            "message": "Test users reset successfully",
            "deleted_count": deleted_count,
            "seeded_users": ["admin@test.local", "editor@test.local", "viewer@test.local"]
        })

    except Exception as e:
        logger.error(f"Failed to reset test users: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to reset test users: {str(e)}"
        )


@router.get("/test/status")
async def test_auth_status():
    """
    Get test authentication status and configuration
    """
    return JSONResponse({
        "test_mode_enabled": settings.is_test_mode_available(),
        "environment": settings.ENVIRONMENT,
        "auto_seed_enabled": settings.TEST_USERS_AUTO_SEED,
        "token_expiry_minutes": settings.TEST_TOKEN_EXPIRY_MINUTES,
        "banner_message": settings.TEST_MODE_BANNER_MESSAGE,
    })
```

#### 3.6 Application Startup Hook (app/main.py)

```python
# Add to main.py after app = create_app()

@app.on_event("startup")
async def startup_event():
    """Application startup tasks"""
    from app.services.user_service import UserService
    from app.core.config import settings

    # Seed test users in development
    if settings.TEST_USERS_AUTO_SEED and settings.is_test_mode_available():
        logger.info("Auto-seeding test users for development...")
        user_service = UserService()
        test_users = user_service.seed_test_users()
        logger.info(f"Test users available: {[u['email'] for u in test_users]}")

    # Validate OAuth configuration
    oauth_status = settings.validate_oauth_config()
    if not oauth_status["google"]["enabled"] and not oauth_status["microsoft"]["enabled"]:
        if settings.ENVIRONMENT == "production":
            logger.error("No OAuth providers configured in production!")
        else:
            logger.warning("No OAuth providers configured. Using test authentication only.")


# Update router includes
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])

# Conditionally include test auth router
if settings.is_test_mode_available():
    from app.routers import auth_test
    app.include_router(auth_test.router, prefix="/api/auth", tags=["auth-test"])
    logger.info("Test authentication endpoints enabled")
```

### 4. Frontend Components

#### 4.1 Auth Store Extension (src/store/auth-slice.ts)

```typescript
export interface AuthSlice {
  // Existing fields...
  isAuthenticated: boolean;
  accessToken?: string;
  refreshToken?: string;
  user?: User;

  // NEW: Test mode tracking
  authMode?: 'oauth' | 'test';
  isTestMode: boolean;

  // Existing methods...
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  logout: () => void;

  // NEW: Test mode methods
  setAuthMode: (mode: 'oauth' | 'test') => void;
  loginWithTestUser: (email: string) => Promise<void>;
}

export const createAuthSlice: StoreSlice<AuthSlice> = (set, get) => ({
  // Existing state...
  isAuthenticated: false,
  accessToken: undefined,
  refreshToken: undefined,
  user: undefined,

  // NEW: Test mode state
  authMode: undefined,
  isTestMode: false,

  // Existing methods...
  setTokens: (accessToken: string, refreshToken: string) => {
    set((prev: AuthSlice) => ({
      ...prev,
      accessToken,
      refreshToken,
      isAuthenticated: true,
    }));
  },

  setUser: (user: User) => {
    set((prev: AuthSlice) => ({
      ...prev,
      user,
      isAuthenticated: true,
    }));
  },

  logout: () => {
    set((prev: AuthSlice) => ({
      ...prev,
      accessToken: undefined,
      refreshToken: undefined,
      user: undefined,
      isAuthenticated: false,
      authMode: undefined,
      isTestMode: false,
    }));
  },

  // NEW: Test mode methods
  setAuthMode: (mode: 'oauth' | 'test') => {
    set((prev: AuthSlice) => ({
      ...prev,
      authMode: mode,
      isTestMode: mode === 'test',
    }));
  },

  loginWithTestUser: async (email: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/test/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Test login failed');
      }

      const data = await response.json();

      // Store tokens and user data
      set((prev: AuthSlice) => ({
        ...prev,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        user: data.user,
        isAuthenticated: true,
        authMode: 'test',
        isTestMode: true,
      }));

      // Store in localStorage for persistence
      localStorage.setItem('auth_tokens', JSON.stringify({
        access: data.access_token,
        refresh: data.refresh_token,
      }));
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      localStorage.setItem('auth_mode', 'test');

      console.log(`[TEST MODE] Logged in as ${email} (${data.user.role})`);

    } catch (error) {
      console.error('Test login error:', error);
      throw error;
    }
  },
});
```

#### 4.2 Test Login Component (src/components/Auth/TestLogin.tsx) - NEW FILE

```typescript
import React, { useState } from 'react';
import { useStore } from '@store';

interface TestUser {
  email: string;
  name: string;
  role: string;
  description: string;
}

const TEST_USERS: TestUser[] = [
  {
    email: 'admin@test.local',
    name: 'Test Admin',
    role: 'admin',
    description: 'Full access to all features including admin panel'
  },
  {
    email: 'editor@test.local',
    name: 'Test Editor',
    role: 'editor',
    description: 'Standard user with document editing capabilities'
  },
  {
    email: 'viewer@test.local',
    name: 'Test Viewer',
    role: 'editor',
    description: 'Another editor for testing collaboration features'
  },
];

export const TestLogin: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loginWithTestUser = useStore((state) => state.loginWithTestUser);

  const handleTestLogin = async (email: string) => {
    setLoading(true);
    setError(null);

    try {
      await loginWithTestUser(email);
      // Navigation handled by parent component watching auth state
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="test-login-container">
      <div className="test-mode-banner">
        <span className="warning-icon">⚠️</span>
        <strong>Test Mode</strong>
        <p>Development authentication - no OAuth setup required</p>
      </div>

      <h3 className="test-users-title">Select Test User</h3>

      <div className="test-users-grid">
        {TEST_USERS.map((user) => (
          <button
            key={user.email}
            className="test-user-card"
            onClick={() => handleTestLogin(user.email)}
            disabled={loading}
          >
            <div className="user-header">
              <span className="user-icon">👤</span>
              <div className="user-info">
                <h4>{user.name}</h4>
                <span className={`role-badge role-${user.role}`}>{user.role}</span>
              </div>
            </div>
            <p className="user-description">{user.description}</p>
            <div className="user-email">{user.email}</div>
          </button>
        ))}
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">❌</span>
          {error}
        </div>
      )}

      {loading && <div className="loading-spinner">Logging in...</div>}
    </div>
  );
};
```

#### 4.3 Login Screen Component (src/components/Auth/LoginScreen.tsx)

```typescript
import React, { useState } from 'react';
import { TestLogin } from './TestLogin';

export const LoginScreen: React.FC = () => {
  const [showTestLogin, setShowTestLogin] = useState(false);
  const isDevelopment = import.meta.env.MODE === 'development';

  return (
    <div className="login-screen">
      <div className="login-container">
        <h1>AI Document Editor</h1>
        <p className="subtitle">Secure authentication required</p>

        {/* Production OAuth Login */}
        <div className="oauth-buttons">
          <button className="oauth-btn google-btn">
            <img src="/google-icon.svg" alt="" />
            Sign in with Google
          </button>

          <button className="oauth-btn microsoft-btn">
            <img src="/microsoft-icon.svg" alt="" />
            Sign in with Microsoft
          </button>
        </div>

        {/* Development Test Login */}
        {isDevelopment && (
          <>
            <div className="divider">
              <span>OR</span>
            </div>

            <button
              className="test-mode-toggle"
              onClick={() => setShowTestLogin(!showTestLogin)}
            >
              {showTestLogin ? 'Hide' : 'Show'} Test Login
              <span className="dev-badge">DEV ONLY</span>
            </button>

            {showTestLogin && <TestLogin />}
          </>
        )}
      </div>
    </div>
  );
};
```

#### 4.4 Test Mode Banner Component (src/components/Auth/TestModeBanner.tsx) - NEW FILE

```typescript
import React from 'react';
import { useStore } from '@store';

export const TestModeBanner: React.FC = () => {
  const isTestMode = useStore((state) => state.isTestMode);
  const user = useStore((state) => state.user);
  const logout = useStore((state) => state.logout);

  if (!isTestMode) return null;

  return (
    <div className="test-mode-banner fixed top-0 left-0 right-0 z-50">
      <div className="banner-content">
        <div className="banner-left">
          <span className="warning-icon">⚠️</span>
          <strong>TEST MODE</strong>
          <span className="separator">•</span>
          <span>Logged in as: {user?.email}</span>
          <span className="role-badge">{user?.role}</span>
        </div>

        <button onClick={logout} className="logout-btn">
          Logout
        </button>
      </div>

      <style jsx>{`
        .test-mode-banner {
          background: linear-gradient(90deg, #ff9800 0%, #f57c00 100%);
          color: white;
          padding: 0.75rem 1rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          font-size: 0.875rem;
        }

        .banner-content {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .banner-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .warning-icon {
          font-size: 1.25rem;
        }

        .separator {
          opacity: 0.6;
        }

        .role-badge {
          background: rgba(255,255,255,0.2);
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.75rem;
        }

        .logout-btn {
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.3);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 0.25rem;
          cursor: pointer;
          font-weight: 600;
          transition: background 0.2s;
        }

        .logout-btn:hover {
          background: rgba(255,255,255,0.3);
        }
      `}</style>
    </div>
  );
};
```

## Security Considerations

### 5. Production Safety Mechanisms

#### 5.1 Multi-Layer Protection

```python
# Layer 1: Environment-based auto-disable
@validator("TEST_AUTH_ENABLED")
def disable_test_auth_in_production(cls, v: bool, values: Dict[str, Any]) -> bool:
    if values.get("ENVIRONMENT") == "production":
        return False  # Force disable
    return v

# Layer 2: Middleware protection
@router.middleware("http")
async def block_in_production(request: Request, call_next):
    if settings.ENVIRONMENT == "production":
        return JSONResponse(status_code=403, content={"error": "Forbidden"})
    return await call_next(request)

# Layer 3: Token validation
def verify_test_token(self, token: str) -> Dict[str, Any]:
    payload = self.verify_token(token)
    if payload.get("test_mode") and settings.ENVIRONMENT == "production":
        raise ValueError("Test tokens not allowed in production")
    return payload

# Layer 4: Database constraints
ALTER TABLE users ADD CONSTRAINT test_user_domain
CHECK (is_test_user = 0 OR email LIKE '%@test.local');
```

#### 5.2 Audit Logging

```python
# Log all test authentication events
logger.info(f"Test login: {email} (role: {role}) from IP: {request.client.host}")

# Alert on suspicious patterns
if test_login_count_per_minute > 20:
    logger.warning(f"High test login rate from IP: {request.client.host}")
```

#### 5.3 Visual Indicators

- Persistent banner in test mode (cannot be dismissed)
- Different color scheme for test mode UI
- Console warnings in browser
- Watermark on all pages in test mode

### 6. Configuration Strategy

#### 6.1 Environment Variables

```bash
# .env.development
ENVIRONMENT=development
DEBUG=true
TEST_AUTH_ENABLED=true
TEST_USERS_AUTO_SEED=true
TEST_TOKEN_EXPIRY_MINUTES=480

# .env.production
ENVIRONMENT=production
DEBUG=false
TEST_AUTH_ENABLED=false  # Ignored - auto-disabled
REQUIRE_HTTPS=true
GOOGLE_CLIENT_ID=your-actual-google-client-id
GOOGLE_CLIENT_SECRET=your-actual-google-secret
MICROSOFT_CLIENT_ID=your-actual-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-actual-microsoft-secret
```

#### 6.2 One-Command Setup

```bash
# Development setup script
#!/bin/bash
# scripts/setup-dev-auth.sh

echo "Setting up development authentication..."

# 1. Create development .env if not exists
if [ ! -f .env ]; then
    cp .env.example .env
    echo "ENVIRONMENT=development" >> .env
    echo "TEST_AUTH_ENABLED=true" >> .env
    echo "Created .env file"
fi

# 2. Initialize database
cd backend
python scripts/init_db.py

# 3. Seed test users
python scripts/seed_test_users.py

echo "✅ Development authentication ready!"
echo ""
echo "Available test users:"
echo "  • admin@test.local (admin)"
echo "  • editor@test.local (editor)"
echo "  • viewer@test.local (editor)"
echo ""
echo "Start the app: yarn all:dev"
```

#### 6.3 Database Initialization Script

```python
# backend/scripts/seed_test_users.py
"""
Seed test users for development
"""

import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.user_service import UserService
from app.core.config import settings


def main():
    """Seed test users"""
    if settings.ENVIRONMENT == "production":
        print("❌ Cannot seed test users in production")
        sys.exit(1)

    if not settings.TEST_AUTH_ENABLED:
        print("❌ Test authentication is disabled")
        sys.exit(1)

    print("🌱 Seeding test users...")

    user_service = UserService()
    users = user_service.seed_test_users()

    print(f"✅ Created {len(users)} test users:")
    for user in users:
        print(f"  • {user['email']} ({user['role']})")

    print("\n🚀 Ready for development!")


if __name__ == "__main__":
    main()
```

## Developer Experience

### 7. Usage Workflows

#### 7.1 First-Time Setup

```bash
# 1. Clone repository
git clone https://github.com/BriamV/AI-Doc-Editor.git
cd AI-Doc-Editor

# 2. Run setup script
bash scripts/setup-dev-auth.sh

# 3. Start development
yarn all:dev

# 4. Open browser to http://localhost:5173
# 5. Click "Show Test Login"
# 6. Select "admin@test.local" or "editor@test.local"
# 7. Start developing!
```

#### 7.2 Switching Between Modes

```typescript
// Frontend automatically detects mode based on API response
// No manual switching required - just login with desired method

// Test Mode: Click test user button
loginWithTestUser('admin@test.local')

// Production Mode: Click OAuth button
initiateOAuthFlow('google')

// Both use same JWT validation and protected routes
```

#### 7.3 Testing Different Roles

```bash
# Quick role switching for testing RBAC
# Logout and login with different test user

Admin Features Test:
  1. Login as admin@test.local
  2. Verify admin panel access
  3. Test user management features

Editor Features Test:
  1. Login as editor@test.local
  2. Verify limited permissions
  3. Test document editing

Collaboration Test:
  1. Open two browser windows
  2. Login as admin@test.local in window 1
  3. Login as editor@test.local in window 2
  4. Test real-time collaboration
```

## API Endpoints Reference

### 8. Test Authentication Endpoints

```
POST   /api/auth/test/login        # Login with test user
GET    /api/auth/test/users        # List available test users
POST   /api/auth/test/reset        # Reset test users to defaults
GET    /api/auth/test/status       # Get test mode status

All endpoints return 403 in production environment
```

### 9. Request/Response Examples

#### 9.1 Test Login Request

```http
POST /api/auth/test/login
Content-Type: application/json

{
  "email": "admin@test.local"
}
```

#### 9.2 Test Login Response

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "auth_mode": "test",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "admin@test.local",
    "name": "Test Admin",
    "role": "admin",
    "provider": "test"
  },
  "test_mode_warning": "TEST MODE - Using mock authentication"
}
```

#### 9.3 List Test Users Request

```http
GET /api/auth/test/users
```

#### 9.4 List Test Users Response

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "admin@test.local",
    "name": "Test Admin",
    "role": "admin",
    "is_test_user": true
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "email": "editor@test.local",
    "name": "Test Editor",
    "role": "editor",
    "is_test_user": true
  }
]
```

## File Structure

### 10. New Files to Create

```
backend/
├── app/
│   ├── routers/
│   │   └── auth_test.py              # NEW: Test auth endpoints
│   ├── services/
│   │   ├── auth.py                    # MODIFIED: Add test token methods
│   │   └── user_service.py            # MODIFIED: Add test user methods
│   └── core/
│       └── config.py                  # MODIFIED: Add test auth settings
├── scripts/
│   ├── seed_test_users.py            # NEW: Seed test users script
│   └── setup-dev-auth.sh             # NEW: One-command setup
└── migrations/
    └── add_test_user_support.sql      # NEW: Database migration

frontend/
├── src/
│   ├── components/
│   │   └── Auth/
│   │       ├── TestLogin.tsx          # NEW: Test login UI
│   │       ├── TestModeBanner.tsx     # NEW: Test mode indicator
│   │       └── LoginScreen.tsx        # MODIFIED: Add test mode toggle
│   └── store/
│       └── auth-slice.ts              # MODIFIED: Add test mode state
└── .env.development                   # MODIFIED: Add test auth vars
```

## Testing Strategy

### 11. Test Scenarios

#### 11.1 Security Tests

```python
# test_security.py

def test_test_auth_disabled_in_production():
    """Verify test auth is disabled in production"""
    # Set environment to production
    # Attempt test login
    # Assert 403 Forbidden

def test_test_tokens_rejected_in_production():
    """Verify test tokens are rejected in production"""
    # Generate test token
    # Set environment to production
    # Attempt to use test token
    # Assert 403 Forbidden

def test_test_user_email_validation():
    """Verify test users must use @test.local domain"""
    # Attempt to create test user with regular email
    # Assert validation error
```

#### 11.2 Functional Tests

```python
def test_test_login_flow():
    """Test complete test authentication flow"""
    # Request test login with admin@test.local
    # Assert token received
    # Assert user data correct
    # Assert auth_mode = 'test'

def test_role_based_access_with_test_users():
    """Test RBAC with test users"""
    # Login as admin@test.local
    # Access admin endpoint → 200 OK
    # Login as editor@test.local
    # Access admin endpoint → 403 Forbidden
```

#### 11.3 Integration Tests

```typescript
// test/auth.test.ts

describe('Test Authentication', () => {
  it('should login with test user', async () => {
    const response = await testLogin('admin@test.local');
    expect(response.auth_mode).toBe('test');
    expect(response.user.role).toBe('admin');
  });

  it('should display test mode banner', async () => {
    await testLogin('admin@test.local');
    const banner = screen.getByText(/TEST MODE/i);
    expect(banner).toBeVisible();
  });

  it('should persist test mode across page refresh', async () => {
    await testLogin('editor@test.local');
    window.location.reload();
    expect(store.getState().isTestMode).toBe(true);
  });
});
```

## Migration Path

### 12. Rollout Plan

#### Phase 1: Backend Implementation (Day 1)
- Add test auth configuration to Settings
- Implement database migration (add is_test_user column)
- Extend UserService with test user methods
- Extend AuthService with test token methods
- Create auth_test router
- Add startup hook for auto-seeding

#### Phase 2: Frontend Implementation (Day 1-2)
- Extend auth store with test mode state
- Create TestLogin component
- Create TestModeBanner component
- Update LoginScreen with test mode toggle
- Add test mode styling

#### Phase 3: Developer Tools (Day 2)
- Create setup-dev-auth.sh script
- Create seed_test_users.py script
- Update documentation
- Create developer quick-start guide

#### Phase 4: Testing (Day 2-3)
- Security tests (production blocking)
- Functional tests (login flows)
- Integration tests (frontend + backend)
- Manual testing (all test users, all roles)

#### Phase 5: Documentation (Day 3)
- Update README with test auth instructions
- Create developer guide
- Document all test endpoints
- Create troubleshooting guide

## Security Checklist

### 13. Production Safety Verification

- [ ] TEST_AUTH_ENABLED auto-disabled in production (validator)
- [ ] Test auth router blocked in production (middleware)
- [ ] Test tokens rejected in production (token validation)
- [ ] Database constraints prevent non-@test.local test users
- [ ] Test mode banner always visible (cannot be hidden)
- [ ] Audit logging for all test authentication events
- [ ] No test users in production database (migration guards)
- [ ] Environment variable validation on startup
- [ ] Clear documentation on security boundaries
- [ ] Penetration testing completed

## Performance Considerations

### 14. Optimization Notes

**Test Token Expiry**: 8 hours (vs 30 min for OAuth)
- Reduces token refresh overhead during development
- Still requires periodic re-authentication

**Auto-Seed on Startup**: ~50ms overhead
- Only runs in development
- Database check before insert (idempotent)

**Test Mode Detection**: Frontend state + localStorage
- No additional API calls
- Persists across page refreshes

## Troubleshooting

### 15. Common Issues

#### Issue: Test login returns 403
**Cause**: Test auth disabled or production environment
**Solution**: Check ENVIRONMENT=development in .env

#### Issue: Test users not found
**Cause**: Database not seeded
**Solution**: Run `python scripts/seed_test_users.py`

#### Issue: Test mode banner not showing
**Cause**: authMode not set in frontend
**Solution**: Check API response includes auth_mode: 'test'

#### Issue: Test token expired
**Cause**: Token expiry reached (8 hours default)
**Solution**: Login again or adjust TEST_TOKEN_EXPIRY_MINUTES

## Monitoring & Observability

### 16. Metrics to Track

```python
# Log metrics for monitoring
- test_auth_logins_count (by user, by IP)
- test_auth_login_failures_count
- test_mode_session_duration_seconds
- concurrent_test_sessions_count
- test_user_api_calls_count (by endpoint)
```

## Future Enhancements

### 17. Potential Improvements

1. **Custom Test Users**: API endpoint to create custom test users
2. **Test User Profiles**: Pre-configured data sets per test user
3. **Test Scenarios**: One-click setup for specific test scenarios
4. **Token Debugging**: UI to inspect JWT claims
5. **Test Mode Recording**: Capture API calls for replay
6. **E2E Test Integration**: Auto-login in Playwright tests

## Conclusion

This dual-mode authentication architecture provides:

✅ **Production OAuth**: Full Google/Microsoft OAuth 2.0 support
✅ **Test Authentication**: Frictionless development without OAuth setup
✅ **Security**: Multi-layer protection prevents test mode in production
✅ **Developer Experience**: One-command setup, easy role switching
✅ **Shared Infrastructure**: Same JWT validation, same protected routes
✅ **Clear Indicators**: Persistent banner, console warnings, visual cues

**Next Steps**: Begin implementation with Phase 1 (Backend) and iterate through Phase 5 (Documentation).

---

**Questions? Contact**: Backend Architecture Team
**Last Updated**: 2025-10-08
