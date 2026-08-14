"""
Lightweight in-memory rate limiter for the public chat demo.

Enforces a per-IP daily cap and a global daily ceiling (UTC days). State is
in-memory and resets when the UTC day rolls over, which bounds memory to a
single day's worth of IPs. This is intentionally simple: it is the first line
of defense, backed by the deployment's TPM quota and the budget auto-shutoff
(see HARDENING_SPEC.md). For multi-instance scale-out, move this to a shared
store (e.g. Azure Table Storage / Redis).
"""
from __future__ import annotations

import datetime as dt

from fastapi import HTTPException, Request

from config import settings

# Single-day rolling state.
_state: dict = {"day": "", "ip": {}, "global": 0}


def _today() -> str:
    return dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%d")


def _client_ip(request: Request) -> str:
    # App Service sits behind a proxy, so the real client IP is in X-Forwarded-For.
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _reset_if_new_day() -> None:
    today = _today()
    if _state["day"] != today:
        _state["day"] = today
        _state["ip"] = {}
        _state["global"] = 0


def check_and_increment(request: Request) -> int:
    """Raise 429 if a cap is exceeded; otherwise count the request.

    Returns the caller's remaining per-IP quota for the day.
    """
    _reset_if_new_day()

    if _state["global"] >= settings.chat_limit_global_per_day:
        raise HTTPException(status_code=429, detail={"error": "demo_limit", "scope": "global"})

    ip = _client_ip(request)
    used = _state["ip"].get(ip, 0)
    if used >= settings.chat_limit_per_ip_per_day:
        raise HTTPException(status_code=429, detail={"error": "demo_limit", "scope": "ip"})

    _state["ip"][ip] = used + 1
    _state["global"] += 1
    return settings.chat_limit_per_ip_per_day - _state["ip"][ip]
