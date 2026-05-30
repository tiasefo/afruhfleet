from __future__ import annotations
from app.core.config import settings

import json
import logging
import time
import uuid
from contextvars import ContextVar
from typing import Any, Dict

import structlog
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

# Context variables for request tracing
correlation_id: ContextVar[str] = ContextVar("correlation_id", default="")
request_id: ContextVar[str] = ContextVar("request_id", default="")
tenant_id: ContextVar[str] = ContextVar("tenant_id", default="")
user_id: ContextVar[str] = ContextVar("user_id", default="")

# Configure structlog
def configure_structured_logging() -> None:
    """Configure structured logging with correlation IDs"""
    
    # Custom processor to add context variables
    def add_context_vars(logger, method_name: str, event_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Add correlation context variables to log events"""
        event_dict["correlation_id"] = correlation_id.get()
        event_dict["request_id"] = request_id.get()
        event_dict["tenant_id"] = tenant_id.get()
        event_dict["user_id"] = user_id.get()
        event_dict["service"] = "afruheritage-control-plane"
        return event_dict
    
    # Custom processor for tenant isolation
    def add_tenant_context(logger, method_name: str, event_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Add tenant context for proper isolation"""
        if tenant := tenant_id.get():
            event_dict["tenant"] = tenant
        return event_dict
    
    # Configure processors
    processors = [
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        add_context_vars,
        add_tenant_context,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]
    
    # Different formatters for different environments
    if is_development():
        processors.append(structlog.dev.ConsoleRenderer(colors=True))
    else:
        processors.append(structlog.processors.JSONRenderer())
    
    structlog.configure(
        processors=processors,
        wrapper_class=structlog.stdlib.BoundLogger,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

def is_development() -> bool:
    """Check if we're in development environment"""
    import os
    return os.getenv("APP_ENV", "production").lower() in ("development", "dev", "local")

class StructuredLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to add correlation IDs and structured context to requests"""
    
    async def dispatch(self, request: Request, call_next: Any) -> Response:
        # Generate unique IDs for this request
        request_id_val = str(uuid.uuid4())
        correlation_id_val = request.headers.get("X-Correlation-ID") or request_id_val
        
        # Set context variables
        request_id.set(request_id_val)
        correlation_id.set(correlation_id_val)
        
        # Extract tenant from path or headers
        tenant_from_path = request.path_params.get("tenant_id")
        tenant_from_header = request.headers.get("X-Tenant-ID")
        tenant_val = tenant_from_path or tenant_from_header or ""
        tenant_id.set(tenant_val)
        
        # Extract user from request state (set by auth middleware)
        user_val = getattr(request.state, "user_id", None) or ""
        user_id.set(str(user_val))
        
        # Log request start
        logger = structlog.get_logger("afruheritage.request")
        start_time = time.time()
        
        logger.info(
            "request_started",
            method=request.method,
            path=request.url.path,
            query_params=str(request.query_params),
            user_agent=request.headers.get("User-Agent", ""),
            remote_addr=request.client.host if request.client else "",
        )
        
        try:
            # Process request
            response = await call_next(request)
            
            # Calculate duration
            duration_ms = (time.time() - start_time) * 1000
            
            # Log request completion
            logger.info(
                "request_completed",
                method=request.method,
                path=request.url.path,
                status_code=response.status_code,
                duration_ms=round(duration_ms, 2),
                response_size=response.headers.get("content-length", ""),
            )
            
            # Add correlation ID to response headers
            response.headers["X-Correlation-ID"] = correlation_id_val
            response.headers["X-Request-ID"] = request_id_val
            
            return response
            
        except Exception as exc:
            # Calculate duration
            duration_ms = (time.time() - start_time) * 1000
            
            # Log request error
            logger.error(
                "request_failed",
                method=request.method,
                path=request.url.path,
                duration_ms=round(duration_ms, 2),
                error_type=type(exc).__name__,
                error_message=str(exc),
                exc_info=True,
            )
            
            # Re-raise the exception
            raise

class AuditLogger:
    """Structured logger for audit events"""
    
    def __init__(self, db_session=None):
        self.logger = structlog.get_logger("afruheritage.audit")
        self.db = db_session
    
    def log_event(
        self,
        event_type: str,
        entity_type: str,
        entity_id: str,
        actor_email: str,
        details: Dict[str, Any],
        tenant_id: str | None = None,
    ):
        """Log an audit event with full context"""
        event_data = {
            "event_type": event_type,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "actor_email": actor_email,
            "details": details,
        }
        
        if tenant_id:
            event_data["tenant_id"] = tenant_id
        
        self.logger.info("audit_event", **event_data)
        
        # Also store in database if session available
        if self.db:
            try:
                from app.models.audit import AuditEvent
                audit = AuditEvent(
                    actor_email=actor_email,
                    event_type=event_type,
                    entity_type=entity_type,
                    entity_id=entity_id,
                    details_json=json.dumps(details, default=str),
                    correlation_id=correlation_id.get(),
                    tenant_id=tenant_id,
                )
                self.db.add(audit)
                self.db.commit()
            except Exception as e:
                self.logger.error("failed_to_store_audit_event", error=str(e))

class SecurityLogger:
    """Structured logger for security events"""
    
    def __init__(self):
        self.logger = structlog.get_logger("afruheritage.security")
    
    def log_login_attempt(
        self,
        email: str,
        success: bool,
        ip_address: str,
        user_agent: str,
        failure_reason: str | None = None,
    ):
        """Log login attempts for security monitoring"""
        event_data = {
            "event_type": "login_attempt",
            "email": email,
            "success": success,
            "ip_address": ip_address,
            "user_agent": user_agent,
        }
        
        if not success and failure_reason:
            event_data["failure_reason"] = failure_reason
        
        level = "info" if success else "warning"
        getattr(self.logger, level)("security_event", **event_data)
    
    def log_rate_limit_exceeded(
        self,
        ip_address: str,
        endpoint: str,
        limit: str,
        user_id: str | None = None,
        tenant_id: str | None = None,
    ):
        """Log rate limit violations"""
        event_data = {
            "event_type": "rate_limit_exceeded",
            "ip_address": ip_address,
            "endpoint": endpoint,
            "limit": limit,
        }
        
        if user_id:
            event_data["user_id"] = user_id
        if tenant_id:
            event_data["tenant_id"] = tenant_id
        
        self.logger.warning("security_event", **event_data)
    
    def log_permission_denied(
        self,
        user_email: str,
        required_permission: str,
        resource: str,
        ip_address: str,
    ):
        """Log permission denied events"""
        self.logger.warning(
            "security_event",
            event_type="permission_denied",
            user_email=user_email,
            required_permission=required_permission,
            resource=resource,
            ip_address=ip_address,
        )

class BusinessLogger:
    """Structured logger for business events"""
    
    def __init__(self):
        self.logger = structlog.get_logger("afruheritage.business")
    
    def log_tenant_provisioning(
        self,
        tenant_id: str,
        tenant_name: str,
        status: str,
        duration_ms: float | None = None,
        error: str | None = None,
    ):
        """Log tenant provisioning events"""
        event_data = {
            "event_type": "tenant_provisioning",
            "tenant_id": tenant_id,
            "tenant_name": tenant_name,
            "status": status,
        }
        
        if duration_ms is not None:
            event_data["duration_ms"] = duration_ms
        if error:
            event_data["error"] = error
        
        level = "info" if status == "completed" else "error" if status == "failed" else "warning"
        getattr(self.logger, level)("business_event", **event_data)
    
    def log_payment_event(
        self,
        tenant_id: str,
        payment_id: str,
        amount: float,
        currency: str,
        status: str,
        provider: str,
    ):
        """Log payment events"""
        self.logger.info(
            "business_event",
            event_type="payment",
            tenant_id=tenant_id,
            payment_id=payment_id,
            amount=amount,
            currency=currency,
            status=status,
            provider=provider,
        )
    
    def log_shipment_event(
        self,
        tenant_id: str,
        shipment_id: str,
        tracking_number: str,
        event_type: str,
        status: str,
    ):
        """Log shipment lifecycle events"""
        self.logger.info(
            "business_event",
            event_type="shipment",
            tenant_id=tenant_id,
            shipment_id=shipment_id,
            tracking_number=tracking_number,
            shipment_event_type=event_type,
            status=status,
        )

# Global logger instances
audit_logger = AuditLogger()
security_logger = SecurityLogger()
business_logger = BusinessLogger()

def get_logger(name: str) -> structlog.stdlib.BoundLogger:
    """Get a structured logger with context"""
    return structlog.get_logger(name)
