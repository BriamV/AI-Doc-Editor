#!/bin/bash
# AI-Doc-Editor: Docker Build Setup Script
# Task T-02: Configure Docker environment for OAuth + JWT backend

set -e  # Exit on any error

echo "🚀 AI-Doc-Editor Docker Build Setup"
echo "=================================="
echo "Task T-02: OAuth 2.0 + JWT Roles Backend Setup"
echo ""

# Check WSL2 and Docker availability
echo "1/5 🐳 Checking Docker availability..."
if command -v docker >/dev/null 2>&1; then
    echo "✅ Docker command available"
    
    # Test Docker access with sg docker group
    if sg docker -c "docker --version" >/dev/null 2>&1; then
        echo "✅ Docker daemon accessible via 'sg docker -c'"
        DOCKER_CMD="sg docker -c"
    else
        echo "❌ Docker daemon not accessible"
        echo "📝 Solution: Enable WSL integration in Docker Desktop Settings"
        echo "   1. Open Docker Desktop"
        echo "   2. Go to Settings → Resources → WSL Integration"
        echo "   3. Enable integration for your WSL2 distro"
        echo "   4. Restart WSL2: wsl --shutdown && wsl"
        exit 1
    fi
else
    echo "❌ Docker not available"
    echo "📝 Please install Docker Desktop for Windows with WSL2 backend"
    exit 1
fi

# Check environment file
echo ""
echo "2/5 ⚙️  Checking environment configuration..."
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found, creating from template..."
    cp .env.example .env
    echo "✅ .env created with development defaults"
    echo "📝 OAuth providers can be configured later via Admin UI"
else
    echo "✅ .env file exists"
fi

echo "📋 Current OAuth configuration:"
echo "   - Build includes demo OAuth configs (safe for testing)"
echo "   - Real OAuth setup: Configure via Admin Panel UI (T-44)"
echo "   - Direct testing: Update GOOGLE_CLIENT_ID/SECRET in .env"

# Verify backend requirements
echo ""
echo "3/5 📦 Verifying backend requirements..."
if [ -f "backend/requirements.txt" ]; then
    echo "✅ Backend requirements.txt found"
    echo "📋 Python dependencies:"
    cat backend/requirements.txt | head -10
    if [ $(cat backend/requirements.txt | wc -l) -gt 10 ]; then
        echo "   ... and $(($(cat backend/requirements.txt | wc -l) - 10)) more"
    fi
else
    echo "❌ Backend requirements.txt missing"
    exit 1
fi

# Check frontend dependencies
echo ""
echo "4/5 📦 Verifying frontend dependencies..."
if [ -f "package.json" ]; then
    echo "✅ package.json found"
    if [ -d "node_modules" ]; then
        echo "✅ node_modules exists"
    else
        echo "⚠️  node_modules not found - will install during build"
    fi
else
    echo "❌ package.json missing"
    exit 1
fi

# Create build script
echo ""
echo "5/5 📝 Creating build execution script..."
cat > docker-build-execute.sh << 'EOF'
#!/bin/bash
# AI-Doc-Editor: Docker Build Execution Script
# Execute this script to build and run the complete T-02 implementation

set -e

echo "🚀 Starting AI-Doc-Editor Docker Build"
echo "====================================="
echo ""

# Build backend API
echo "🐳 Building FastAPI backend (OAuth + JWT)..."
sg docker -c "docker-compose build api"
echo "✅ Backend built successfully"
echo ""

# Build frontend dev image
echo "🐳 Building React frontend..."
sg docker -c "docker-compose build app-dev"
echo "✅ Frontend built successfully"
echo ""

# Start services
echo "🚀 Starting full stack services..."
echo "📋 Services starting:"
echo "   - Backend API: http://localhost:8000"
echo "   - Frontend Dev: http://localhost:5173"
echo "   - ChromaDB: http://localhost:8001 (for future RAG)"
echo ""

sg docker -c "docker-compose --profile backend up -d"

echo "⏳ Waiting for services to be ready..."
sleep 10

# Test backend health
echo "🩺 Testing backend health..."
if curl -s http://localhost:8000/healthz >/dev/null 2>&1; then
    echo "✅ Backend API is healthy"
else
    echo "⚠️  Backend API not responding yet (may still be starting)"
fi

echo ""
echo "🎉 DOCKER BUILD COMPLETE!"
echo "========================="
echo ""
echo "📋 Service URLs:"
echo "   🌐 Frontend: http://localhost:5173"
echo "   🔒 Backend API: http://localhost:8000"
echo "   📚 API Docs: http://localhost:8000/docs"
echo "   🧬 ChromaDB: http://localhost:8001"
echo ""
echo "📋 OAuth Endpoints (T-02):"
echo "   🔐 Login: POST http://localhost:8000/auth/login"
echo "   🔄 Callback: POST http://localhost:8000/auth/callback"
echo "   🔃 Refresh: POST http://localhost:8000/auth/refresh"
echo "   👤 Profile: GET http://localhost:8000/auth/me"
echo ""
echo "🛠️  Management Commands:"
echo "   📋 Logs: sg docker -c 'docker-compose logs -f'"
echo "   🛑 Stop: sg docker -c 'docker-compose down'"
echo "   🧹 Clean: make docker-clean"
echo ""
echo "⚠️  IMPORTANT: Configure OAuth credentials in .env before using authentication"
EOF

chmod +x docker-build-execute.sh

echo ""
echo "✅ DOCKER SETUP COMPLETE!"
echo "========================"
echo ""
echo "📋 Next Steps:"
echo "1. 📝 Configure OAuth credentials in .env file"
echo "2. 🚀 Run build: ./docker-build-execute.sh"
echo ""
echo "🔧 Additional Commands:"
echo "   📊 Check status: make docker-check"
echo "   🛠️  Backend only: make docker-backend"
echo "   📋 All commands: make help"
echo ""
echo "⏰ Build Time Estimate: 5-10 minutes (depending on internet speed)"
echo "💾 Disk Space Required: ~2GB for all images"