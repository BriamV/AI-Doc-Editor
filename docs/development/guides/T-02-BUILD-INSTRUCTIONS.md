# T-02 OAuth 2.0 + JWT Implementation - Build Instructions

## 🎯 Task T-02 Completion Status

✅ **COMPLETADO** - OAuth 2.0 + JWT Roles authentication system

**Branch:** `feature/T-02-oauth-jwt-roles`  
**Commits:** 2 commits with complete implementation  
**Certification:** `docs/certifications/ACTA-CERT-T02-20250626.md`

---

## 🚀 Quick Build & Run

### Option 1: Automated Docker Build (Recommended)

```bash
# 1. Verify environment setup
yarn repo:env:validate

# 2. Start Docker development environment
yarn docker:dev
```

**✅ No necesitas configurar OAuth ahora** - el build incluye configuración demo segura.  
**🎛️ OAuth real:** Se configura después desde el Admin Panel UI (T-44)

### Option 2: Manual Docker Commands

```bash
# Backend only
make docker-backend

# Full development stack
make docker-dev

# Production build
make docker-prod
```

### Option 3: Local Development (No Docker)

```bash
# Frontend
yarn dev

# Backend (separate terminal)
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

---

## ⚙️ OAuth Configuration Required

Edit `.env` file with your OAuth credentials:

```bash
# Google OAuth (Required for authentication)
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# Microsoft OAuth (Optional)
MICROSOFT_CLIENT_ID=your-microsoft-client-id-here
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret-here

# JWT Security (Change in production)
SECRET_KEY=your-super-secret-jwt-key-change-in-production

# Backend URL
VITE_API_BASE_URL=http://localhost:8000/api
```

### Getting OAuth Credentials

**Google OAuth:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project → Enable Google+ API
3. Create OAuth 2.0 credentials
4. Add redirect URI: `http://localhost:3000/auth/callback`

**Microsoft OAuth:**

1. Go to [Azure Portal](https://portal.azure.com/)
2. Azure Active Directory → App registrations
3. Create new registration
4. Add redirect URI: `http://localhost:3000/auth/callback`

---

## 🌐 Service URLs (After Build)

| Service         | URL                        | Description                   |
| --------------- | -------------------------- | ----------------------------- |
| **Frontend**    | http://localhost:5173      | React development server      |
| **Backend API** | http://localhost:8000      | FastAPI OAuth + JWT server    |
| **API Docs**    | http://localhost:8000/docs | Interactive API documentation |
| **ChromaDB**    | http://localhost:8001      | Vector database (future RAG)  |

---

## 🔐 OAuth Endpoints (T-02 Implementation)

### Authentication Flow

```bash
# 1. Initiate OAuth login
POST http://localhost:8000/auth/login
{
  "provider": "google" | "microsoft"
}

# 2. Handle OAuth callback
POST http://localhost:8000/auth/callback
{
  "code": "oauth_authorization_code",
  "state": "oauth_state_parameter",
  "provider": "google" | "microsoft"
}

# 3. Refresh expired tokens
POST http://localhost:8000/auth/refresh
{
  "refreshToken": "your_refresh_token"
}

# 4. Get user profile
GET http://localhost:8000/auth/me
Authorization: Bearer your_access_token
```

---

## 🧪 Testing the Implementation

### Frontend Testing

```bash
# Unit tests
yarn fe:test

# E2E tests
yarn e2e:fe

# Type checking
yarn type-check
```

### Backend Testing

```bash
# Test backend health
curl http://localhost:8000/healthz

# Test OAuth endpoints
python backend/test_backend.py
```

### Quality Gate

```bash
# Complete T-02 quality validation
make qa-gate
```

---

## 🐳 Docker Management Commands

```bash
# Check Docker status
make docker-check

# View service logs
sg docker -c "docker-compose logs -f"

# Stop all services
sg docker -c "docker-compose down"

# Clean Docker resources
make docker-clean

# Restart services
sg docker -c "docker-compose restart"
```

---

## 📋 Architecture Overview (T-02)

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React App     │    │   FastAPI API    │    │   OAuth         │
│   (Port 5173)   │◄──►│   (Port 8000)    │◄──►│   Providers     │
│                 │    │                  │    │   (Google/MS)   │
│ • Auth UI       │    │ • JWT Tokens     │    │                 │
│ • Token Mgmt    │    │ • User Roles     │    │                 │
│ • State Store   │    │ • OAuth Flow     │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Key Components

- **Frontend:** React + TypeScript + Zustand + TailwindCSS
- **Backend:** FastAPI + Python-JOSE + OAuth providers
- **Authentication:** OAuth 2.0 Authorization Code Flow
- **Authorization:** JWT with RS256 + Role-based access control
- **Database:** SQLite (development) → PostgreSQL (production)

---

## ⚠️ Important Notes

### WSL2 Docker Integration

- Use `sg docker -c "command"` prefix for Docker commands
- Ensure Docker Desktop WSL2 integration is enabled
- Scripts automatically handle WSL2 Docker access

### Security Considerations

- **Never commit real OAuth credentials to git**
- Change `SECRET_KEY` in production environment
- JWT tokens expire: Access (30 min) / Refresh (7 days)
- OAuth state parameter prevents CSRF attacks

### Build Time & Resources

- **Build Time:** 5-10 minutes (first build)
- **Disk Space:** ~2GB for all Docker images
- **Memory:** ~1GB RAM during build process

---

## 🐛 Troubleshooting

### Docker Issues

```bash
# Docker not accessible
sudo usermod -a -G docker $USER
newgrp docker

# WSL2 integration
# Enable in Docker Desktop → Settings → Resources → WSL Integration
```

### OAuth Issues

```bash
# Invalid redirect URI
# Ensure OAuth credentials match: http://localhost:3000/auth/callback

# CORS issues
# Backend configured for localhost:5173 frontend
```

### Build Failures

```bash
# Clean and rebuild
yarn repo:clean
yarn docker:stop
yarn docker:dev
```

---

## 📊 T-02 Completion Summary

✅ **Subtask ST1 (5 points):** OAuth 2.0 flow implementation  
✅ **Subtask ST2 (4 points):** JWT generation with roles  
✅ **Total Complexity:** 9 points completed  
✅ **Documentation:** OpenAPI spec + Certification  
✅ **Infrastructure:** Docker + CI/CD ready

**Ready for T-41 & T-44 development** 🚀
