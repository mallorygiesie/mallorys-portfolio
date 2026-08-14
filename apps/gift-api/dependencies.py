"""Shared FastAPI dependencies."""
from __future__ import annotations

from typing import Optional

from fastapi import Header, HTTPException

from config import settings


def require_admin(x_admin_token: Optional[str] = Header(default=None)) -> None:
    """Gate expensive endpoints (/sync, /generate).

    - In development: always allowed (convenient for local work).
    - In production: requires a matching ADMIN_TOKEN header. Returns 404 (not 403)
      so the endpoints aren't advertised to probers.
    """
    if not settings.is_prod:
        return
    if not settings.admin_token or x_admin_token != settings.admin_token:
        raise HTTPException(status_code=404, detail="Not found")
