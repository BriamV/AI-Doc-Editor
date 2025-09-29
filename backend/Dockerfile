# Multi-stage Dockerfile for FastAPI Backend - Production Ready & Security Hardened
# Implements defense-in-depth security controls and zero-vulnerability standards

# ====================================
# Stage 1: Build Stage (Dependencies)
# ====================================
FROM python:3.11-slim-bullseye AS builder

# Security: Update system packages and install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment for dependency isolation
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy and install production dependencies only
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ====================================
# Stage 2: Runtime Stage (Production)
# ====================================
FROM python:3.11-slim-bullseye AS runtime

# Security: Create non-root user and group
RUN groupadd --gid 1001 appgroup && \
    useradd --uid 1001 --gid 1001 --create-home --shell /bin/bash appuser

# Security: Update base system and install runtime dependencies only
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /tmp/* \
    && rm -rf /var/tmp/*

# Copy virtual environment from builder stage
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Set working directory and create necessary directories
WORKDIR /app
RUN mkdir -p /app/logs /app/data && \
    chown -R appuser:appgroup /app

# Copy application code
COPY --chown=appuser:appgroup app/ /app/app/
COPY --chown=appuser:appgroup alembic.ini /app/
COPY --chown=appuser:appgroup migrations/ /app/migrations/

# Security: Switch to non-root user
USER appuser

# Environment variables for production
ENV PYTHONPATH=/app \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    ENVIRONMENT=production \
    PORT=8000

# Expose port (non-privileged port)
EXPOSE 8000

# Health check using the existing /health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Production command (non-reload mode for security and performance)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]