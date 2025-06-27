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
