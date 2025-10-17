# Authentication System Architecture Diagrams

**Visual Reference for Dual-Mode Authentication**

## System Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                         AI-Doc-Editor                                   │
│                     Authentication System                               │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND                                       │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                       Login Screen                                │  │
│  │  ┌───────────────┐                  ┌───────────────┐            │  │
│  │  │  OAuth Login  │                  │  Test Login   │            │  │
│  │  │  (Production) │                  │  (Dev Only)   │            │  │
│  │  └───────┬───────┘                  └───────┬───────┘            │  │
│  └──────────┼────────────────────────────────────┼──────────────────┘  │
│             │                                    │                     │
│             │                                    │                     │
│  ┌──────────▼────────────────────────────────────▼──────────────────┐  │
│  │                    Zustand Auth Store                            │  │
│  │  • isAuthenticated: boolean                                      │  │
│  │  • user: User                                                    │  │
│  │  • accessToken: string                                           │  │
│  │  • authMode: 'oauth' | 'test'                                    │  │
│  │  • isTestMode: boolean                                           │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
└─────────────────────────────────────┼──────────────────────────────────┘
                                      │
                    JWT Token         │
                    (Authorization: Bearer <token>)
                                      │
┌─────────────────────────────────────▼──────────────────────────────────┐
│                          BACKEND                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                   FastAPI Routers                                 │  │
│  │  ┌─────────────────┐            ┌──────────────────┐             │  │
│  │  │  /api/auth/*    │            │ /api/auth/test/* │             │  │
│  │  │  (OAuth Routes) │            │ (Test Routes)    │             │  │
│  │  │                 │            │ DEV ONLY         │             │  │
│  │  └────────┬────────┘            └────────┬─────────┘             │  │
│  └───────────┼──────────────────────────────┼────────────────────────┘  │
│              │                              │                           │
│  ┌───────────▼──────────────────────────────▼────────────────────────┐  │
│  │                     Auth Service                                  │  │
│  │  • create_tokens(user) → JWT                                      │  │
│  │  • create_test_tokens(user) → JWT (test_mode: true)               │  │
│  │  • verify_token(token) → user_data                               │  │
│  │  • verify_test_token(token) → validates environment              │  │
│  └───────────────────────────────┬───────────────────────────────────┘  │
│                                  │                                      │
│  ┌───────────────────────────────▼───────────────────────────────────┐  │
│  │                     User Service                                  │  │
│  │  • get_or_create_user(email, name, provider) → OAuth user        │  │
│  │  • get_test_user_by_email(email) → Test user                     │  │
│  │  • seed_test_users() → Creates default test users                │  │
│  └───────────────────────────────┬───────────────────────────────────┘  │
└────────────────────────────────────┼──────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼──────────────────────────────────┐
│                      SQLite Database                                  │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  users table                                                      │ │
│  │  ┌──────────────────────────────────────────────────────────────┐│ │
│  │  │ id | email | name | provider | role | is_test_user | ...     ││ │
│  │  ├──────────────────────────────────────────────────────────────┤│ │
│  │  │ uuid | user@gmail.com | User | google | editor | 0 | ...     ││ │
│  │  │ uuid | admin@test.local | Admin | test | admin | 1 | ...     ││ │
│  │  └──────────────────────────────────────────────────────────────┘│ │
│  └──────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────┘
```

## Authentication Flow Comparison

### Production OAuth 2.0 Flow

```
┌──────────┐                                              ┌──────────┐
│  User    │                                              │  Google  │
│          │                                              │  OAuth   │
└────┬─────┘                                              └────┬─────┘
     │                                                         │
     │ 1. Click "Login with Google"                           │
     ▼                                                         │
┌──────────┐                                                  │
│ Frontend │                                                  │
└────┬─────┘                                                  │
     │ 2. POST /api/auth/login?provider=google                │
     ▼                                                         │
┌──────────┐                                                  │
│ Backend  │                                                  │
│ Router   │                                                  │
└────┬─────┘                                                  │
     │ 3. Generate OAuth URL                                  │
     │ ──────────────────────────────────────────────────────►│
     │                                                         │
     │                    4. User consents                     │
     │                                                         │
     │ 5. Callback with code                                  │
     │◄────────────────────────────────────────────────────── │
     ▼                                                         │
┌──────────┐                                                  │
│ Backend  │ 6. Exchange code for access token                │
│ Auth     │─────────────────────────────────────────────────►│
│ Service  │                                                   │
└────┬─────┘◄─────────────────────────────────────────────────┘
     │ 7. Fetch user info from Google
     ▼
┌──────────┐
│ User     │ 8. get_or_create_user()
│ Service  │    - Create if first time
└────┬─────┘    - Update last_login if existing
     │           - First user → admin role
     ▼
┌──────────┐
│ Database │ 9. Save/update user
│          │    provider = "google"
└────┬─────┘    is_test_user = 0
     │
     ▼
┌──────────┐
│ Auth     │ 10. Generate JWT tokens
│ Service  │     - access_token (30 min)
└────┬─────┘     - refresh_token (7 days)
     │            - test_mode: false
     ▼
┌──────────┐
│ Frontend │ 11. Store tokens & user
│ Store    │     - localStorage
└────┬─────┘     - Zustand state
     │            - authMode = 'oauth'
     ▼
┌──────────┐
│  User    │ ✅ Authenticated!
│          │
└──────────┘
```

### Test Authentication Flow

```
┌──────────┐
│  User    │
│          │
└────┬─────┘
     │ 1. Click "Login as Test User"
     │    Select "admin@test.local"
     ▼
┌──────────┐
│ Frontend │
└────┬─────┘
     │ 2. POST /api/auth/test/login
     │    {"email": "admin@test.local"}
     ▼
┌──────────┐
│ Backend  │ 3. Security checks:
│ Test     │    ✓ is_test_mode_available() → True
│ Router   │    ✓ Email ends with @test.local
└────┬─────┘    ✓ ENVIRONMENT != production
     │
     ▼
┌──────────┐
│ User     │ 4. get_test_user_by_email()
│ Service  │    - Lookup in database
└────┬─────┘    - Verify is_test_user = 1
     │
     ▼
┌──────────┐
│ Database │ 5. Return test user
│          │    email = "admin@test.local"
└────┬─────┘    role = "admin"
     │           is_test_user = 1
     ▼
┌──────────┐
│ Auth     │ 6. Generate TEST JWT tokens
│ Service  │    - access_token (8 hours!)
└────┬─────┘    - refresh_token (7 days)
     │           - test_mode: true ⚠️
     ▼
┌──────────┐
│ Frontend │ 7. Store tokens & user
│ Store    │    - localStorage
└────┬─────┘    - Zustand state
     │           - authMode = 'test'
     │           - isTestMode = true
     ▼
┌──────────┐
│  UI      │ 8. Show test mode banner
│  Banner  │    ⚠️ TEST MODE
└────┬─────┘    User: admin@test.local (admin)
     │
     ▼
┌──────────┐
│  User    │ ✅ Authenticated! (Test Mode)
│          │
└──────────┘
```

## Security Architecture

### Multi-Layer Protection System

```
┌────────────────────────────────────────────────────────────────┐
│                   TEST MODE PROTECTION                          │
└────────────────────────────────────────────────────────────────┘

╔════════════════════════════════════════════════════════════════╗
║ Layer 1: Configuration Validator                               ║
║ ┌────────────────────────────────────────────────────────────┐ ║
║ │ @validator("TEST_AUTH_ENABLED")                            │ ║
║ │ def disable_test_auth_in_production(...):                  │ ║
║ │     if ENVIRONMENT == "production":                        │ ║
║ │         return False  # FORCE DISABLE                      │ ║
║ └────────────────────────────────────────────────────────────┘ ║
╚════════════════════════════════════════════════════════════════╝
                             │
                             ▼
╔════════════════════════════════════════════════════════════════╗
║ Layer 2: Router Middleware                                     ║
║ ┌────────────────────────────────────────────────────────────┐ ║
║ │ if settings.ENVIRONMENT == "production":                   │ ║
║ │     return JSONResponse(status_code=403, ...)              │ ║
║ │ # All /api/auth/test/* endpoints blocked                   │ ║
║ └────────────────────────────────────────────────────────────┘ ║
╚════════════════════════════════════════════════════════════════╝
                             │
                             ▼
╔════════════════════════════════════════════════════════════════╗
║ Layer 3: Token Validation                                      ║
║ ┌────────────────────────────────────────────────────────────┐ ║
║ │ def verify_test_token(token):                              │ ║
║ │     payload = decode(token)                                │ ║
║ │     if payload.get("test_mode") and ENVIRONMENT == "prod": │ ║
║ │         raise ValueError("Test tokens not allowed")        │ ║
║ └────────────────────────────────────────────────────────────┘ ║
╚════════════════════════════════════════════════════════════════╝
                             │
                             ▼
╔════════════════════════════════════════════════════════════════╗
║ Layer 4: Database Constraints                                  ║
║ ┌────────────────────────────────────────────────────────────┐ ║
║ │ CREATE TRIGGER validate_test_user_email                    │ ║
║ │ WHEN NEW.is_test_user = 1                                  │ ║
║ │     AND NEW.email NOT LIKE '%@test.local'                  │ ║
║ │ BEGIN                                                       │ ║
║ │     RAISE(ABORT, 'Invalid test user email domain')         │ ║
║ │ END;                                                        │ ║
║ └────────────────────────────────────────────────────────────┘ ║
╚════════════════════════════════════════════════════════════════╝
                             │
                             ▼
╔════════════════════════════════════════════════════════════════╗
║ Layer 5: Audit Logging                                         ║
║ ┌────────────────────────────────────────────────────────────┐ ║
║ │ logger.info(f"Test login: {email} from IP: {ip}")          │ ║
║ │ logger.warning(f"High test login rate from IP: {ip}")      │ ║
║ └────────────────────────────────────────────────────────────┘ ║
╚════════════════════════════════════════════════════════════════╝
```

## JWT Token Structure

### Production OAuth Token

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user@gmail.com",
    "email": "user@gmail.com",
    "name": "John Doe",
    "role": "editor",
    "provider": "google",
    "type": "access",
    "iss": "ai-doc-editor",
    "aud": "ai-doc-editor-api",
    "exp": 1696896000,
    "test_mode": false
  },
  "signature": "..."
}
```

**Token Expiry**: 30 minutes
**Use Case**: Production users via Google/Microsoft OAuth

### Test Authentication Token

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "admin@test.local",
    "email": "admin@test.local",
    "name": "Test Admin",
    "role": "admin",
    "provider": "test",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "access",
    "iss": "ai-doc-editor",
    "aud": "ai-doc-editor-api",
    "exp": 1696924800,
    "test_mode": true
  },
  "signature": "..."
}
```

**Token Expiry**: 8 hours (480 minutes)
**Use Case**: Development testing
**Security**: Rejected in production (Layer 3)

## Database Schema

```sql
CREATE TABLE users (
    -- Primary Key
    id TEXT PRIMARY KEY,

    -- User Identity
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,

    -- Authentication
    provider TEXT NOT NULL,  -- "google", "microsoft", or "test"
    role TEXT NOT NULL,      -- "admin" or "editor"

    -- Test User Flag ⭐ NEW
    is_test_user BOOLEAN DEFAULT 0 NOT NULL,

    -- Status
    is_active BOOLEAN DEFAULT 1 NOT NULL,

    -- Timestamps
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    last_login_at TEXT
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_provider ON users(provider);
CREATE INDEX idx_users_is_test_user ON users(is_test_user);
CREATE INDEX idx_users_email_test ON users(email, is_test_user);

-- Triggers for test user validation
CREATE TRIGGER validate_test_user_email_insert
BEFORE INSERT ON users
WHEN NEW.is_test_user = 1
BEGIN
    SELECT CASE
        WHEN NEW.email NOT LIKE '%@test.local' THEN
            RAISE(ABORT, 'Test users must use @test.local email domain')
    END;
END;
```

**Example Records**:

| id | email | name | provider | role | is_test_user |
|----|-------|------|----------|------|--------------|
| uuid-001 | user@gmail.com | John Doe | google | editor | 0 |
| uuid-002 | admin@test.local | Test Admin | test | admin | 1 |
| uuid-003 | editor@test.local | Test Editor | test | editor | 1 |

## Environment Configuration

```
┌──────────────────────────────────────────────────────────────┐
│                    DEVELOPMENT                                │
│  .env.development                                             │
├──────────────────────────────────────────────────────────────┤
│  ENVIRONMENT=development                                      │
│  DEBUG=true                                                   │
│  TEST_AUTH_ENABLED=true          ✅ Test mode ON             │
│  TEST_USERS_AUTO_SEED=true       ✅ Auto-seed users          │
│  GOOGLE_CLIENT_ID=                (optional)                 │
│  GOOGLE_CLIENT_SECRET=            (optional)                 │
└──────────────────────────────────────────────────────────────┘
                         │
                         │ settings.is_test_mode_available()
                         ▼
              ╔═══════════════════╗
              ║  Returns: TRUE    ║
              ╚═══════════════════╝

┌──────────────────────────────────────────────────────────────┐
│                    PRODUCTION                                 │
│  .env.production                                              │
├──────────────────────────────────────────────────────────────┤
│  ENVIRONMENT=production                                       │
│  DEBUG=false                                                  │
│  TEST_AUTH_ENABLED=false         ❌ Forced OFF (validator)   │
│  GOOGLE_CLIENT_ID=real-google-id ✅ Required                 │
│  GOOGLE_CLIENT_SECRET=secret     ✅ Required                 │
│  MICROSOFT_CLIENT_ID=ms-id       ✅ Required                 │
│  MICROSOFT_CLIENT_SECRET=secret  ✅ Required                 │
└──────────────────────────────────────────────────────────────┘
                         │
                         │ settings.is_test_mode_available()
                         ▼
              ╔═══════════════════╗
              ║  Returns: FALSE   ║
              ╚═══════════════════╝
```

## Component Interaction

```
┌─────────────────────────────────────────────────────────────────┐
│                  Request Flow: Test Login                        │
└─────────────────────────────────────────────────────────────────┘

Frontend                 Backend              Services           Database
   │                        │                     │                  │
   │ POST /api/auth/test/login                   │                  │
   │ {"email":"admin@test.local"}                │                  │
   ├───────────────────────►│                     │                  │
   │                        │                     │                  │
   │                        │ _check_test_mode_available()           │
   │                        │ ✓ ENVIRONMENT != production            │
   │                        │                     │                  │
   │                        │ get_test_user_by_email()               │
   │                        ├────────────────────►│                  │
   │                        │                     │ SELECT ... WHERE │
   │                        │                     │ email = ? AND    │
   │                        │                     │ is_test_user = 1 │
   │                        │                     ├─────────────────►│
   │                        │                     │                  │
   │                        │                     │ Return user dict │
   │                        │                     │◄─────────────────┤
   │                        │                     │                  │
   │                        │◄────────────────────┤                  │
   │                        │ user = {id, email, role, ...}          │
   │                        │                     │                  │
   │                        │ create_test_tokens(user)               │
   │                        ├────────────────────►│                  │
   │                        │                     │ Generate JWT     │
   │                        │                     │ test_mode: true  │
   │                        │                     │                  │
   │                        │ {access_token, refresh_token, ...}     │
   │                        │◄────────────────────┤                  │
   │                        │                     │                  │
   │ 200 OK                 │                     │                  │
   │ {                      │                     │                  │
   │   "access_token": ..., │                     │                  │
   │   "auth_mode": "test"  │                     │                  │
   │ }                      │                     │                  │
   │◄───────────────────────┤                     │                  │
   │                        │                     │                  │
   │ Store in Zustand       │                     │                  │
   │ authMode = 'test'      │                     │                  │
   │ isTestMode = true      │                     │                  │
   │                        │                     │                  │
   │ Render test banner     │                     │                  │
   │ ⚠️ TEST MODE           │                     │                  │
   │                        │                     │                  │
```

## File Structure

```
ai-doc-editor/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   └── config.py               # ✏️ MODIFIED: Test auth settings
│   │   ├── services/
│   │   │   ├── auth.py                 # ✏️ MODIFIED: Test token methods
│   │   │   └── user_service.py         # ✏️ MODIFIED: Test user methods
│   │   ├── routers/
│   │   │   ├── auth.py                 # ✅ EXISTING: OAuth routes
│   │   │   └── auth_test.py            # ⭐ NEW: Test auth routes
│   │   └── main.py                     # ✏️ MODIFIED: Startup hook
│   ├── migrations/
│   │   └── 001_add_test_user_support.sql  # ⭐ NEW: Database migration
│   └── scripts/
│       └── seed_test_users.py          # ⭐ NEW: Seed script
├── scripts/
│   └── setup-dev-auth.sh               # ⭐ NEW: One-command setup
├── src/
│   ├── components/
│   │   └── Auth/
│   │       ├── TestLogin.tsx           # ⭐ NEW: Test login UI
│   │       ├── TestModeBanner.tsx      # ⭐ NEW: Test mode indicator
│   │       └── LoginScreen.tsx         # ✏️ MODIFIED: Add test toggle
│   └── store/
│       └── auth-slice.ts               # ✏️ MODIFIED: Test mode state
└── docs/
    └── architecture/
        └── authentication/
            ├── DUAL-MODE-AUTH-ARCHITECTURE.md  # Complete design
            ├── IMPLEMENTATION-GUIDE.md         # Step-by-step guide
            ├── ARCHITECTURE-DIAGRAM.md         # This file
            └── README.md                       # Overview
```

**Legend**:
- ⭐ NEW: Files to create
- ✏️ MODIFIED: Files to modify
- ✅ EXISTING: Reference files (unchanged)

---

**Reference**: See DUAL-MODE-AUTH-ARCHITECTURE.md for complete architecture details.
