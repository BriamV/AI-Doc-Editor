"""
Health check endpoints
T-23: Backend health monitoring implementation
"""

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import sys
import os
import httpx
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class HealthDependencies(BaseModel):
    """Schema for health check dependencies"""

    openai: Optional[Dict[str, Any]] = Field(None, description="OpenAI API status")
    browser: Optional[Dict[str, Any]] = Field(None, description="Browser environment status")
    storage: Optional[Dict[str, Any]] = Field(None, description="Storage system status")


class HealthStatus(BaseModel):
    """Schema for health check response"""

    status: str = Field(..., description="Overall health status")
    timestamp: str = Field(..., description="ISO timestamp of health check")
    version: str = Field(..., description="Application version")
    deps: HealthDependencies = Field(..., description="Dependency status details")


@router.get("/healthz")
@router.head("/healthz")
async def health_check():
    """Simple health check endpoint for backend"""
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


@router.get("/health", response_model=HealthStatus)
async def comprehensive_health_check():
    """
    Comprehensive health check endpoint with external dependencies
    Returns normalized HealthStatus payload with OpenAI API status
    """
    timestamp = datetime.now(timezone.utc).isoformat()
    version = "0.1.0"
    overall_status = "healthy"

    # Initialize dependencies
    deps = HealthDependencies()

    # Check OpenAI API availability
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if openai_api_key:
        try:
            # Make lightweight request to OpenAI models endpoint
            async with httpx.AsyncClient(timeout=5.0) as client:
                headers = {
                    "Authorization": f"Bearer {openai_api_key}",
                    "Content-Type": "application/json",
                }

                response = await client.get("https://api.openai.com/v1/models", headers=headers)

                if response.status_code == 200:
                    models_data = response.json()
                    model_count = len(models_data.get("data", []))
                    deps.openai = {
                        "status": "available",
                        "response_time_ms": round(response.elapsed.total_seconds() * 1000),
                        "models_available": model_count,
                        "api_version": "v1",
                    }
                    logger.info(
                        f"OpenAI API health check successful: {model_count} models available"
                    )
                else:
                    deps.openai = {
                        "status": "error",
                        "error": f"HTTP {response.status_code}",
                        "response_time_ms": round(response.elapsed.total_seconds() * 1000),
                    }
                    overall_status = "degraded"
                    logger.warning(f"OpenAI API returned non-200 status: {response.status_code}")

        except httpx.TimeoutException:
            deps.openai = {"status": "timeout", "error": "Request timeout after 5 seconds"}
            overall_status = "degraded"
            logger.error("OpenAI API health check timeout")

        except httpx.RequestError as e:
            deps.openai = {"status": "error", "error": f"Request error: {str(e)}"}
            overall_status = "degraded"
            logger.error(f"OpenAI API health check request error: {e}")

        except Exception as e:
            deps.openai = {"status": "error", "error": f"Unexpected error: {str(e)}"}
            overall_status = "degraded"
            logger.error(f"OpenAI API health check unexpected error: {e}")
    else:
        deps.openai = {
            "status": "not_configured",
            "error": "OPENAI_API_KEY environment variable not set",
        }
        overall_status = "degraded"
        logger.warning("OpenAI API key not configured")

    # Check browser environment (basic check for required JS APIs)
    deps.browser = {"status": "not_applicable", "note": "Browser checks performed client-side"}

    # Check storage system (basic file system check)
    try:
        # Simple storage availability check
        import tempfile

        with tempfile.NamedTemporaryFile(delete=True) as tmp:
            tmp.write(b"health_check")
            tmp.flush()

        deps.storage = {"status": "available", "type": "filesystem", "writable": True}
        logger.debug("Storage system health check successful")

    except Exception as e:
        deps.storage = {"status": "error", "error": f"Storage check failed: {str(e)}"}
        overall_status = "degraded"
        logger.error(f"Storage system health check failed: {e}")

    health_response = HealthStatus(
        status=overall_status, timestamp=timestamp, version=version, deps=deps
    )

    # Log health check result
    logger.info(f"Health check completed: status={overall_status}")

    return health_response
