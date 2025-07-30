"""
FastAPI Backend for AI-Doc-Editor
T-02: OAuth 2.0 + JWT Roles implementation
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.routers import auth, health, config, credentials

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-Doc-Editor Backend API",
    version="0.1.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(config.router, prefix="/api", tags=["config"])
app.include_router(credentials.router, prefix="/api", tags=["credentials"])


@app.get("/")
async def root():
    return JSONResponse(
        {
            "message": "AI-Doc-Editor API",
            "version": "0.1.0",
            "status": "running",
            "docs": "/docs" if settings.DEBUG else "disabled in production",
        }
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
