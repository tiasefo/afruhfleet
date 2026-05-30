from __future__ import annotations
from app.core.config import settings

from fastapi import HTTPException, status


class AppError(HTTPException):
    def __init__(self, code: str, detail: str, status_code: int = 400):
        super().__init__(status_code=status_code, detail={"code": code, "message": detail})


class NotFoundError(AppError):
    def __init__(self, entity: str, identifier: str):
        super().__init__(
            code="NOT_FOUND",
            detail=f"{entity} '{identifier}' not found",
            status_code=status.HTTP_404_NOT_FOUND,
        )


class ConflictError(AppError):
    def __init__(self, detail: str):
        super().__init__(code="CONFLICT", detail=detail, status_code=status.HTTP_409_CONFLICT)


class ForbiddenError(AppError):
    def __init__(self, detail: str = "You do not have permission to perform this action"):
        super().__init__(code="FORBIDDEN", detail=detail, status_code=status.HTTP_403_FORBIDDEN)


class BadRequestError(AppError):
    def __init__(self, detail: str):
        super().__init__(code="BAD_REQUEST", detail=detail, status_code=status.HTTP_400_BAD_REQUEST)


class PaymentRequiredError(AppError):
    def __init__(self, detail: str):
        super().__init__(code="PAYMENT_REQUIRED", detail=detail, status_code=status.HTTP_402_PAYMENT_REQUIRED)


class GatewayError(AppError):
    def __init__(self, detail: str):
        super().__init__(code="GATEWAY_ERROR", detail=detail, status_code=status.HTTP_502_BAD_GATEWAY)
