"""
Configuration settings for FastAPI backend
T-02: OAuth 2.0 + JWT settings
"""

import re
import secrets
import logging
from typing import Optional, Dict, Any, List
from pydantic_settings import BaseSettings
from pydantic import Field, validator
from cryptography.fernet import Fernet
from urllib.parse import urlparse


class Settings(BaseSettings):
    # App settings
    APP_NAME: str = "AI Doc Editor API"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"  # development, staging, production

    # Production security settings
    SECURE_SSL_REDIRECT: bool = False  # Enable in production with HTTPS
    SECURE_HEADERS: bool = True
    ALLOWED_HOSTS: list = ["localhost", "127.0.0.1", "0.0.0.0"]

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./app.db"

    # JWT settings - Enhanced security
    SECRET_KEY: str = Field(
        default="development-secret-key-change-in-production-T02-2025",
        description="JWT secret key - MUST be changed in production",
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    JWT_ISSUER: str = "ai-doc-editor"
    JWT_AUDIENCE: str = "ai-doc-editor-api"

    # Secret validation patterns
    JWT_SECRET_MIN_LENGTH: int = 32
    JWT_SECRET_ENTROPY_THRESHOLD: float = 3.0  # Minimum entropy bits per character

    # OAuth providers - Production ready configuration
    # Required for OAuth authentication - set via environment variables
    GOOGLE_CLIENT_ID: str = Field(
        default="", description="Google OAuth 2.0 Client ID - Required for Google authentication"
    )
    GOOGLE_CLIENT_SECRET: str = Field(
        default="", description="Google OAuth 2.0 Client Secret - SENSITIVE: Never log or expose"
    )
    MICROSOFT_CLIENT_ID: str = Field(
        default="",
        description="Microsoft OAuth 2.0 Client ID - Required for Microsoft authentication",
    )
    MICROSOFT_CLIENT_SECRET: str = Field(
        default="", description="Microsoft OAuth 2.0 Client Secret - SENSITIVE: Never log or expose"
    )

    # OAuth client ID validation patterns
    GOOGLE_CLIENT_ID_PATTERN: str = r"^[0-9]+-[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$"
    MICROSOFT_CLIENT_ID_PATTERN: str = (
        r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
    )

    # Production domain (required for production OAuth callbacks)
    PRODUCTION_DOMAIN: str = Field(
        default="", description="Production domain with protocol (e.g., https://yourdomain.com)"
    )

    # OAuth security enhancements
    OAUTH_SECRETS_ENCRYPTION_KEY: str = Field(
        default="", description="Fernet key for encrypting OAuth secrets at rest"
    )
    OAUTH_SECRET_ROTATION_DAYS: int = 90  # Recommend secret rotation every 90 days
    OAUTH_SECRET_EXPIRY_WARNING_DAYS: int = 30  # Warn 30 days before expiry
    OAUTH_CALLBACK_TIMEOUT_SECONDS: int = 300  # 5 minutes max for OAuth callbacks
    OAUTH_MAX_RETRIES: int = 3  # Maximum OAuth retry attempts
    OAUTH_RATE_LIMIT_PER_HOUR: int = 100  # OAuth requests per hour per IP

    # OAuth scopes
    GOOGLE_SCOPES: list = ["openid", "email", "profile"]
    MICROSOFT_SCOPES: list = ["openid", "email", "profile"]

    # OAuth security settings
    OAUTH_STATE_EXPIRE_MINUTES: int = 10  # State parameter expiration
    OAUTH_NONCE_LENGTH: int = 32  # Nonce length for security

    # CORS Security - Restrictive by default
    FRONTEND_URL: str = "http://localhost:5173"
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: List[str] = ["GET", "POST", "PUT", "DELETE", "PATCH"]
    CORS_ALLOW_HEADERS: List[str] = [
        "Authorization",
        "Content-Type",
        "X-Requested-With",
        "X-CSRF-Token",
        "Accept",
        "Accept-Version",
        "Content-Length",
        "Content-MD5",
        "Date",
        "X-Api-Version",
        "X-Request-ID",  # For request tracing
    ]
    CORS_MAX_AGE: int = 600  # 10 minutes

    # Enhanced CORS security for production
    CORS_STRICT_ORIGIN_VALIDATION: bool = True
    CORS_BLOCKED_USER_AGENTS: List[str] = ["curl", "wget", "scanner"]  # Block common scanners

    # Rate limiting settings
    AUDIT_RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_BURST: int = 10
    RATE_LIMIT_AUDIT_PER_MINUTE: int = 30  # Stricter for audit endpoints

    # Security settings
    SESSION_TIMEOUT_MINUTES: int = 30
    MAX_LOGIN_ATTEMPTS: int = 5
    LOGIN_LOCKOUT_MINUTES: int = 15
    PASSWORD_MIN_LENGTH: int = 8
    REQUIRE_HTTPS: bool = False  # Set to True in production

    # TLS 1.3 Configuration (Week 2 - T-12)
    TLS_SECURITY_LEVEL: str = "high"  # maximum, high, medium, compatibility
    TLS_CERTIFICATE_PATH: str = ""  # Path to TLS certificate file
    TLS_PRIVATE_KEY_PATH: str = ""  # Path to TLS private key file
    TLS_CERTIFICATE_CHAIN_PATH: str = ""  # Path to certificate chain file
    TLS_ENABLE_OCSP_STAPLING: bool = True
    TLS_CERTIFICATE_VALIDATION_TIMEOUT: int = 30
    TLS_PINNED_CERTIFICATES: List[str] = []  # SHA256 fingerprints for certificate pinning

    # Enhanced security settings
    SECURITY_HEADERS_ENABLED: bool = True
    HSTS_MAX_AGE: int = 31536000  # 1 year
    HSTS_INCLUDE_SUBDOMAINS: bool = True
    HSTS_PRELOAD: bool = True

    # Security monitoring
    FAILED_AUTH_THRESHOLD: int = 10  # Alert after 10 failed auth attempts
    SUSPICIOUS_ACTIVITY_WINDOW_MINUTES: int = 15
    SECURITY_EVENT_RETENTION_DAYS: int = 365
    INTRUSION_DETECTION_ENABLED: bool = True

    # Content Security Policy
    CSP_DEFAULT_SRC: str = "'self'"
    CSP_SCRIPT_SRC: str = "'self' 'unsafe-inline'"
    CSP_STYLE_SRC: str = "'self' 'unsafe-inline'"
    CSP_IMG_SRC: str = "'self' data: https:"
    CSP_FONT_SRC: str = "'self' data:"
    CSP_CONNECT_SRC: str = "'self'"
    CSP_FRAME_ANCESTORS: str = "'none'"

    # Audit system settings - Enhanced security
    AUDIT_ENABLED: bool = True
    AUDIT_RETENTION_DAYS: int = 365
    AUDIT_MAX_LOG_SIZE: int = 1000000
    AUDIT_INTEGRITY_CHECKS: bool = True
    AUDIT_ENCRYPTION_KEY: str = "audit-encryption-key-change-in-production"
    AUDIT_HASH_ALGORITHM: str = "SHA256"
    AUDIT_LOG_SENSITIVE_DATA: bool = False  # Disable logging sensitive data

    # Logging and monitoring
    LOG_LEVEL: str = "INFO"
    SECURITY_LOG_ENABLED: bool = True
    PERFORMANCE_MONITORING: bool = True

    # Security logging configuration
    SECURITY_LOG_FILE: str = "security.log"
    AUDIT_LOG_FILE: str = "audit.log"
    LOG_SANITIZATION_ENABLED: bool = True  # Remove sensitive data from logs
    LOG_STRUCTURED_FORMAT: bool = True  # Use structured JSON logging
    LOG_RETENTION_DAYS: int = 90

    # Sensitive data patterns to redact from logs
    SENSITIVE_PATTERNS: List[str] = [
        r"(?i)(password|secret|token|key)[:=]\s*['\"]?([^'\"\s,}]+)",
        r"(?i)(client_secret|refresh_token|access_token)[:=]\s*['\"]?([^'\"\s,}]+)",
        r"(?i)(authorization):\s*bearer\s+([^\s]+)",
        r"(?i)(api_key|apikey)[:=]\s*['\"]?([^'\"\s,}]+)",
    ]

    @validator("SECRET_KEY")
    def validate_secret_key(cls, v: str, values: Dict[str, Any]) -> str:
        """Validate JWT secret key strength"""
        environment = values.get("ENVIRONMENT", "development")

        if environment == "production":
            if len(v) < cls.JWT_SECRET_MIN_LENGTH:
                raise ValueError(
                    f"SECRET_KEY must be at least {cls.JWT_SECRET_MIN_LENGTH} characters in production"
                )

            # Check for default development key
            if "development-secret-key" in v.lower():
                raise ValueError(
                    "SECRET_KEY must be changed from default development value in production"
                )

            # Calculate entropy (simplified)
            unique_chars = len(set(v))
            entropy = unique_chars / len(v) if len(v) > 0 else 0

            if entropy < cls.JWT_SECRET_ENTROPY_THRESHOLD / 10:  # Adjust threshold
                logging.warning("SECRET_KEY has low entropy. Consider using a more random key.")

        return v

    @validator("GOOGLE_CLIENT_ID")
    def validate_google_client_id(cls, v: str) -> str:
        """Validate Google OAuth Client ID format"""
        if v and not re.match(cls.GOOGLE_CLIENT_ID_PATTERN, v):
            raise ValueError(
                "Invalid Google Client ID format. Expected format: numbers-string.apps.googleusercontent.com"
            )
        return v

    @validator("MICROSOFT_CLIENT_ID")
    def validate_microsoft_client_id(cls, v: str) -> str:
        """Validate Microsoft OAuth Client ID format (UUID)"""
        if v and not re.match(cls.MICROSOFT_CLIENT_ID_PATTERN, v.lower()):
            raise ValueError(
                "Invalid Microsoft Client ID format. Expected UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            )
        return v

    @validator("PRODUCTION_DOMAIN")
    def validate_production_domain(cls, v: str, values: Dict[str, Any]) -> str:
        """Validate production domain format and security"""
        environment = values.get("ENVIRONMENT", "development")

        if environment == "production" and v:
            # Ensure HTTPS in production
            if not v.startswith("https://"):
                raise ValueError(
                    "PRODUCTION_DOMAIN must use HTTPS in production environment for OAuth 2.0 compliance"
                )

            # Basic URL validation
            try:
                parsed = urlparse(v)
                if not parsed.netloc:
                    raise ValueError("Invalid domain format")
            except Exception:
                raise ValueError("Invalid PRODUCTION_DOMAIN format")

        return v

    def calculate_secret_entropy(self, secret: str) -> float:
        """Calculate entropy of a secret string"""
        if not secret:
            return 0.0

        # Count character frequency
        char_count = {}
        for char in secret:
            char_count[char] = char_count.get(char, 0) + 1

        # Calculate entropy
        length = len(secret)
        entropy = 0.0
        for count in char_count.values():
            probability = count / length
            if probability > 0:
                entropy -= probability * (probability.bit_length() - 1)

        return entropy

    def generate_secure_secret(self, length: int = 64) -> str:
        """Generate a cryptographically secure secret"""
        return secrets.token_urlsafe(length)

    def encrypt_secret(self, secret: str, key: Optional[str] = None) -> str:
        """Encrypt a secret using Fernet symmetric encryption"""
        if not key:
            key = self.OAUTH_SECRETS_ENCRYPTION_KEY or Fernet.generate_key().decode()

        try:
            fernet = Fernet(key.encode() if isinstance(key, str) else key)
            encrypted = fernet.encrypt(secret.encode())
            return encrypted.decode()
        except Exception as e:
            logging.error(f"Failed to encrypt secret: {str(e)}")
            raise ValueError("Secret encryption failed")

    def decrypt_secret(self, encrypted_secret: str, key: str) -> str:
        """Decrypt a secret using Fernet symmetric encryption"""
        try:
            fernet = Fernet(key.encode() if isinstance(key, str) else key)
            decrypted = fernet.decrypt(encrypted_secret.encode())
            return decrypted.decode()
        except Exception as e:
            logging.error(f"Failed to decrypt secret: {str(e)}")
            raise ValueError("Secret decryption failed")

    def sanitize_for_logging(self, data: Any) -> Any:
        """Remove sensitive information from data before logging"""
        if not self.LOG_SANITIZATION_ENABLED:
            return data

        if isinstance(data, dict):
            sanitized = {}
            for key, value in data.items():
                if any(
                    pattern in key.lower() for pattern in ["secret", "password", "token", "key"]
                ):
                    sanitized[key] = "***REDACTED***"
                else:
                    sanitized[key] = self.sanitize_for_logging(value)
            return sanitized
        elif isinstance(data, str):
            # Apply regex patterns to redact sensitive data
            sanitized = data
            for pattern in self.SENSITIVE_PATTERNS:
                sanitized = re.sub(pattern, r"\1=***REDACTED***", sanitized)
            return sanitized
        elif isinstance(data, (list, tuple)):
            return [self.sanitize_for_logging(item) for item in data]
        else:
            return data

    def validate_oauth_config(self) -> Dict[str, Any]:
        """
        Validate OAuth configuration and return status
        Returns dict with provider status and validation results
        """
        validation_results = {
            "google": {
                "enabled": bool(self.GOOGLE_CLIENT_ID and self.GOOGLE_CLIENT_SECRET),
                "client_id_set": bool(self.GOOGLE_CLIENT_ID),
                "client_secret_set": bool(self.GOOGLE_CLIENT_SECRET),
            },
            "microsoft": {
                "enabled": bool(self.MICROSOFT_CLIENT_ID and self.MICROSOFT_CLIENT_SECRET),
                "client_id_set": bool(self.MICROSOFT_CLIENT_ID),
                "client_secret_set": bool(self.MICROSOFT_CLIENT_SECRET),
            },
        }

        # Production environment validation
        if self.ENVIRONMENT == "production":
            # Validate OAuth credentials
            for provider, config in validation_results.items():
                if not config["enabled"]:
                    raise ValueError(
                        f"OAuth {provider.title()} credentials are required in production environment. "
                        f"Set {provider.upper()}_CLIENT_ID and {provider.upper()}_CLIENT_SECRET"
                    )

            # Validate production domain
            if not self.PRODUCTION_DOMAIN:
                raise ValueError(
                    "PRODUCTION_DOMAIN is required in production environment. "
                    "Set PRODUCTION_DOMAIN=https://yourdomain.com"
                )

            # Validate production domain format
            if not self.PRODUCTION_DOMAIN.startswith(("https://", "http://")):
                raise ValueError(
                    "PRODUCTION_DOMAIN must include protocol (https:// recommended for production)"
                )

        # Add comprehensive security validation
        validation_results["security_checks"] = {
            "https_enforced": self.ENVIRONMENT == "production" and self.REQUIRE_HTTPS,
            "secret_key_secure": self._is_secret_key_secure(),
            "cors_configured": len(self.ALLOWED_ORIGINS) > 0,
            "rate_limiting_enabled": self.AUDIT_RATE_LIMIT_ENABLED,
            "audit_enabled": self.AUDIT_ENABLED,
            "security_headers_enabled": self.SECURITY_HEADERS_ENABLED,
            "log_sanitization_enabled": self.LOG_SANITIZATION_ENABLED,
        }

        # OAuth-specific security validations
        validation_results["oauth_security"] = {
            "callback_timeout_configured": self.OAUTH_CALLBACK_TIMEOUT_SECONDS > 0,
            "rate_limiting_configured": self.OAUTH_RATE_LIMIT_PER_HOUR > 0,
            "secret_rotation_period": self.OAUTH_SECRET_ROTATION_DAYS,
            "client_id_formats_valid": self._validate_client_id_formats(),
        }

        return validation_results

    def _is_secret_key_secure(self) -> bool:
        """Check if SECRET_KEY meets security requirements"""
        if self.ENVIRONMENT != "production":
            return True

        return (
            len(self.SECRET_KEY) >= self.JWT_SECRET_MIN_LENGTH
            and "development-secret-key" not in self.SECRET_KEY.lower()
            and self.calculate_secret_entropy(self.SECRET_KEY) >= self.JWT_SECRET_ENTROPY_THRESHOLD
        )

    def _validate_client_id_formats(self) -> bool:
        """Validate OAuth client ID formats"""
        google_valid = not self.GOOGLE_CLIENT_ID or re.match(
            self.GOOGLE_CLIENT_ID_PATTERN, self.GOOGLE_CLIENT_ID
        )
        microsoft_valid = not self.MICROSOFT_CLIENT_ID or re.match(
            self.MICROSOFT_CLIENT_ID_PATTERN, self.MICROSOFT_CLIENT_ID.lower()
        )
        return google_valid and microsoft_valid

    def get_security_headers(self) -> Dict[str, str]:
        """Get security headers for HTTP responses"""
        headers = {}

        if self.SECURITY_HEADERS_ENABLED:
            headers.update(
                {
                    "X-Content-Type-Options": "nosniff",
                    "X-Frame-Options": "DENY",
                    "X-XSS-Protection": "1; mode=block",
                    "Referrer-Policy": "strict-origin-when-cross-origin",
                    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
                    "Content-Security-Policy": self._build_csp_header(),
                }
            )

            if self.REQUIRE_HTTPS:
                hsts_value = f"max-age={self.HSTS_MAX_AGE}"
                if self.HSTS_INCLUDE_SUBDOMAINS:
                    hsts_value += "; includeSubDomains"
                if self.HSTS_PRELOAD:
                    hsts_value += "; preload"
                headers["Strict-Transport-Security"] = hsts_value

        return headers

    def _build_csp_header(self) -> str:
        """Build Content Security Policy header"""
        csp_directives = [
            f"default-src {self.CSP_DEFAULT_SRC}",
            f"script-src {self.CSP_SCRIPT_SRC}",
            f"style-src {self.CSP_STYLE_SRC}",
            f"img-src {self.CSP_IMG_SRC}",
            f"font-src {self.CSP_FONT_SRC}",
            f"connect-src {self.CSP_CONNECT_SRC}",
            f"frame-ancestors {self.CSP_FRAME_ANCESTORS}",
            "base-uri 'self'",
            "form-action 'self'",
            "upgrade-insecure-requests" if self.REQUIRE_HTTPS else "",
        ]
        return "; ".join(filter(None, csp_directives))

    def check_secret_expiry(self) -> Dict[str, Any]:
        """Check if OAuth secrets need rotation (placeholder for future implementation)"""
        # This would typically check against a database of secret creation dates
        return {
            "google_secret_expires_soon": False,  # Implement actual logic
            "microsoft_secret_expires_soon": False,  # Implement actual logic
            "jwt_secret_expires_soon": False,  # Implement actual logic
            "rotation_recommended_in_days": self.OAUTH_SECRET_ROTATION_DAYS,
        }

    def get_oauth_security_config(self) -> Dict[str, Any]:
        """Get OAuth-specific security configuration for monitoring"""
        return {
            "callback_timeout": self.OAUTH_CALLBACK_TIMEOUT_SECONDS,
            "max_retries": self.OAUTH_MAX_RETRIES,
            "rate_limit_per_hour": self.OAUTH_RATE_LIMIT_PER_HOUR,
            "secret_rotation_days": self.OAUTH_SECRET_ROTATION_DAYS,
            "expiry_warning_days": self.OAUTH_SECRET_EXPIRY_WARNING_DAYS,
            "client_id_validation_enabled": True,
            "encryption_enabled": bool(self.OAUTH_SECRETS_ENCRYPTION_KEY),
        }

    def get_tls_security_config(self) -> Dict[str, Any]:
        """Get TLS-specific security configuration"""
        return {
            "security_level": self.TLS_SECURITY_LEVEL,
            "certificate_path": self.TLS_CERTIFICATE_PATH,
            "private_key_path": self.TLS_PRIVATE_KEY_PATH,
            "certificate_chain_path": self.TLS_CERTIFICATE_CHAIN_PATH,
            "ocsp_stapling_enabled": self.TLS_ENABLE_OCSP_STAPLING,
            "validation_timeout": self.TLS_CERTIFICATE_VALIDATION_TIMEOUT,
            "pinned_certificates_count": len(self.TLS_PINNED_CERTIFICATES),
            "https_required": self.REQUIRE_HTTPS,
            "hsts_enabled": self.SECURITY_HEADERS_ENABLED,
            "hsts_max_age": self.HSTS_MAX_AGE,
        }

    def get_oauth_redirect_uri(self, provider: str) -> str:
        """Get the appropriate OAuth redirect URI based on environment"""
        if self.ENVIRONMENT == "production":
            if not self.PRODUCTION_DOMAIN:
                raise ValueError(
                    "PRODUCTION_DOMAIN must be set for production OAuth callbacks. "
                    "Example: https://yourdomain.com"
                )
            base_url = self.PRODUCTION_DOMAIN
        else:
            # Development/staging: use localhost with backend port
            base_url = "http://localhost:8000"

        if provider.lower() == "google":
            return f"{base_url}/auth/google/callback"
        elif provider.lower() == "microsoft":
            return f"{base_url}/auth/microsoft/callback"
        else:
            raise ValueError(f"Unsupported OAuth provider: {provider}")

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Allow extra fields in .env file

        # Security: Validate environment on startup
        validate_assignment = True

        # Custom JSON encoders for sensitive data
        json_encoders = {
            # Redact sensitive fields in JSON serialization
            str: lambda v: (
                "***REDACTED***"
                if any(keyword in str(v).lower() for keyword in ["secret", "password", "token"])
                and len(str(v)) > 10
                else v
            )
        }


settings = Settings()
