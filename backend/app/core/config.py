"""
Configuration settings for FastAPI backend
T-02: OAuth 2.0 + JWT settings
"""

from pydantic_settings import BaseSettings


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
    SECRET_KEY: str = "development-secret-key-change-in-production-T02-2025"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    JWT_ISSUER: str = "ai-doc-editor"
    JWT_AUDIENCE: str = "ai-doc-editor-api"

    # OAuth providers - Production ready configuration
    # Required for OAuth authentication - set via environment variables
    GOOGLE_CLIENT_ID: str = ""  # Set via GOOGLE_CLIENT_ID env var
    GOOGLE_CLIENT_SECRET: str = ""  # Set via GOOGLE_CLIENT_SECRET env var
    MICROSOFT_CLIENT_ID: str = ""  # Set via MICROSOFT_CLIENT_ID env var
    MICROSOFT_CLIENT_SECRET: str = ""  # Set via MICROSOFT_CLIENT_SECRET env var

    # Production domain (required for production OAuth callbacks)
    PRODUCTION_DOMAIN: str = ""  # Set via PRODUCTION_DOMAIN env var for production

    # OAuth scopes
    GOOGLE_SCOPES: list = ["openid", "email", "profile"]
    MICROSOFT_SCOPES: list = ["openid", "email", "profile"]

    # OAuth security settings
    OAUTH_STATE_EXPIRE_MINUTES: int = 10  # State parameter expiration
    OAUTH_NONCE_LENGTH: int = 32  # Nonce length for security

    # CORS Security - Restrictive by default
    FRONTEND_URL: str = "http://localhost:5173"
    ALLOWED_ORIGINS: list = ["http://localhost:5173", "http://127.0.0.1:5173"]
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: list = ["GET", "POST", "PUT", "DELETE", "PATCH"]
    CORS_ALLOW_HEADERS: list = [
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
    ]
    CORS_MAX_AGE: int = 600  # 10 minutes

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

    def validate_oauth_config(self) -> dict:
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

        return validation_results

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


settings = Settings()
