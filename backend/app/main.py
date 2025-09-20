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
import time

from app.core.config import settings
from app.routers import auth, health, config, credentials, audit
from app.middleware.audit_middleware import AuditMiddleware
from app.services.audit import AuditService
from app.security.rate_limiter import RateLimitMiddleware, SecurityHeadersMiddleware

# Setup logger
logger = logging.getLogger(__name__)

# Import TLS security components for Week 2
try:
    from app.security.transport.security_middleware import TLSSecurityMiddleware
    from app.security.transport.tls_config import TLSConfig

    TLS_SECURITY_AVAILABLE = True
except ImportError:
    logger.warning("TLS security middleware not available")
    TLS_SECURITY_AVAILABLE = False

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def _build_fastapi_app() -> FastAPI:
    """Create base FastAPI app with docs toggled by environment."""
    docs_enabled = settings.DEBUG and settings.ENVIRONMENT != "production"
    return FastAPI(
        title=settings.APP_NAME,
        description="AI-Doc-Editor Backend API with Security Hardening",
        version="0.1.0",
        docs_url="/docs" if docs_enabled else None,
        redoc_url="/redoc" if docs_enabled else None,
        openapi_url="/openapi.json" if docs_enabled else None,
    )


def _log_security_banner() -> None:
    """Log security-related boot information when enabled."""
    if settings.SECURITY_LOG_ENABLED:
        logger.info(f"Starting AI-Doc-Editor API in {settings.ENVIRONMENT} mode")
        logger.info(
            "Security features enabled: "
            f"rate_limiting={settings.AUDIT_RATE_LIMIT_ENABLED}, "
            f"secure_headers={settings.SECURE_HEADERS}, cors_restricted=True"
        )


def _add_security_middleware(app: FastAPI) -> None:
    """Attach security middlewares in the correct order."""
    # 1. Trusted Host Middleware (first line of defense)
    if settings.ENVIRONMENT == "production":
        app.add_middleware(
            TrustedHostMiddleware,
            allowed_hosts=settings.ALLOWED_HOSTS + ["*.yourdomain.com"],
        )

    # 2. TLS Security Middleware (Week 2 addition)
    if TLS_SECURITY_AVAILABLE and settings.REQUIRE_HTTPS:
        tls_config = TLSConfig()
        app.add_middleware(TLSSecurityMiddleware, tls_config=tls_config)
        logger.info("TLS security middleware enabled")

    # 3. Security Headers Middleware
    if settings.SECURE_HEADERS:
        app.add_middleware(SecurityHeadersMiddleware)

    # 4. Rate Limiting Middleware
    if settings.AUDIT_RATE_LIMIT_ENABLED:
        app.add_middleware(RateLimitMiddleware)
        logger.info("Rate limiting enabled for all endpoints")

    # 5. Audit middleware - must be added before CORS but after security
    app.add_middleware(AuditMiddleware, audit_service=AuditService())


def _configure_cors(app: FastAPI) -> None:
    """Configure restrictive CORS with production adjustments."""
    cors_origins = settings.ALLOWED_ORIGINS
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


# Create FastAPI application with security-first configuration
def create_app() -> FastAPI:
    """Create and configure FastAPI application with security hardening."""
    app = _build_fastapi_app()
    _log_security_banner()
    _add_security_middleware(app)
    _configure_cors(app)
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
@app.head("/")
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


# TLS Security endpoint (Week 2 addition)
@app.get("/api/security/tls")
async def tls_security_status(request: Request):
    """TLS security configuration and status endpoint"""
    if settings.ENVIRONMENT == "production" and not settings.DEBUG:
        # In production, limit information exposure
        return JSONResponse(
            {"tls_enabled": settings.REQUIRE_HTTPS, "environment": settings.ENVIRONMENT}
        )

    try:
        # Get TLS configuration
        tls_config_info = settings.get_tls_security_config()

        # Get TLS 1.3 availability
        if TLS_SECURITY_AVAILABLE:
            tls_config = TLSConfig()
            tls_available = tls_config.is_tls_1_3_available()

            # Get cipher suite analysis if enhanced components available
            cipher_analysis = tls_config.get_cipher_suite_analysis()
            compliance_report = tls_config.get_compliance_report()
        else:
            tls_available = False
            cipher_analysis = {"error": "Enhanced components not available"}
            compliance_report = {"error": "Enhanced components not available"}

        return JSONResponse(
            {
                "tls_configuration": tls_config_info,
                "tls_1_3_available": tls_available,
                "enhanced_components_available": TLS_SECURITY_AVAILABLE,
                "cipher_suite_analysis": cipher_analysis,
                "compliance_report": compliance_report,
                "timestamp": time.time(),
            }
        )

    except Exception as e:
        logger.error(f"Error getting TLS status: {e}")
        return JSONResponse(
            {
                "error": "Failed to retrieve TLS status",
                "tls_enabled": settings.REQUIRE_HTTPS,
                "environment": settings.ENVIRONMENT,
            },
            status_code=500,
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
