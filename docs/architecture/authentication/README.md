# Authentication System Documentation

**AI-Doc-Editor Authentication Architecture**

This directory contains comprehensive documentation for the dual-mode authentication system supporting both production OAuth 2.0 and development test authentication.

## Quick Navigation

| Document | Purpose | Audience |
|----------|---------|----------|
| **DUAL-MODE-AUTH-ARCHITECTURE.md** | Complete architecture design | Architects, Senior Developers |
| **IMPLEMENTATION-GUIDE.md** | Step-by-step implementation | Developers |
| **README.md** (this file) | Overview and quick start | Everyone |

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                  Authentication Modes                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  PRODUCTION MODE          │         DEVELOPMENT MODE        │
│  ═══════════════          │         ════════════════        │
│                           │                                  │
│  ┌──────────────┐         │         ┌──────────────┐        │
│  │ OAuth 2.0    │         │         │ Test Auth    │        │
│  │ (Google/MS)  │         │         │ (@test.local)│        │
│  └──────────────┘         │         └──────────────┘        │
│         │                 │                │                 │
│         ▼                 │                ▼                 │
│  ┌──────────────┐         │         ┌──────────────┐        │
│  │ JWT Tokens   │◄────────┼────────►│ JWT Tokens   │        │
│  │ (30 min exp) │         │         │ (8 hour exp) │        │
│  └──────────────┘         │         └──────────────┘        │
│         │                 │                │                 │
│         └─────────────────┼────────────────┘                 │
│                           │                                  │
│                           ▼                                  │
│                 ┌───────────────────┐                        │
│                 │ Protected Routes  │                        │
│                 │ RBAC (admin/ed)   │                        │
│                 └───────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### For Developers (First Time Setup)

```bash
# 1. Read the architecture document (15 min)
cat docs/architecture/authentication/DUAL-MODE-AUTH-ARCHITECTURE.md

# 2. Run the setup script (2 min)
bash scripts/setup-dev-auth.sh

# 3. Start development (instant)
yarn all:dev

# 4. Test it (1 min)
# Open http://localhost:5173
# Click "Show Test Login"
# Select "admin@test.local"
# ✅ You're authenticated!
```

### For Architects (Design Review)

```bash
# Read complete architecture
cat docs/architecture/authentication/DUAL-MODE-AUTH-ARCHITECTURE.md

# Key sections:
# - Section 1-2: Architecture diagrams
# - Section 5: Security considerations
# - Section 6: Configuration strategy
# - Section 10: File structure
```

### For Implementation (Development)

```bash
# Follow step-by-step guide
cat docs/architecture/authentication/IMPLEMENTATION-GUIDE.md

# 8 steps total:
# 1. Database migration
# 2. Configuration extension
# 3. User service extension
# 4. Auth service extension
# 5. Test auth router
# 6. Application integration
# 7. Database seed script
# 8. Development setup script
```

## Key Features

### ✅ Production OAuth 2.0
- Google authentication
- Microsoft authentication
- Full OAuth 2.0 compliance
- 30-minute JWT token expiry
- Secure production configuration

### ✅ Development Test Mode
- No OAuth setup required
- Pre-seeded test users
- 3 roles: admin, editor, viewer
- 8-hour JWT token expiry
- One-command setup

### ✅ Security
- Auto-disabled in production
- Multi-layer protection
- Test tokens marked and rejected in production
- Database constraints on test users
- Audit logging

### ✅ Developer Experience
- One command: `bash scripts/setup-dev-auth.sh`
- Visual test mode banner
- Easy role switching
- Shared JWT infrastructure
- No production impact

## Available Test Users

| Email | Role | Password | Use Case |
|-------|------|----------|----------|
| `admin@test.local` | admin | N/A (passwordless) | Admin features testing |
| `editor@test.local` | editor | N/A (passwordless) | Standard user testing |
| `viewer@test.local` | editor | N/A (passwordless) | Collaboration testing |

## API Endpoints

### Production Endpoints
```
POST   /api/auth/login          # OAuth initiation
GET    /api/auth/callback       # OAuth callback
POST   /api/auth/refresh        # Token refresh
GET    /api/auth/me             # Current user
```

### Test Endpoints (Development Only)
```
POST   /api/auth/test/login     # Test user login
GET    /api/auth/test/users     # List test users
POST   /api/auth/test/reset     # Reset test users
GET    /api/auth/test/status    # Test mode status
```

## Environment Variables

### Development (.env)
```bash
ENVIRONMENT=development
DEBUG=true
TEST_AUTH_ENABLED=true
TEST_USERS_AUTO_SEED=true
```

### Production (.env)
```bash
ENVIRONMENT=production
DEBUG=false
TEST_AUTH_ENABLED=false  # Auto-disabled
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-secret
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-secret
```

## Security Model

### Multi-Layer Protection

```
Layer 1: Environment Validator
  ↓ (Forces TEST_AUTH_ENABLED=false in production)

Layer 2: Router Middleware
  ↓ (Blocks /api/auth/test/* in production)

Layer 3: Token Verification
  ↓ (Rejects test_mode=true tokens in production)

Layer 4: Database Constraints
  ↓ (Prevents non-@test.local test users)

Layer 5: Audit Logging
  ↓ (Logs all test auth events)
```

## Testing

### Manual Testing
```bash
# Test mode status
curl http://localhost:8000/api/auth/test/status

# Test login
curl -X POST http://localhost:8000/api/auth/test/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.local"}'

# List test users
curl http://localhost:8000/api/auth/test/users
```

### Automated Testing
```bash
# Backend tests
cd backend
pytest tests/test_auth_test_mode.py -v

# Frontend tests (to be implemented)
yarn fe:test
```

## Common Tasks

### Reset Test Users
```bash
cd backend
python scripts/seed_test_users.py
```

### Switch Authentication Modes
```typescript
// Frontend automatically detects mode

// Test mode: Click test user button
loginWithTestUser('admin@test.local')

// Production: Click OAuth button
initiateOAuthFlow('google')
```

### Test Different Roles
```bash
# Admin access
Login as: admin@test.local
Verify: Admin panel visible

# Editor access
Login as: editor@test.local
Verify: Limited permissions
```

## Troubleshooting

### Issue: Test endpoints return 403

**Cause**: Production environment or test auth disabled

**Solution**:
```bash
# Check environment
cat backend/.env | grep ENVIRONMENT
# Should show: ENVIRONMENT=development

# Verify test auth enabled
python -c "from backend.app.core.config import settings; print(settings.is_test_mode_available())"
# Should show: True
```

### Issue: Test users not found

**Cause**: Database not seeded

**Solution**:
```bash
cd backend
python scripts/seed_test_users.py

# Verify
sqlite3 app.db "SELECT email FROM users WHERE is_test_user = 1;"
```

### Issue: Migration failed

**Cause**: Database schema conflict

**Solution**:
```bash
# Backup current database
cp backend/app.db backend/app.db.backup

# Drop and recreate
rm backend/app.db
cd backend
python scripts/init_db.py
sqlite3 app.db < migrations/001_add_test_user_support.sql
python scripts/seed_test_users.py
```

## Architecture Decisions

### Why Dual-Mode Instead of Mock?
- **Production ready**: OAuth flow fully implemented and tested
- **Zero friction**: No OAuth setup required for development
- **Same infrastructure**: Shared JWT validation and RBAC
- **Clear separation**: Impossible to use test mode in production

### Why @test.local Domain?
- **Visual indicator**: Immediately recognizable as test account
- **Database constraint**: Prevents accidental test users with real emails
- **Security**: Easy to filter and audit

### Why 8-Hour Token Expiry for Test?
- **Developer convenience**: Reduces login interruptions
- **Still secure**: Still requires periodic re-authentication
- **Production different**: Production uses 30-minute expiry

## Related Documentation

- **OAuth Setup**: See `docs/security/oauth-setup.md` (to be created)
- **RBAC System**: See `docs/architecture/security/rbac.md`
- **JWT Configuration**: See `backend/app/core/config.py`
- **User Management**: See `backend/app/services/user_service.py`

## Contributing

### Adding New Test Users

Edit `backend/app/services/user_service.py`:

```python
def seed_test_users(self):
    test_users = [
        # Existing users...
        {
            "email": "newuser@test.local",
            "name": "New Test User",
            "role": "editor",
            "provider": "test",
        },
    ]
```

### Extending Test Auth

1. Read architecture document (Section 17: Future Enhancements)
2. Design extension following security model
3. Update both backend and frontend
4. Add tests
5. Update documentation

## Support

### Questions?
- Architecture: See DUAL-MODE-AUTH-ARCHITECTURE.md
- Implementation: See IMPLEMENTATION-GUIDE.md
- Issues: Create GitHub issue with `auth` label

### Common Questions

**Q: Can I use test auth in staging?**
A: Yes, test auth works in any non-production environment where `DEBUG=true` and `ENVIRONMENT != production`.

**Q: How do I add OAuth in production?**
A: Configure `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` in production `.env`.

**Q: Can I customize test token expiry?**
A: Yes, set `TEST_TOKEN_EXPIRY_MINUTES` in `.env` (default: 480 = 8 hours).

**Q: Is test mode secure?**
A: Yes for development. It's automatically disabled in production through multiple security layers.

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2025-10-08 | 1.0 | Initial architecture and implementation guide |

---

**Last Updated**: 2025-10-08
**Maintained By**: Backend Architecture Team
