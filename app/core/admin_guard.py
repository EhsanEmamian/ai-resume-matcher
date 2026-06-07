from __future__ import annotations

import hmac
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status

from app.config import settings


async def require_admin_key(
    x_admin_key: Annotated[str | None, Header()] = None,
) -> None:
    """
    FastAPI dependency to protect admin endpoints with a static API key.
    
    If ADMIN_API_KEY is empty in settings, the guard is disabled (no-op).
    If ADMIN_API_KEY is set, the X-Admin-Key header must match exactly.
    Uses constant-time comparison to prevent timing attacks.
    
    Raises:
        HTTPException: 401 if the key is missing or invalid.
    """
    # If no admin key is configured, disable the guard entirely
    if not settings.ADMIN_API_KEY:
        return

    # If admin key is configured but header is missing
    if not x_admin_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing admin key.",
        )

    # Use constant-time comparison to prevent timing attacks
    if not hmac.compare_digest(x_admin_key, settings.ADMIN_API_KEY):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing admin key.",
        )
