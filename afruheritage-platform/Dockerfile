# Multi-stage build for FastAPI backend
FROM python:3.12-slim AS base

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
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# Production stage
FROM python-deps AS production
WORKDIR /app

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy application code
COPY --chown=appuser:appuser . .

# Set permissions (simple, no find commands)
RUN chown -R appuser:appuser /app \
    && chmod 755 /app \
    && mkdir -p /home/appuser/.ssh \
    && chown -R appuser:appuser /home/appuser \
    && chmod 700 /home/appuser/.ssh

# Switch to non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000

# Start the application with Gunicorn for production
CMD ["gunicorn", "app.main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000", "--timeout", "120"]
