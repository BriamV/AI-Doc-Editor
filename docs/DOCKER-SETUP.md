# Docker Setup Guide

**Task T-01.5**: Docker-compose setup for AI-Doc-Editor

## Current Status ✅

Docker is installed and configured with the following files:
- `Dockerfile` - Production multi-stage build
- `Dockerfile.dev` - Development environment
- `docker-compose.yml` - Multi-profile orchestration
- `.dockerignore` - Optimized build context

## Quick Start

```bash
# Check Docker status
make docker-check

# Development environment
make docker-dev

# Production environment  
make docker-prod

# Full stack with backend services
make docker-backend
```

## Docker Compose Profiles

### Development (`app-dev`)
```bash
docker-compose up app-dev
# or
make docker-dev
```
- Hot reload enabled
- Volume mounted for live code changes
- Runs on port 5173

### Production (`app-prod`)
```bash
docker-compose --profile production up app-prod
# or
make docker-prod
```
- Optimized multi-stage build
- Serves static files via serve@14
- Runs on port 3000

### Backend Services (`backend`)
```bash
docker-compose --profile backend up
# or
make docker-backend
```
- Includes FastAPI placeholder (future T-01.6)
- Chroma vector database on port 8001
- Full development stack

## Troubleshooting

### Permission Issues
If you get "permission denied" errors:

```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Apply changes (logout/login or restart terminal)
newgrp docker

# Verify
docker ps
```

### WSL2 Integration
If Docker not found in WSL2:

1. Open Docker Desktop
2. Settings → Resources → WSL Integration
3. Enable "Enable integration with my default WSL distro"
4. Enable your specific Ubuntu distribution
5. Apply & Restart

## File Structure

```
├── Dockerfile              # Production build
├── Dockerfile.dev          # Development build  
├── docker-compose.yml      # Multi-profile orchestration
├── .dockerignore           # Build context optimization
└── docs/DOCKER-SETUP.md    # This guide
```

## Build Details

### Production Dockerfile
- **Base**: node:20-alpine
- **Multi-stage**: Builder + Production
- **Security**: Non-root user (nextjs:1001)
- **Health check**: HTTP endpoint monitoring
- **Optimization**: npm ci --only=production

### Development Dockerfile
- **Base**: node:20-alpine
- **Tools**: git, curl, bash for development
- **User**: developer:1001 (non-root)
- **Hot reload**: Volume mounting + Vite dev server
- **Port**: 5173 with host binding

### Docker Compose Features
- **Profiles**: dev, production, backend
- **Networks**: ai-doc-editor-network (bridge)
- **Volumes**: Persistent data for Chroma
- **Environment**: NODE_ENV configuration
- **Restart policies**: unless-stopped for production

## Commands Reference

| Command | Description |
|---------|-------------|
| `make docker-check` | Verify Docker installation |
| `make docker-build` | Build production image |
| `make docker-build-dev` | Build development image |
| `make docker-dev` | Start development environment |
| `make docker-prod` | Start production environment |
| `make docker-backend` | Start full stack |
| `make docker-stop` | Stop all services |
| `make docker-clean` | Clean images and containers |
| `make docker-logs` | Show logs |

## Integration with CI/CD

Docker builds are integrated into GitHub Actions:
- Development image testing
- Production build verification  
- Multi-platform support preparation

---

**Task T-01.5 Status**: ✅ Complete (files ready, permission fix needed)
**Next**: T-01.6 Pydantic v2 migration or proceed to T-17