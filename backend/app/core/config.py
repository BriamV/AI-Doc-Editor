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

    # OAuth providers (Defaults para desarrollo, configuración real desde Admin UI)
    GOOGLE_CLIENT_ID: str = "demo-google-client-id"
    GOOGLE_CLIENT_SECRET: str = "demo-google-client-secret"
    MICROSOFT_CLIENT_ID: str = "demo-microsoft-client-id"
    MICROSOFT_CLIENT_SECRET: str = "demo-microsoft-client-secret"

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

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Allow extra fields in .env file


settings = Settings()
