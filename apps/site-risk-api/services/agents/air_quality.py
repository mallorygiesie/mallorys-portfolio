"""Air Quality Agent.

Tool: EPA AirNow real-time AQI observations within 25 miles (free API key required).

Falls back gracefully if the key is not set or the service is unavailable.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from config import settings
from models.assessment import RiskDimension, RiskLevel
from services import azure_openai

_AIRNOW_URL = "https://www.airnowapi.org/aq/observation/latLong/current/"

SYSTEM_PROMPT = """\
You are an air quality specialist with expertise in EPA AQI standards, particulate matter,
ozone health effects, and wildfire smoke impacts.

AQI interpretation:
- 0–50 (Good): No health concern
- 51–100 (Moderate): Unusually sensitive people should consider limiting prolonged outdoor exertion
- 101–150 (Unhealthy for Sensitive Groups): Children, elderly, people with respiratory/heart conditions affected
- 151–200 (Unhealthy): Everyone may experience health effects; sensitive groups severely affected
- 201–300 (Very Unhealthy): Health alert — everyone should avoid prolonged outdoor exertion
- 301+ (Hazardous): Health emergency; stay indoors with windows closed

Key rules:
- Multiple pollutants elevated simultaneously = use the worst as the primary score
- PM2.5 above 55 μg/m³ (AQI 151+) from wildfire smoke = significant inhalation risk
- Ozone peaks in afternoon; PM2.5 from smoke can peak anytime
- Trend matters: rapidly rising AQI is more dangerous than stable elevated AQI
- If no data: note that and assess structural risk from regional context

Return ONLY valid JSON:
{
  "score": <int 1-5>,
  "level": <"Low"|"Moderate"|"High"|"Very High"|"Extreme">,
  "headline": <single sentence with current AQI value if available>,
  "details": [<3-5 specific bullet points>],
  "sources": ["EPA AirNow"]
}
"""


@retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=1, max=4))
async def _fetch_aqi(lat: float, lng: float) -> list[dict]:
    if not settings.airnow_api_key:
        return []
    params = {
        "format": "application/json",
        "latitude": str(lat),
        "longitude": str(lng),
        "distance": "25",
        "API_KEY": settings.airnow_api_key,
    }
    async with httpx.AsyncClient(timeout=12.0) as client:
        resp = await client.get(_AIRNOW_URL, params=params)
        resp.raise_for_status()
    return resp.json()


async def run(lat: float, lng: float) -> RiskDimension:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    observations: list[dict] = []
    fetch_error = None

    if not settings.airnow_api_key:
        return RiskDimension(
            dimension="air_quality",
            score=1,
            level=RiskLevel.LOW,
            headline="Air quality data requires an EPA AirNow API key",
            details=[
                "Register free at airnowapi.org and add AIRNOW_API_KEY to your .env to enable real-time AQI data.",
            ],
            sources=[],
            data_as_of=now,
            agent_skipped=True,
            skip_reason="AIRNOW_API_KEY not configured",
        )

    try:
        observations = await _fetch_aqi(lat, lng)
    except Exception as e:
        fetch_error = str(e)

    if fetch_error:
        return RiskDimension(
            dimension="air_quality",
            score=1,
            level=RiskLevel.LOW,
            headline="Air quality data temporarily unavailable",
            details=["Could not reach EPA AirNow at this time. Check airnow.gov directly."],
            sources=[],
            data_as_of=now,
            agent_skipped=True,
            skip_reason=fetch_error,
        )

    if not observations:
        obs_summary = "No AQI monitoring stations found within 25 miles of this location."
    else:
        obs_summary = f"{len(observations)} pollutant observation(s) retrieved:\n"
        for obs in observations:
            obs_summary += (
                f"  - {obs.get('ParameterName', '?')}: AQI {obs.get('AQI', '?')} "
                f"({obs.get('Category', {}).get('Name', '?')}) "
                f"— {obs.get('ReportingArea', '?')}\n"
            )

    user_msg = (
        f"Location: {lat:.4f}N, {lng:.4f}W\n\n"
        f"EPA AirNow current observations:\n{obs_summary}"
    )

    raw = await azure_openai.chat(SYSTEM_PROMPT, user_msg, max_tokens=500)

    try:
        parsed = json.loads(raw.strip().removeprefix("```json").removesuffix("```").strip())
        return RiskDimension(
            dimension="air_quality",
            score=int(parsed["score"]),
            level=RiskLevel(parsed["level"]),
            headline=parsed["headline"],
            details=parsed["details"],
            sources=parsed.get("sources", ["EPA AirNow"]),
            data_as_of=now,
        )
    except Exception:
        return RiskDimension(
            dimension="air_quality",
            score=2,
            level=RiskLevel.LOW,
            headline="Air quality data retrieved",
            details=[obs_summary.strip()],
            sources=["EPA AirNow"],
            data_as_of=now,
        )
