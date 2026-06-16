# Multi-stage build for Afruheritage Sentinel (FastAPI + Static Frontend)
FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
FROM base AS system-deps
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        openssh-client \
        curl \
        ca-certificates \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
FROM system-deps AS python-deps
WORKDIR /app

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy and install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Development stage (optional)
FROM python-deps AS development
RUN pip install --no-cache-dir pytest pytest-asyncio black flake8
COPY . .
CMD ["uvicorn", "sentinel_app.main:app", "--host", "0.0.0.0", "--port", "9200", "--reload"]

# Production stage
FROM python-deps AS production
WORKDIR /app

# Create non-root user
RUN groupadd -r sentineluser && useradd -r -g sentineluser sentineluser

# Copy application code
COPY --chown=sentineluser:sentineluser . .

# Switch to non-root user
USER sentineluser

# Health check - Fixed endpoint
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:9200/sentinel/health || exit 1

EXPOSE 9200

# Start the application with Gunicorn for production
CMD ["gunicorn", "sentinel_app.main:app", "-w", "2", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:9200"]
