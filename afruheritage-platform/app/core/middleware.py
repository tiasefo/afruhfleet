from __future__ import annotations

import time
import logging

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from app.core.logging_config import generate_request_id, request_id_ctx

logger = logging.getLogger("afruheritage.http")


class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        rid = request.headers.get("X-Request-ID") or generate_request_id()
        token = request_id_ctx.set(rid)
        start = time.perf_counter()
        try:
            response = await call_next(request)
            elapsed = (time.perf_counter() - start) * 1000
            response.headers["X-Request-ID"] = rid
            logger.info(
                "%s %s %d %.1fms",
                request.method,
                request.url.path,
                response.status_code,
                elapsed,
            )
            return response
        except Exception:
            elapsed = (time.perf_counter() - start) * 1000
            logger.exception(
                "%s %s 500 %.1fms (unhandled)",
                request.method,
                request.url.path,
                elapsed,
            )
            raise
        finally:
            request_id_ctx.reset(token)
