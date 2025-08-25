"""
Health check endpoints
T-23: Backend health monitoring implementation
"""

from fastapi import APIRouter
from fastapi.responses import JSONResponse
import sys
from datetime import datetime

router = APIRouter()


@router.get("/healthz")
@router.head("/healthz")
async def health_check():
    """Health check endpoint for backend"""
    return JSONResponse(
        {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "service": "ai-doc-editor-backend",
            "version": "0.1.0",
            "python_version": f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
            "dependencies": {"database": "connected", "auth": "ready"},  # TODO: Add real DB check
        }
    )
