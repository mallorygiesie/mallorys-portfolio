"""Weather Alerts Agent.

Tool: NOAA National Weather Service alerts API (no key required).

Fetches active weather watches, warnings, and advisories for the location.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from models.assessment import RiskDimension, RiskLevel
from services import azure_openai

_NWS_ALERTS_URL = "https://api.weather.gov/alerts/active"
_NWS_POINTS_URL = "https://api.weather.gov/points/{lat},{lng}"

_NWS_HEADERS = {
    "User-Agent": "(siterisk.mallorygiesie.com, mallorygiesie@icloud.com)",
    "Accept": "application/geo+json",
}

SYSTEM_PROMPT = """\
You are a severe weather risk analyst with expertise in NWS alert systems,
meteorological hazards, and public safety communication.

NWS alert severity hierarchy (highest to lowest):
- Warning: Imminent or ongoing hazardous conditions (take action NOW)
- Watch: Conditions favorable for hazardous weather within 12–48 hours (prepare)
- Advisory: Less serious conditions that may cause inconvenience or indirect threat
- Statement: Informational; no immediate action needed

High-significance alert types for risk scoring:
- Extreme: Tornado Warning, Flash Flood Warning + Evacuation Imminent
- Very High: Tornado Watch, Flash Flood Warning, Hurricane Warning, Fire Weather Warning
- High: Severe Thunderstorm Warning, Red Flag Warning, High Wind Warning, Flood Warning
- Moderate: Winter Storm Warning, Dense Fog Advisory, Wind Advisory
- Low: No active alerts, or only minor advisories

Key rules:
- Red Flag Warning = fire weather conditions (low humidity, high wind, dry fuel) — critical when co-occurring with fire risk
- Multiple overlapping warnings amplify risk (e.g., Red Flag + High Wind)
- No active alerts for a location does NOT mean safe — assess the forecast context
- Note expiration times: warnings expiring soon carry less weight

Return ONLY valid JSON:
{
  "score": <int 1-5>,
  "level": <"Low"|"Moderate"|"High"|"Very High"|"Extreme">,
  "headline": <single sentence — cite active alerts by name or "No active alerts">,
  "details": [<3-5 bullet points>],
  "sources": ["NOAA National Weather Service"]
}
"""


@retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=1, max=4))
async def _fetch_alerts(lat: float, lng: float) -> dict:
    params = {"point": f"{lat:.4f},{lng:.4f}"}
    async with httpx.AsyncClient(timeout=12.0, headers=_NWS_HEADERS) as client:
        resp = await client.get(_NWS_ALERTS_URL, params=params)
        resp.raise_for_status()
    return resp.json()


@retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=1, max=4))
async def _fetch_forecast_zone(lat: float, lng: float) -> dict:
    url = _NWS_POINTS_URL.format(lat=f"{lat:.4f}", lng=f"{lng:.4f}")
    async with httpx.AsyncClient(timeout=10.0, headers=_NWS_HEADERS) as client:
        resp = await client.get(url)
        resp.raise_for_status()
    return resp.json()


async def run(lat: float, lng: float) -> RiskDimension:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    alerts_data: dict = {}
    zone_data: dict = {}
    alerts_error = None

    try:
        alerts_data = await _fetch_alerts(lat, lng)
    except Exception as e:
        alerts_error = str(e)

    try:
        zone_data = await _fetch_forecast_zone(lat, lng)
    except Exception:
        pass  # Zone info is supplementary — not critical

    if alerts_error:
        return RiskDimension(
            dimension="weather",
            score=1,
            level=RiskLevel.LOW,
            headline="Weather alert data temporarily unavailable",
            details=["Could not reach NOAA NWS at this time. Check weather.gov directly."],
            sources=[],
            data_as_of=now,
            agent_skipped=True,
            skip_reason=alerts_error,
        )

    features = alerts_data.get("features", [])
    if not features:
        alerts_summary = "No active NWS watches, warnings, or advisories for this location."
    else:
        alerts_summary = f"{len(features)} active alert(s):\n"
        for feat in features[:8]:
            props = feat.get("properties", {})
            expires = props.get("expires", "")[:16].replace("T", " ") if props.get("expires") else "N/A"
            alerts_summary += (
                f"  - [{props.get('severity', '?').upper()}] {props.get('event', '?')}: "
                f"{props.get('headline', props.get('description', ''))[:120]}... "
                f"(expires {expires})\n"
            )

    # Supplement with forecast zone context
    zone_props = zone_data.get("properties", {})
    zone_context = ""
    if zone_props:
        zone_context = (
            f"\nForecast zone: {zone_props.get('relativeLocation', {}).get('properties', {}).get('city', '')} "
            f"{zone_props.get('relativeLocation', {}).get('properties', {}).get('state', '')}"
        )

    user_msg = (
        f"Location: {lat:.4f}N, {lng:.4f}W{zone_context}\n\n"
        f"Active NOAA NWS alerts:\n{alerts_summary}"
    )

    raw = await azure_openai.chat(SYSTEM_PROMPT, user_msg, max_tokens=500)

    try:
        parsed = json.loads(raw.strip().removeprefix("```json").removesuffix("```").strip())
        return RiskDimension(
            dimension="weather",
            score=int(parsed["score"]),
            level=RiskLevel(parsed["level"]),
            headline=parsed["headline"],
            details=parsed["details"],
            sources=parsed.get("sources", ["NOAA National Weather Service"]),
            data_as_of=now,
        )
    except Exception:
        return RiskDimension(
            dimension="weather",
            score=1 if not features else 3,
            level=RiskLevel.LOW if not features else RiskLevel.MODERATE,
            headline="Weather alert data retrieved",
            details=[alerts_summary.strip()],
            sources=["NOAA National Weather Service"],
            data_as_of=now,
        )
