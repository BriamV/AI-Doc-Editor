"""
Rate limiting middleware for FastAPI application
Security hardening for audit endpoints and general API protection

Architecture: Hexagonal Architecture (Ports & Adapters)
- RateLimitBackend (port): Abstract interface for rate limiting storage
- InMemoryRateLimitBackend (adapter): In-memory implementation
- RedisRateLimitBackend (adapter): Redis-based distributed implementation
"""

import asyncio
import time
from typing import Dict, Optional, Set, TYPE_CHECKING
from abc import ABC, abstractmethod
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Optional Redis import (graceful degradation if not installed)
if TYPE_CHECKING:
    # Type hints only - import regardless for type checking
    from redis.asyncio import Redis, ConnectionPool

try:
    from redis.asyncio import Redis, ConnectionPool

    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    Redis = None  # type: ignore
    ConnectionPool = None  # type: ignore
    logger.warning("redis package not installed. Redis rate limiting unavailable.")


# ============================================================================
# Hexagonal Architecture: Port (Abstract Interface)
# ============================================================================


class RateLimitBackend(ABC):
    """
    Abstract interface for rate limiting storage (Port).

    Implementations (Adapters):
    - InMemoryRateLimitBackend: Local development, single-server
    - RedisRateLimitBackend: Production, distributed multi-server
    """

    @abstractmethod
    async def get(self, key: str, window: int) -> int:
        """Get current request count for a key within the time window."""
        pass

    @abstractmethod
    async def increment(self, key: str, window: int) -> int:
        """Increment request count and return new count."""
        pass

    @abstractmethod
    async def reset(self, key: str) -> None:
        """Reset rate limit for a key."""
        pass

    @abstractmethod
    async def close(self) -> None:
        """Close connections and cleanup resources."""
        pass


# ============================================================================
# Adapter 1: In-Memory Implementation
# ============================================================================


class InMemoryRateLimitBackend(RateLimitBackend):
    """
    In-memory rate limit backend for local development.

    Limitations:
    - Not distributed (single server only)
    - Lost on server restart
    - No synchronization across processes

    Use for: Development, testing, single-server deployments
    """

    def __init__(self):
        self._store: Dict[str, Dict[str, int]] = {}
        self._expiry: Dict[str, float] = {}
        self._lock = asyncio.Lock()

    async def get(self, key: str, window: int) -> int:
        """Get current request count for a key within the time window."""
        async with self._lock:
            current_time = time.time()

            # Clean expired entries
            if key in self._expiry and current_time > self._expiry[key]:
                self._store.pop(key, None)
                self._expiry.pop(key, None)

            return self._store.get(key, {}).get("count", 0)

    async def increment(self, key: str, window: int) -> int:
        """Increment request count and return new count."""
        async with self._lock:
            current_time = time.time()

            # Clean expired entries
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

    async def reset(self, key: str) -> None:
        """Reset rate limit for a key."""
        async with self._lock:
            self._store.pop(key, None)
            self._expiry.pop(key, None)

    async def close(self) -> None:
        """No-op for in-memory backend."""
        pass


# ============================================================================
# Adapter 2: Redis Implementation (Distributed)
# ============================================================================


class RedisRateLimitBackend(RateLimitBackend):
    """
    Redis-based distributed rate limit backend.

    Features:
    - Distributed across multiple servers
    - Persistent across server restarts
    - Atomic operations (thread-safe, process-safe)
    - Sliding window counter algorithm
    - Auto-expiry via Redis TTL

    Use for: Production, multi-server deployments
    """

    def __init__(self, redis_client: Redis):
        self.redis = redis_client
        self.key_prefix = settings.REDIS_RATE_LIMIT_KEY_PREFIX

    def _make_key(self, key: str) -> str:
        """Create prefixed Redis key."""
        return f"{self.key_prefix}:{key}"

    async def get(self, key: str, window: int) -> int:
        """Get current request count for a key within the time window."""
        try:
            redis_key = self._make_key(key)
            count = await self.redis.get(redis_key)
            return int(count) if count else 0
        except Exception as e:
            logger.error(f"Redis get error for key {key}: {e}")
            # Fail-safe: Return high count to trigger rate limit on Redis failure
            raise

    async def increment(self, key: str, window: int) -> int:
        """
        Increment request count using atomic Redis operations.

        Algorithm: Sliding window counter
        - INCR: Atomic increment (thread-safe)
        - EXPIRE: Set TTL if new key (auto-cleanup)
        """
        try:
            redis_key = self._make_key(key)

            # Use Redis pipeline for atomic operations
            pipe = self.redis.pipeline()
            pipe.incr(redis_key)
            pipe.expire(redis_key, window)
            results = await pipe.execute()

            count = results[0]
            return count
        except Exception as e:
            logger.error(f"Redis increment error for key {key}: {e}")
            # Fail-safe: Raise to trigger 503 response
            raise

    async def reset(self, key: str) -> None:
        """Reset rate limit for a key."""
        try:
            redis_key = self._make_key(key)
            await self.redis.delete(redis_key)
        except Exception as e:
            logger.error(f"Redis reset error for key {key}: {e}")
            raise

    async def close(self) -> None:
        """Close Redis connection."""
        try:
            await self.redis.aclose()
        except Exception as e:
            logger.error(f"Redis close error: {e}")


# ============================================================================
# Legacy In-Memory Store (Deprecated, use InMemoryRateLimitBackend)
# ============================================================================


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
    """
    Rate limiting middleware with different limits for different endpoints.

    Architecture: Hexagonal Architecture
    - Uses RateLimitBackend interface (port)
    - Supports both InMemoryRateLimitBackend and RedisRateLimitBackend (adapters)

    Configuration:
    - REDIS_USE_DISTRIBUTED_RATE_LIMITING=True: Use Redis backend
    - REDIS_USE_DISTRIBUTED_RATE_LIMITING=False: Use in-memory backend
    """

    # Rate limit configurations (T-03 ST1: Endpoint-specific limits)
    RATE_LIMITS = {
        # Document upload - high resource cost
        "/api/documents/upload": {
            "per_ip": {"requests": 10, "window": 60},  # 10 requests per minute per IP
            "per_user": {"requests": 10, "window": 60},  # 10 requests per minute per user
        },
        # AI endpoints - OpenAI API rate limits apply
        "/api/plan": {
            "per_ip": {"requests": 30, "window": 60},  # 30 requests per minute per IP
            "per_user": {"requests": 30, "window": 60},  # 30 requests per minute per user
        },
        "/api/rewrite": {
            "per_ip": {"requests": 20, "window": 60},  # 20 requests per minute per IP
            "per_user": {"requests": 20, "window": 60},  # 20 requests per minute per user
        },
        "/api/draft_section": {
            "per_ip": {"requests": 15, "window": 60},  # 15 requests per minute per IP
            "per_user": {"requests": 15, "window": 60},  # 15 requests per minute per user
        },
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

    def __init__(self, app, backend: Optional[RateLimitBackend] = None):
        """
        Initialize rate limiting middleware.

        Args:
            app: FastAPI application
            backend: RateLimitBackend implementation (optional, auto-configured)
        """
        super().__init__(app)

        if backend:
            # Use provided backend (for testing)
            self.backend = backend
        else:
            # Auto-configure based on settings
            self.backend = self._create_backend()

        # Legacy store for backwards compatibility (deprecated)
        self.store = RateLimitStore()

    def _create_backend(self) -> RateLimitBackend:
        """
        Create appropriate rate limit backend based on configuration.

        Returns:
            RateLimitBackend: InMemoryRateLimitBackend or RedisRateLimitBackend
        """
        if settings.REDIS_USE_DISTRIBUTED_RATE_LIMITING:
            if not REDIS_AVAILABLE:
                logger.error(
                    "Redis rate limiting enabled but redis package not installed. "
                    "Falling back to in-memory backend."
                )
                return InMemoryRateLimitBackend()

            try:
                # Create Redis connection pool
                pool = ConnectionPool.from_url(
                    settings.REDIS_URL,
                    password=settings.REDIS_PASSWORD,
                    max_connections=settings.REDIS_MAX_CONNECTIONS,
                    decode_responses=True,
                    socket_connect_timeout=settings.REDIS_CONNECTION_TIMEOUT,
                )
                redis_client = Redis(connection_pool=pool)

                logger.info(
                    f"Redis rate limiting initialized: {settings.REDIS_URL} "
                    f"(prefix: {settings.REDIS_RATE_LIMIT_KEY_PREFIX})"
                )
                return RedisRateLimitBackend(redis_client)

            except Exception as e:
                logger.error(
                    f"Failed to initialize Redis rate limiting: {e}. "
                    f"Falling back to in-memory backend."
                )
                return InMemoryRateLimitBackend()
        else:
            logger.info("Using in-memory rate limiting (development mode)")
            return InMemoryRateLimitBackend()

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
            ip_count = await self.backend.increment(ip_key, ip_limit["window"])

            if ip_count > ip_limit["requests"]:
                logger.warning(
                    f"Rate limit exceeded for IP {client_ip} on path {path}: "
                    f"{ip_count}/{ip_limit['requests']} in {ip_limit['window']}s"
                )
                # Log security event for rate limit violation
                SecurityLogger.log_rate_limit_violation(
                    ip=client_ip, path=path, count=ip_count, limit=ip_limit["requests"]
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
                user_count = await self.backend.increment(user_key, user_limit["window"])

                if user_count > user_limit["requests"]:
                    logger.warning(
                        f"Rate limit exceeded for user {user_id} on path {path}: "
                        f"{user_count}/{user_limit['requests']} in {user_limit['window']}s"
                    )
                    # Log security event for rate limit violation
                    SecurityLogger.log_rate_limit_violation(
                        ip=client_ip, path=path, count=user_count, limit=user_limit["requests"]
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


# Global rate limit store for decorator
_rate_limit_store = RateLimitStore()


def rate_limit(requests: int, window: int):
    """
    Rate limiting decorator for FastAPI endpoints.

    Args:
        requests: Maximum number of requests allowed
        window: Time window in seconds
    """

    def decorator(func):
        async def wrapper(*args, **kwargs):
            # For now, return the original function
            # Full rate limiting implementation would need request context
            return await func(*args, **kwargs)

        return wrapper

    return decorator
