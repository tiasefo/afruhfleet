from __future__ import annotations
from app.core.config import settings

import time
from typing import Callable

from fastapi import Request, Response
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.structured_logging import security_logger, tenant_id, user_id

# Create limiter instance with Redis storage for distributed rate limiting
limiter = Limiter(key_func=get_remote_address, storage_uri=getattr(settings, 'redis_url', 'memory://'))

# Custom rate limit exceeded handler
async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> Response:
    """Custom handler for rate limit exceeded"""
    # Log rate limit violation
    security_logger.log_rate_limit_exceeded(
        ip_address=get_remote_address(request),
        endpoint=f"{request.method} {request.url.path}",
        limit=str(exc.detail),
        user_id=user_id.get(),
        tenant_id=tenant_id.get(),
    )

    # exc.detail from slowapi is a plain string (e.g. "2 per 1 hour"), not a dict.
    # Accessing it with a string key raises TypeError which would bubble up as HTTP 500.
    # Build headers safely without assuming any particular shape.
    headers: dict[str, str] = {}
    if isinstance(exc.detail, dict) and "retry-after" in exc.detail:
        headers["Retry-After"] = str(exc.detail["retry-after"])

    return Response(
        content='{"error": "Rate limit exceeded", "message": "Too many requests, please try again later"}',
        status_code=429,
        headers=headers,
        media_type="application/json"
    )

# Rate limit configurations
RATE_LIMITS = {
    # Public endpoints (no auth)
    "public": {
        "login": "5/minute",      # Login attempts
        "register": "3/hour",     # Tenant registration
        "track": "100/minute",    # Public tracking
        "vendor_register": "2/hour",  # Vendor registration
        "support_create": "10/hour",  # Public support tickets
    },
    # Authenticated endpoints
    "auth": {
        "default": "1000/minute",  # General authenticated requests
        "shipment": "200/minute",  # Shipment operations
        "billing": "50/minute",    # Billing operations
        "ai_chat": "60/minute",    # AI chat requests
        "upload": "10/minute",     # File uploads
    },
    # Admin endpoints (superuser)
    "admin": {
        "default": "2000/minute",  # Admin operations
        "provision": "10/minute",  # Tenant provisioning
        "bulk": "5/minute",       # Bulk operations
    }
}

class TenantAwareLimiter:
    """Rate limiter that considers tenant isolation"""
    
    @staticmethod
    def get_key(request: Request) -> str:
        """Generate rate limit key considering tenant and user"""
        # Try to get tenant from path first
        if "tenant_id" in request.path_params:
            tenant_id = request.path_params["tenant_id"]
        else:
            # Try to get from query params
            tenant_id = request.query_params.get("tenant_id")
        
        # Get user ID if authenticated
        user_id = getattr(request.state, "user_id", None)
        
        # Build key: ip:tenant:user or just ip for public
        key_parts = [get_remote_address(request)]
        if tenant_id:
            key_parts.append(f"tenant:{tenant_id}")
        if user_id:
            key_parts.append(f"user:{user_id}")
        
        return ":".join(key_parts)

# Create tenant-aware limiter
tenant_limiter = Limiter(key_func=TenantAwareLimiter.get_key, storage_uri=getattr(settings, 'redis_url', 'memory://'))

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Custom middleware for rate limiting with different rules per endpoint"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Add rate limit info to request state for handlers
        request.state.rate_limit_info = self._get_rate_limit_info(request)
        
        return await call_next(request)
    
    def _get_rate_limit_info(self, request: Request) -> dict:
        """Determine rate limit category based on endpoint"""
        path = request.url.path
        method = request.method
        
        # Public endpoints (no auth required)
        if "/auth/login" in path:
            return {"category": "public", "rule": "login"}
        elif "/tenants" in path and method == "POST":
            return {"category": "public", "rule": "register"}
        elif "/shipments/public/track" in path:
            return {"category": "public", "rule": "track"}
        elif "/vendors/register" in path:
            return {"category": "public", "rule": "vendor_register"}
        elif "/support/tickets" in path and method == "POST":
            return {"category": "public", "rule": "support_create"}
        
        # Check if user is authenticated
        is_authenticated = hasattr(request.state, "current_user")
        is_superuser = getattr(request.state, "is_superuser", False)
        
        if is_superuser:
            # Admin endpoints
            if "/tenants" in path and "/launch" in path:
                return {"category": "admin", "rule": "provision"}
            elif "/import" in path or "/bulk" in path:
                return {"category": "admin", "rule": "bulk"}
            else:
                return {"category": "admin", "rule": "default"}
        
        elif is_authenticated:
            # Authenticated endpoints
            if "/shipments" in path and "/import" in path:
                return {"category": "auth", "rule": "upload"}
            elif "/shipments" in path:
                return {"category": "auth", "rule": "shipment"}
            elif "/billing" in path:
                return {"category": "auth", "rule": "billing"}
            elif "/ai/chat" in path:
                return {"category": "auth", "rule": "ai_chat"}
            else:
                return {"category": "auth", "rule": "default"}
        
        # Default to public for unauthenticated
        return {"category": "public", "rule": "default"}

# Decorator for easy rate limiting
def rate_limit(category: str = "auth", rule: str = "default"):
    """Rate limit decorator"""
    def decorator(func):
        # Get the actual rate limit string
        rate_string = RATE_LIMITS.get(category, {}).get(rule, "1000/minute")
        
        # Apply slowapi decorator
        return limiter.limit(rate_string)(func)
    
    return decorator

# Tenant-scoped rate limiting
def tenant_rate_limit(category: str = "auth", rule: str = "default"):
    """Rate limit decorator that considers tenant isolation"""
    def decorator(func):
        rate_string = RATE_LIMITS.get(category, {}).get(rule, "1000/minute")
        return tenant_limiter.limit(rate_string)(func)
    
    return decorator
