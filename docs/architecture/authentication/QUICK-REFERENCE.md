# Authentication Quick Reference Card

**AI-Doc-Editor Dual-Mode Authentication - Developer Cheat Sheet**

## 30-Second Setup

```bash
# Clone and setup
git clone https://github.com/BriamV/AI-Doc-Editor.git
cd AI-Doc-Editor
bash scripts/setup-dev-auth.sh
yarn all:dev

# Login at http://localhost:5173
# Click "Show Test Login" → Select "admin@test.local"
# ✅ Done!
```

## API Endpoints

### Test Auth (Development Only)

| Method | Endpoint | Request | Response |
|--------|----------|---------|----------|
| POST | `/api/auth/test/login` | `{"email":"admin@test.local"}` | `{access_token, user, auth_mode:"test"}` |
| GET | `/api/auth/test/users` | - | `[{email, name, role}, ...]` |
| POST | `/api/auth/test/reset` | - | `{deleted_count, seeded_users}` |
| GET | `/api/auth/test/status` | - | `{test_mode_available, config}` |

### Production OAuth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login?provider=google` | Initiate OAuth flow |
| GET | `/api/auth/callback?code=...` | OAuth callback handler |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user |

## Test Users

| Email | Role | Use Case |
|-------|------|----------|
| `admin@test.local` | admin | Admin panel, user management |
| `editor@test.local` | editor | Document editing, standard features |
| `viewer@test.local` | editor | Collaboration testing |

## Environment Variables

```bash
# Development (.env)
ENVIRONMENT=development
DEBUG=true
TEST_AUTH_ENABLED=true
TEST_USERS_AUTO_SEED=true
TEST_TOKEN_EXPIRY_MINUTES=480

# Production (.env)
ENVIRONMENT=production
DEBUG=false
TEST_AUTH_ENABLED=false  # Auto-disabled
GOOGLE_CLIENT_ID=your-id
GOOGLE_CLIENT_SECRET=your-secret
MICROSOFT_CLIENT_ID=your-id
MICROSOFT_CLIENT_SECRET=your-secret
```

## Common Commands

```bash
# Backend
cd backend
python scripts/seed_test_users.py        # Seed test users
sqlite3 app.db "SELECT email FROM users WHERE is_test_user=1"  # List test users
uvicorn app.main:app --reload            # Start API server

# Database
sqlite3 backend/app.db                   # Open database
.schema users                            # View schema
SELECT * FROM users WHERE is_test_user=1; # List test users
.quit                                    # Exit

# Testing
curl http://localhost:8000/api/auth/test/status
curl -X POST http://localhost:8000/api/auth/test/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.local"}'
```

## Frontend Integration

```typescript
// Login with test user
import { useStore } from '@store';

const loginWithTestUser = useStore((state) => state.loginWithTestUser);
await loginWithTestUser('admin@test.local');

// Check test mode
const isTestMode = useStore((state) => state.isTestMode);
const authMode = useStore((state) => state.authMode);

// Access user data
const user = useStore((state) => state.user);
console.log(user.role); // "admin" or "editor"
```

## JWT Token Claims

### Production Token
```json
{
  "email": "user@gmail.com",
  "role": "editor",
  "provider": "google",
  "test_mode": false,
  "exp": 1696896000
}
```

### Test Token
```json
{
  "email": "admin@test.local",
  "role": "admin",
  "provider": "test",
  "test_mode": true,
  "exp": 1696924800
}
```

## Security Checklist

- [ ] Test auth auto-disabled in production (config validator)
- [ ] Test endpoints return 403 in production (middleware)
- [ ] Test tokens rejected in production (token validation)
- [ ] Test users must use @test.local (database trigger)
- [ ] Test mode banner always visible (UI component)
- [ ] All test auth events logged (audit logging)

## Troubleshooting

| Problem | Solution |
|---------|----------|
| **403 on test endpoints** | Check `ENVIRONMENT=development` in .env |
| **Test users not found** | Run `python backend/scripts/seed_test_users.py` |
| **Token expired** | Re-login (8 hour expiry) or adjust `TEST_TOKEN_EXPIRY_MINUTES` |
| **Migration failed** | Delete `backend/app.db`, run setup script again |
| **Banner not showing** | Check `authMode === 'test'` in frontend state |

## File Locations

```
backend/
├── app/
│   ├── core/config.py              # TEST_AUTH_ENABLED settings
│   ├── services/
│   │   ├── auth.py                 # create_test_tokens()
│   │   └── user_service.py         # seed_test_users()
│   └── routers/
│       └── auth_test.py            # Test auth endpoints
├── migrations/
│   └── 001_add_test_user_support.sql
└── scripts/
    └── seed_test_users.py

src/
├── components/Auth/
│   ├── TestLogin.tsx               # Test login UI
│   └── TestModeBanner.tsx          # Test mode indicator
└── store/
    └── auth-slice.ts               # loginWithTestUser()
```

## Testing Scenarios

### Role-Based Access Testing

```bash
# Test admin access
1. Login as admin@test.local
2. Navigate to /admin
3. Verify admin panel visible

# Test editor restrictions
1. Login as editor@test.local
2. Navigate to /admin
3. Verify 403 or redirect
```

### Collaboration Testing

```bash
# Two users, two browsers
Browser 1: Login as admin@test.local
Browser 2: Login as editor@test.local
Test: Real-time document collaboration
```

### Token Refresh Testing

```bash
# Test token expiry
1. Login as admin@test.local
2. Wait 8 hours (or adjust TEST_TOKEN_EXPIRY_MINUTES=1)
3. Make authenticated request
4. Verify auto-refresh or re-login prompt
```

## Production Deployment Checklist

- [ ] Set `ENVIRONMENT=production` in .env
- [ ] Configure Google OAuth credentials
- [ ] Configure Microsoft OAuth credentials
- [ ] Set `PRODUCTION_DOMAIN=https://yourdomain.com`
- [ ] Verify test auth disabled: `curl https://yourdomain.com/api/auth/test/status` → 403
- [ ] Test OAuth login flow end-to-end
- [ ] Verify SSL/TLS enabled
- [ ] Review security headers

## Useful Queries

```sql
-- Count users by type
SELECT
  is_test_user,
  COUNT(*) as count
FROM users
GROUP BY is_test_user;

-- List all test users with roles
SELECT email, name, role, last_login_at
FROM users
WHERE is_test_user = 1
ORDER BY role DESC, email ASC;

-- Find users by provider
SELECT email, name, provider, role
FROM users
WHERE provider = 'test';

-- Check for email conflicts
SELECT email, is_test_user, COUNT(*) as count
FROM users
GROUP BY email
HAVING count > 1;
```

## Performance Notes

| Operation | Time | Notes |
|-----------|------|-------|
| Test login | ~50ms | No OAuth roundtrip |
| OAuth login | ~2-3s | Includes OAuth flow |
| Token validation | ~5ms | JWT decode |
| Test user seed | ~100ms | Creates 3 users |
| Database migration | ~50ms | One-time operation |

## Configuration Reference

```python
# app/core/config.py

class Settings(BaseSettings):
    # Test authentication
    TEST_AUTH_ENABLED: bool = True
    TEST_USERS_AUTO_SEED: bool = True
    TEST_TOKEN_EXPIRY_MINUTES: int = 480  # 8 hours
    TEST_MODE_BANNER_MESSAGE: str = "TEST MODE - Mock authentication"
    TEST_MODE_MAX_SESSIONS: int = 10
    TEST_MODE_IP_WHITELIST: List[str] = ["127.0.0.1", "::1"]

    # Security
    def is_test_mode_available(self) -> bool:
        return (
            self.TEST_AUTH_ENABLED
            and self.ENVIRONMENT != "production"
            and self.DEBUG
        )
```

## Related Documentation

- **Complete Architecture**: `DUAL-MODE-AUTH-ARCHITECTURE.md`
- **Implementation Guide**: `IMPLEMENTATION-GUIDE.md`
- **Visual Diagrams**: `ARCHITECTURE-DIAGRAM.md`
- **Overview**: `README.md`

## Support

**Issues?** Create GitHub issue with `auth` label

**Questions?** Check architecture docs or ask in team chat

**Emergency?** Contact backend architecture team

---

**Last Updated**: 2025-10-08
**Version**: 1.0
