"""
Configuration settings for FastAPI backend
T-02: OAuth 2.0 + JWT settings
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App settings
    APP_NAME: str = "AI Doc Editor API"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./app.db"

    # JWT settings
    SECRET_KEY: str = "development-secret-key-change-in-production-T02-2025"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # OAuth providers (Defaults para desarrollo, configuración real desde Admin UI)
    GOOGLE_CLIENT_ID: str = "demo-google-client-id"
    GOOGLE_CLIENT_SECRET: str = "demo-google-client-secret"
    MICROSOFT_CLIENT_ID: str = "demo-microsoft-client-id"
    MICROSOFT_CLIENT_SECRET: str = "demo-microsoft-client-secret"

    # CORS
    FRONTEND_URL: str = "http://localhost:5173"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
