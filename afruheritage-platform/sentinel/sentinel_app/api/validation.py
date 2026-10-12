from __future__ import annotations

import uuid

from fastapi import HTTPException


def uuid_param_or_400(value: str, name: str = "identifier") -> str:
    """Validate a path parameter as UUID, returning a controlled 400 instead of
    letting an unparseable value reach the control plane (where it became a 500)."""
    try:
        return str(uuid.UUID(str(value)))
    except (ValueError, TypeError, AttributeError):
        raise HTTPException(status_code=400, detail=f"Invalid {name}: expected a UUID")
