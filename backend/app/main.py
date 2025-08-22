"""
FastAPI Backend for AI-Doc-Editor
T-02: OAuth 2.0 + JWT Roles implementation
T-13: Security hardening for production deployment
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import logging
import os

from app.core.config import settings
from app.routers import auth, health, config, credentials, audit
from app.middleware.audit_middleware import AuditMiddleware
from app.services.audit import AuditService
from app.security.rate_limiter import RateLimitMiddleware, SecurityHeadersMiddleware

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


# Create FastAPI application with security-first configuration
def create_app() -> FastAPI:
    """Create and configure FastAPI application with security hardening"""

    # Disable docs in production for security
    docs_enabled = settings.DEBUG and settings.ENVIRONMENT != "production"

    app = FastAPI(
        title=settings.APP_NAME,
        description="AI-Doc-Editor Backend API with Security Hardening",
        version="0.1.0",
        docs_url="/docs" if docs_enabled else None,
        redoc_url="/redoc" if docs_enabled else None,
        openapi_url="/openapi.json" if docs_enabled else None,
    )

    # Security logging
    if settings.SECURITY_LOG_ENABLED:
        logger.info(f"Starting AI-Doc-Editor API in {settings.ENVIRONMENT} mode")
        logger.info(
            f"Security features enabled: rate_limiting={settings.AUDIT_RATE_LIMIT_ENABLED}, "
            f"secure_headers={settings.SECURE_HEADERS}, cors_restricted=True"
        )

    # Add security middleware (order matters!)

    # 1. Trusted Host Middleware (first line of defense)
    if settings.ENVIRONMENT == "production":
        app.add_middleware(
            TrustedHostMiddleware,
            allowed_hosts=settings.ALLOWED_HOSTS + ["*.yourdomain.com"],  # Add production domains
        )

    # 2. Security Headers Middleware
    if settings.SECURE_HEADERS:
        app.add_middleware(SecurityHeadersMiddleware)

    # 3. Rate Limiting Middleware
    if settings.AUDIT_RATE_LIMIT_ENABLED:
        app.add_middleware(RateLimitMiddleware)
        logger.info("Rate limiting enabled for all endpoints")

    # 4. Audit middleware - must be added before CORS but after security
    app.add_middleware(AuditMiddleware, audit_service=AuditService())

    # 5. CORS middleware (restrictive configuration)
    cors_origins = settings.ALLOWED_ORIGINS

    # Production: Remove localhost/development origins
    if settings.ENVIRONMENT == "production":
        cors_origins = [
            origin
            for origin in cors_origins
            if not any(dev in origin for dev in ["localhost", "127.0.0.1", "0.0.0.0"])
        ]
        logger.info(f"Production CORS origins: {cors_origins}")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
        allow_methods=settings.CORS_ALLOW_METHODS,
        allow_headers=settings.CORS_ALLOW_HEADERS,
        max_age=settings.CORS_MAX_AGE,
    )

    return app


# Initialize application
app = create_app()

# Include routers
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(config.router, prefix="/api", tags=["config"])
app.include_router(credentials.router, prefix="/api", tags=["credentials"])
app.include_router(audit.router, prefix="/api", tags=["audit"])


# Global exception handler for security
@app.exception_handler(429)
async def rate_limit_handler(request: Request, exc):
    """Handle rate limit exceptions with security logging"""
    client_ip = request.client.host if request.client else "unknown"
    logger.warning(f"Rate limit exceeded for IP {client_ip} on path {request.url.path}")

    return JSONResponse(
        status_code=429,
        content={
            "error": "Rate limit exceeded",
            "message": "Too many requests. Please try again later.",
            "retry_after": 60,
        },
    )


@app.get("/")
async def root(request: Request):
    """Root endpoint with security-aware response"""
    client_ip = request.client.host if request.client else "unknown"

    # Log API access for monitoring
    if settings.SECURITY_LOG_ENABLED:
        logger.info(f"Root endpoint accessed from IP: {client_ip}")

    response_data = {
        "message": "AI-Doc-Editor API",
        "version": "0.1.0",
        "status": "running",
        "environment": settings.ENVIRONMENT,
        "security_enabled": True,
    }

    # Only show docs URL in development
    if settings.DEBUG and settings.ENVIRONMENT != "production":
        response_data["docs"] = "/docs"
        response_data["redoc"] = "/redoc"
    else:
        response_data["docs"] = "disabled in production for security"

    return JSONResponse(response_data)


# Security endpoint for health monitoring
@app.get("/api/security/status")
async def security_status(request: Request):
    """Security configuration status endpoint"""
    if settings.ENVIRONMENT == "production" and not settings.DEBUG:
        # In production, limit information exposure
        return JSONResponse({"status": "secure", "environment": settings.ENVIRONMENT})

    return JSONResponse(
        {
            "rate_limiting": settings.AUDIT_RATE_LIMIT_ENABLED,
            "security_headers": settings.SECURE_HEADERS,
            "audit_enabled": settings.AUDIT_ENABLED,
            "cors_restricted": True,
            "https_required": settings.REQUIRE_HTTPS,
            "environment": settings.ENVIRONMENT,
            "debug_mode": settings.DEBUG,
        }
    )


if __name__ == "__main__":
    import uvicorn

    # Production-safe server configuration
    server_config = {
        "app": app,
        "port": int(os.getenv("PORT", 8000)),
        "log_level": settings.LOG_LEVEL.lower(),
        "access_log": settings.SECURITY_LOG_ENABLED,
    }

    # Development vs Production hosting
    if settings.ENVIRONMENT == "production":
        # Production: Bind to specific interface, not all interfaces
        server_config.update(
            {
                "host": "127.0.0.1",  # Secure binding - use reverse proxy for external access
                "ssl_keyfile": os.getenv("SSL_KEYFILE"),
                "ssl_certfile": os.getenv("SSL_CERTFILE"),
            }
        )
        logger.warning(
            "Production mode: API bound to localhost only. Use reverse proxy for external access."
        )
    else:
        # Development: Allow external connections
        server_config["host"] = "0.0.0.0"
        logger.info("Development mode: API accessible from external hosts")

    uvicorn.run(**server_config)
