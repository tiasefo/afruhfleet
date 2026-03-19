import logging
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response

from app.api.routes import auth, health, runners, tenants
from app.core.config import settings


class _CorrelationIdFilter(logging.Filter):
    """Inject a default correlation_id into every log record that lacks one."""

    def filter(self, record: logging.LogRecord) -> bool:
        if not hasattr(record, 'correlation_id'):
            record.correlation_id = '-'
        return True


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(name)s [%(correlation_id)s] %(message)s',
)
# Attach the filter to the root handler so all loggers benefit
for _handler in logging.root.handlers:
    _handler.addFilter(_CorrelationIdFilter())

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Schema is managed via Alembic migrations; do not create tables here.
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)


@app.middleware('http')
async def correlation_id_middleware(request: Request, call_next) -> Response:
    """Attach a correlation ID to every request for end-to-end traceability."""
    correlation_id = request.headers.get('X-Correlation-ID') or str(uuid.uuid4())
    request.state.correlation_id = correlation_id

    start_time = time.perf_counter()
    response: Response = await call_next(request)
    duration_ms = (time.perf_counter() - start_time) * 1000

    response.headers['X-Correlation-ID'] = correlation_id
    logger.info(
        '%s %s %s %.1fms',
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
        extra={'correlation_id': correlation_id},
    )
    return response


app.include_router(health.router, prefix=settings.api_v1_prefix)
app.include_router(auth.router, prefix=settings.api_v1_prefix)
app.include_router(runners.router, prefix=settings.api_v1_prefix)
app.include_router(tenants.router, prefix=settings.api_v1_prefix)
