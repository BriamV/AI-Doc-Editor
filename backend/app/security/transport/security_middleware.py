"""
TLS Security Middleware for FastAPI
Week 2 - T-12 Credential Store Security

FastAPI middleware for TLS security enforcement, certificate validation,
and security headers injection.
"""

import logging
import time
from typing import Dict, List, Optional, Set

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from app.core.config import settings
from app.security.transport.certificate_manager import certificate_manager

logger = logging.getLogger(__name__)


class TLSSecurityConfig:
    """TLS security configuration."""

    def __init__(self):
        self.enforce_tls = getattr(settings, "TLS_ENFORCE", True)
        self.min_tls_version = getattr(settings, "TLS_MIN_VERSION", "1.3")
        self.require_cert_validation = getattr(settings, "TLS_REQUIRE_CERT_VALIDATION", True)
        self.enforce_hsts = getattr(settings, "TLS_ENFORCE_HSTS", True)
        self.hsts_max_age = getattr(settings, "TLS_HSTS_MAX_AGE", 31536000)  # 1 year
        self.hsts_include_subdomains = getattr(settings, "TLS_HSTS_INCLUDE_SUBDOMAINS", True)
        self.hsts_preload = getattr(settings, "TLS_HSTS_PRELOAD", True)

        # Security headers configuration
        self.security_headers = {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Permissions-Policy": (
                "geolocation=(), microphone=(), camera=(), "
                "magnetometer=(), gyroscope=(), payment=()"
            ),
            "Content-Security-Policy": (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self'; "
                "connect-src 'self'; "
                "frame-ancestors 'none'; "
                "base-uri 'self'; "
                "form-action 'self'"
            ),
        }

        # Path-based TLS requirements
        self.tls_required_paths: Set[str] = {
            "/api/auth/",
            "/api/security/",
            "/api/documents/upload",
            "/api/user/",
            "/oauth/",
        }

        # Paths that bypass TLS requirements (health checks, etc.)
        self.tls_exempt_paths: Set[str] = {
            "/health",
            "/metrics",
            "/api/health",
        }

        # Environment-specific settings
        if hasattr(settings, "ENVIRONMENT"):
            if settings.ENVIRONMENT == "development":
                self.enforce_tls = getattr(settings, "TLS_ENFORCE_DEV", False)
                self.enforce_hsts = False
            elif settings.ENVIRONMENT == "testing":
                self.enforce_tls = False
                self.enforce_hsts = False


class SecurityEvent:
    """Security event for logging and monitoring."""

    def __init__(
        self,
        event_type: str,
        severity: str,
        description: str,
        request: Request,
        details: Optional[Dict] = None,
    ):
        self.event_type = event_type
        self.severity = severity
        self.description = description
        self.timestamp = time.time()
        self.client_ip = self._get_client_ip(request)
        self.user_agent = request.headers.get("user-agent", "unknown")
        self.path = request.url.path
        self.details = details or {}

    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP address."""
        # Check for forwarded IP headers
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()

        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip

        return request.client.host if request.client else "unknown"

    def to_dict(self) -> Dict:
        """Convert to dictionary for logging."""
        return {
            "event_type": self.event_type,
            "severity": self.severity,
            "description": self.description,
            "timestamp": self.timestamp,
            "client_ip": self.client_ip,
            "user_agent": self.user_agent,
            "path": self.path,
            "details": self.details,
        }


class TLSSecurityMiddleware(BaseHTTPMiddleware):
    """
    TLS Security Enforcement Middleware for FastAPI.

    Features:
    - TLS version enforcement
    - Certificate validation
    - Security headers injection
    - Path-based TLS requirements
    - Security event logging
    - Performance monitoring
    """

    def __init__(self, app: ASGIApp, config: Optional[TLSSecurityConfig] = None):
        super().__init__(app)
        self.config = config or TLSSecurityConfig()
        self.security_events: List[SecurityEvent] = []
        self._request_count = 0
        self._security_violations = 0

    async def dispatch(self, request: Request, call_next):
        """Process request through TLS security middleware."""
        start_time = time.time()
        self._request_count += 1

        try:
            # Validate TLS requirements
            tls_validation_result = await self._validate_tls_requirements(request)
            if not tls_validation_result.is_valid:
                return self._create_security_response(
                    tls_validation_result.error_message, tls_validation_result.status_code
                )

            # Validate certificate if required
            if self.config.require_cert_validation:
                cert_validation_result = await self._validate_client_certificate(request)
                if not cert_validation_result.is_valid:
                    return self._create_security_response(
                        cert_validation_result.error_message, cert_validation_result.status_code
                    )

            # Process request
            response = await call_next(request)

            # Inject security headers
            self._inject_security_headers(response, request)

            # Log successful request
            processing_time = time.time() - start_time
            await self._log_security_event(
                "tls_request_success",
                "info",
                f"TLS request processed successfully in {processing_time:.3f}s",
                request,
                {"processing_time": processing_time},
            )

            return response

        except Exception as e:
            logger.error(f"TLS security middleware error: {e}")
            await self._log_security_event(
                "middleware_error",
                "error",
                f"TLS security middleware error: {e}",
                request,
                {"exception": str(e)},
            )
            return self._create_security_response("Internal security error", 500)

    async def _validate_tls_requirements(self, request: Request) -> "ValidationResult":
        """Validate TLS requirements for the request."""
        try:
            # Check if path is exempt from TLS requirements
            if self._is_path_exempt(request.url.path):
                return ValidationResult(True)

            # Check if TLS is enforced globally
            if not self.config.enforce_tls:
                return ValidationResult(True)

            # Check if path requires TLS
            if self._path_requires_tls(request.url.path):
                if not self._is_secure_connection(request):
                    await self._log_security_event(
                        "tls_violation",
                        "warning",
                        f"Insecure connection to TLS-required path: {request.url.path}",
                        request,
                    )
                    return ValidationResult(False, "HTTPS required for this endpoint", 400)

                # Validate TLS version
                tls_version = self._get_tls_version(request)
                if tls_version and not self._is_tls_version_acceptable(tls_version):
                    await self._log_security_event(
                        "tls_version_violation",
                        "warning",
                        f"Unacceptable TLS version: {tls_version}",
                        request,
                        {"tls_version": tls_version},
                    )
                    return ValidationResult(
                        False, f"TLS {self.config.min_tls_version} or higher required", 400
                    )

            return ValidationResult(True)

        except Exception as e:
            logger.error(f"TLS validation error: {e}")
            return ValidationResult(False, "TLS validation error", 500)

    async def _validate_client_certificate(self, request: Request) -> "ValidationResult":
        """Validate client certificate if present."""
        try:
            # Extract client certificate from request
            # This would typically come from the web server (nginx, etc.)
            client_cert_header = request.headers.get("x-client-cert")

            if not client_cert_header:
                # No client certificate required for most endpoints
                return ValidationResult(True)

            # Validate certificate using certificate manager
            try:
                cert_bytes = self._decode_certificate_header(client_cert_header)
                is_valid, errors = await certificate_manager.validate_certificate_chain(
                    [cert_bytes], request.url.hostname
                )

                if not is_valid:
                    await self._log_security_event(
                        "cert_validation_failure",
                        "warning",
                        f"Client certificate validation failed: {errors}",
                        request,
                        {"validation_errors": errors},
                    )
                    return ValidationResult(False, "Invalid client certificate", 403)

                return ValidationResult(True)

            except Exception as e:
                logger.error(f"Certificate validation error: {e}")
                return ValidationResult(False, "Certificate validation error", 500)

        except Exception as e:
            logger.error(f"Client certificate validation error: {e}")
            return ValidationResult(False, "Client certificate validation error", 500)

    def _inject_security_headers(self, response: Response, request: Request):
        """Inject security headers into response."""
        try:
            # Inject standard security headers
            for header, value in self.config.security_headers.items():
                response.headers[header] = value

            # Inject HSTS header for HTTPS connections
            if self.config.enforce_hsts and self._is_secure_connection(request):
                hsts_value = f"max-age={self.config.hsts_max_age}"
                if self.config.hsts_include_subdomains:
                    hsts_value += "; includeSubDomains"
                if self.config.hsts_preload:
                    hsts_value += "; preload"
                response.headers["Strict-Transport-Security"] = hsts_value

            # Add custom security headers
            response.headers["X-TLS-Version"] = self._get_tls_version(request) or "unknown"
            response.headers["X-Security-Level"] = "high"

            # Environment-specific headers
            if hasattr(settings, "ENVIRONMENT") and settings.ENVIRONMENT != "production":
                response.headers["X-Environment"] = settings.ENVIRONMENT

        except Exception as e:
            logger.warning(f"Failed to inject security headers: {e}")

    def _is_path_exempt(self, path: str) -> bool:
        """Check if path is exempt from TLS requirements."""
        return any(path.startswith(exempt_path) for exempt_path in self.config.tls_exempt_paths)

    def _path_requires_tls(self, path: str) -> bool:
        """Check if path requires TLS."""
        return any(
            path.startswith(required_path) for required_path in self.config.tls_required_paths
        )

    def _is_secure_connection(self, request: Request) -> bool:
        """Check if connection is secure (HTTPS)."""
        # Check URL scheme
        if request.url.scheme == "https":
            return True

        # Check forwarded protocol headers
        forwarded_proto = request.headers.get("x-forwarded-proto", "").lower()
        if forwarded_proto == "https":
            return True

        # Check forwarded SSL header
        forwarded_ssl = request.headers.get("x-forwarded-ssl", "").lower()
        if forwarded_ssl == "on":
            return True

        return False

    def _get_tls_version(self, request: Request) -> Optional[str]:
        """Extract TLS version from request."""
        # This would typically come from the web server
        return request.headers.get("x-tls-version")

    def _is_tls_version_acceptable(self, tls_version: str) -> bool:
        """Check if TLS version meets minimum requirements."""
        try:
            # Parse TLS version (e.g., "1.3", "TLSv1.3")
            version_str = tls_version.replace("TLSv", "").replace("TLS", "")
            version_float = float(version_str)
            min_version_float = float(self.config.min_tls_version)

            return version_float >= min_version_float

        except (ValueError, AttributeError):
            logger.warning(f"Failed to parse TLS version: {tls_version}")
            return False

    def _decode_certificate_header(self, cert_header: str) -> bytes:
        """Decode certificate from header."""
        import base64

        # Remove URL encoding and decode base64
        cert_data = cert_header.replace("%20", " ").replace("%2B", "+").replace("%2F", "/")
        return base64.b64decode(cert_data)

    def _create_security_response(self, message: str, status_code: int) -> JSONResponse:
        """Create security error response."""
        self._security_violations += 1

        response_data = {"error": "Security Violation", "message": message, "code": status_code}

        # Don't expose internal details in production
        if hasattr(settings, "ENVIRONMENT") and settings.ENVIRONMENT == "production":
            response_data = {
                "error": "Security Violation",
                "message": "Access denied",
                "code": status_code,
            }

        return JSONResponse(
            content=response_data, status_code=status_code, headers={"X-Security-Violation": "true"}
        )

    async def _log_security_event(
        self,
        event_type: str,
        severity: str,
        description: str,
        request: Request,
        details: Optional[Dict] = None,
    ):
        """Log security event."""
        event = SecurityEvent(event_type, severity, description, request, details)
        self.security_events.append(event)

        # Log to application logger
        log_data = event.to_dict()
        if severity == "error":
            logger.error(f"Security Event: {description}", extra=log_data)
        elif severity == "warning":
            logger.warning(f"Security Event: {description}", extra=log_data)
        else:
            logger.info(f"Security Event: {description}", extra=log_data)

        # Keep only recent events in memory
        if len(self.security_events) > 1000:
            self.security_events = self.security_events[-500:]

    def get_security_metrics(self) -> Dict:
        """Get security metrics."""
        recent_events = [
            event
            for event in self.security_events
            if time.time() - event.timestamp < 3600  # Last hour
        ]

        return {
            "total_requests": self._request_count,
            "security_violations": self._security_violations,
            "recent_events": len(recent_events),
            "violation_rate": self._security_violations / max(self._request_count, 1),
            "event_types": {
                event_type: len([e for e in recent_events if e.event_type == event_type])
                for event_type in set(e.event_type for e in recent_events)
            },
        }

    def get_recent_security_events(self, limit: int = 50) -> List[Dict]:
        """Get recent security events."""
        recent_events = sorted(self.security_events, key=lambda e: e.timestamp, reverse=True)[
            :limit
        ]

        return [event.to_dict() for event in recent_events]


class ValidationResult:
    """TLS validation result."""

    def __init__(self, is_valid: bool, error_message: Optional[str] = None, status_code: int = 200):
        self.is_valid = is_valid
        self.error_message = error_message
        self.status_code = status_code


# Global middleware instance
tls_security_middleware_instance: Optional[TLSSecurityMiddleware] = None


def get_tls_security_middleware() -> Optional[TLSSecurityMiddleware]:
    """Get the global TLS security middleware instance."""
    return tls_security_middleware_instance


def create_tls_security_middleware(app: ASGIApp) -> TLSSecurityMiddleware:
    """Create and configure TLS security middleware."""
    global tls_security_middleware_instance

    config = TLSSecurityConfig()
    middleware = TLSSecurityMiddleware(app, config)
    tls_security_middleware_instance = middleware

    logger.info("TLS Security Middleware initialized")
    logger.info(f"TLS enforcement: {config.enforce_tls}")
    logger.info(f"Minimum TLS version: {config.min_tls_version}")
    logger.info(f"HSTS enforcement: {config.enforce_hsts}")

    return middleware
