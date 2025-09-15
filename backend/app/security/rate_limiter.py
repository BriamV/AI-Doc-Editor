"""
Rate limiting middleware for FastAPI application
Security hardening for audit endpoints and general API protection
"""

import asyncio
import time
from typing import Dict, Optional, Set
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class RateLimitStore:
    """In-memory rate limit store with expiry management"""

    def __init__(self):
        self._store: Dict[str, Dict[str, int]] = {}
        self._expiry: Dict[str, float] = {}
        self._lock = asyncio.Lock()

    async def get(self, key: str, window: int) -> int:
        """Get current request count for a key within the time window"""
        async with self._lock:
            current_time = time.time()

            # Clean expired entries
            if key in self._expiry and current_time > self._expiry[key]:
                self._store.pop(key, None)
                self._expiry.pop(key, None)

            return self._store.get(key, {}).get("count", 0)

    async def increment(self, key: str, window: int) -> int:
        """Increment request count for a key and return new count"""
        async with self._lock:
            current_time = time.time()

            # Clean expired entries first
            if key in self._expiry and current_time > self._expiry[key]:
                self._store.pop(key, None)
                self._expiry.pop(key, None)

            # Initialize or increment
            if key not in self._store:
                self._store[key] = {"count": 1, "start_time": current_time}
                self._expiry[key] = current_time + window
            else:
                self._store[key]["count"] += 1

            return self._store[key]["count"]

    async def reset(self, key: str):
        """Reset rate limit for a key"""
        async with self._lock:
            self._store.pop(key, None)
            self._expiry.pop(key, None)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware with different limits for different endpoints"""

    # Rate limit configurations
    RATE_LIMITS = {
        # Audit endpoints - stricter limits due to sensitive data
        "/api/audit": {
            "per_ip": {"requests": 30, "window": 60},  # 30 requests per minute per IP
            "per_user": {"requests": 100, "window": 60},  # 100 requests per minute per user
        },
        # Authentication endpoints
        "/api/auth": {
            "per_ip": {"requests": 20, "window": 60},  # 20 requests per minute per IP
            "per_user": {"requests": 50, "window": 60},  # 50 requests per minute per user
        },
        # General API endpoints
        "default": {
            "per_ip": {"requests": 100, "window": 60},  # 100 requests per minute per IP
            "per_user": {"requests": 200, "window": 60},  # 200 requests per minute per user
        },
    }

    # Exempt paths from rate limiting
    EXEMPT_PATHS: Set[str] = {
        "/",
        "/docs",
        "/redoc",
        "/openapi.json",
        "/api/health",
    }

    def __init__(self, app):
        super().__init__(app)
        self.store = RateLimitStore()

    def get_client_ip(self, request: Request) -> str:
        """Extract client IP address from request"""
        # Check for forwarded headers first (reverse proxy)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()

        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip

        # Fallback to direct connection
        return request.client.host if request.client else "unknown"

    def get_user_id(self, request: Request) -> Optional[str]:
        """Extract user ID from JWT token if available"""
        try:
            auth_header = request.headers.get("authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                return None

            # This is a simplified version - in production, verify the token
            # For now, we'll use the IP as user identifier if no token
            return None
        except Exception:
            return None

    def get_rate_limit_config(self, path: str):
        """Get rate limit configuration for a specific path"""
        for pattern, config in self.RATE_LIMITS.items():
            if pattern != "default" and path.startswith(pattern):
                return config
        return self.RATE_LIMITS["default"]

    def _build_limit_headers(self, limit: int, count: int, window: int) -> dict:
        now = int(time.time())
        return {
            "Retry-After": str(window),
            "X-RateLimit-Limit": str(limit),
            "X-RateLimit-Remaining": str(max(0, limit - count)),
            "X-RateLimit-Reset": str(now + window),
        }

    def _rate_limited(self, message: str, window: int, limit: int, count: int) -> JSONResponse:
        return JSONResponse(
            status_code=429,
            content={
                "error": "Rate limit exceeded",
                "message": message,
                "retry_after": window,
            },
            headers=self._build_limit_headers(limit, count, window),
        )

    async def dispatch(self, request: Request, call_next):
        """Main middleware dispatch function"""
        path = request.url.path

        # Skip rate limiting for exempt paths
        if path in self.EXEMPT_PATHS:
            return await call_next(request)

        # Skip rate limiting if disabled in settings
        if not getattr(settings, "AUDIT_RATE_LIMIT_ENABLED", True):
            return await call_next(request)

        client_ip = self.get_client_ip(request)
        user_id = self.get_user_id(request)

        # Get rate limit configuration
        config = self.get_rate_limit_config(path)

        try:
            # Check IP-based rate limit
            ip_limit = config["per_ip"]
            ip_key = f"ip:{client_ip}:{path}"
            ip_count = await self.store.increment(ip_key, ip_limit["window"])

            if ip_count > ip_limit["requests"]:
                logger.warning(
                    f"Rate limit exceeded for IP {client_ip} on path {path}: "
                    f"{ip_count}/{ip_limit['requests']} in {ip_limit['window']}s"
                )
                return self._rate_limited(
                    message=(
                        f"Too many requests from IP. Limit: {ip_limit['requests']} per "
                        f"{ip_limit['window']} seconds"
                    ),
                    window=ip_limit["window"],
                    limit=ip_limit["requests"],
                    count=ip_count,
                )

            # Check user-based rate limit (if user is identified)
            if user_id:
                user_limit = config["per_user"]
                user_key = f"user:{user_id}:{path}"
                user_count = await self.store.increment(user_key, user_limit["window"])

                if user_count > user_limit["requests"]:
                    logger.warning(
                        f"Rate limit exceeded for user {user_id} on path {path}: "
                        f"{user_count}/{user_limit['requests']} in {user_limit['window']}s"
                    )
                    return self._rate_limited(
                        message=(
                            f"Too many requests for user. Limit: {user_limit['requests']} per "
                            f"{user_limit['window']} seconds"
                        ),
                        window=user_limit["window"],
                        limit=user_limit["requests"],
                        count=user_count,
                    )

            # Process request
            response = await call_next(request)

            # Add rate limit headers to successful responses
            response.headers["X-RateLimit-Limit"] = str(ip_limit["requests"])
            response.headers["X-RateLimit-Remaining"] = str(max(0, ip_limit["requests"] - ip_count))
            response.headers["X-RateLimit-Reset"] = str(int(time.time()) + ip_limit["window"])

            return response

        except Exception as e:
            logger.error(f"Rate limiting error: {str(e)}")
            # If rate limiting fails, allow request to proceed
            return await call_next(request)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Security headers middleware for comprehensive protection"""

    def __init__(self, app):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):
        """Add security headers to all responses"""
        response = await call_next(request)

        # Security headers
        security_headers = {
            # Content Security Policy - restrictive by default
            "Content-Security-Policy": (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self' data:; "
                "connect-src 'self'; "
                "frame-ancestors 'none'; "
                "form-action 'self'; "
                "base-uri 'self';"
            ),
            # Prevent clickjacking
            "X-Frame-Options": "DENY",
            # Prevent MIME type sniffing
            "X-Content-Type-Options": "nosniff",
            # XSS protection
            "X-XSS-Protection": "1; mode=block",
            # Referrer policy
            "Referrer-Policy": "strict-origin-when-cross-origin",
            # Permissions policy
            "Permissions-Policy": (
                "camera=(), microphone=(), geolocation=(), "
                "payment=(), usb=(), magnetometer=(), accelerometer=(), gyroscope=()"
            ),
            # HSTS (only for HTTPS)
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
            # Server information hiding
            "Server": "AI-Doc-Editor-API",
            # Cache control for sensitive content
            "Cache-Control": (
                "no-cache, no-store, must-revalidate"
                if "/api/audit" in str(request.url)
                else "private, max-age=0"
            ),
            # Pragma for HTTP/1.0 compatibility
            "Pragma": "no-cache" if "/api/audit" in str(request.url) else "no-cache",
        }

        # Add headers to response
        for header, value in security_headers.items():
            response.headers[header] = value

        # Remove server header that might expose technology
        if "server" in response.headers:
            del response.headers["server"]

        return response


class SecurityLogger:
    """Security event logger for audit and monitoring"""

    @staticmethod
    def log_security_event(event_type: str, details: dict, severity: str = "INFO"):
        """Log security events for monitoring and alerting"""
        logger.log(
            getattr(logging, severity.upper(), logging.INFO),
            f"SECURITY_EVENT: {event_type}",
            extra={
                "security_event": True,
                "event_type": event_type,
                "details": details,
                "severity": severity,
            },
        )

    @staticmethod
    def log_rate_limit_violation(ip: str, path: str, count: int, limit: int):
        """Log rate limit violations"""
        SecurityLogger.log_security_event(
            "RATE_LIMIT_EXCEEDED",
            {
                "ip_address": ip,
                "path": path,
                "request_count": count,
                "limit": limit,
                "timestamp": time.time(),
            },
            "WARNING",
        )

    @staticmethod
    def log_suspicious_activity(ip: str, details: dict):
        """Log suspicious activities"""
        SecurityLogger.log_security_event(
            "SUSPICIOUS_ACTIVITY",
            {"ip_address": ip, "details": details, "timestamp": time.time()},
            "WARNING",
        )
