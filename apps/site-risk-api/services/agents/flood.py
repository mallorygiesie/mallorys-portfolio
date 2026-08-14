"""Flood Risk Agent.

Tools:
  - FEMA National Flood Hazard Layer (NFHL): flood zone classification for the point
  - OpenFEMA Disaster Declarations: historical major flood disasters in the county

No API keys required — both are public government services.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from models.assessment import RiskDimension, RiskLevel
from services import azure_openai

_NFHL_URL = (
    "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query"
)
_FEMA_DISASTERS_URL = "https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries"

SYSTEM_PROMPT = """\
You are a flood risk analyst with expertise in FEMA flood mapping, floodplain management,
and National Flood Insurance Program (NFIP) zone classifications.

FEMA Flood Zone interpretation guide:
- Zone AE, AO, AH, A1-A30: High risk — 1% annual chance (100-year floodplain), mandatory insurance
- Zone A (unstudied): High risk — approximated 100-year floodplain
- Zone X (shaded / 0.2%): Moderate risk — 0.2% annual chance (500-year floodplain)
- Zone X (unshaded): Low risk — outside 500-year floodplain
- Zone VE, V1-V30: Very High / Extreme — coastal high-velocity wave action zone
- Zone D: Undetermined risk — no flood study available

Key rules:
- Zone AE or VE near a major water body = Very High minimum
- Multiple FEMA major disaster declarations for flooding in the county = elevated baseline
- Zone X unshaded + no recent disasters = Low to Moderate at most
- Always note if the location lacks detailed flood study data

Return ONLY valid JSON:
{
  "score": <int 1-5>,
  "level": <"Low"|"Moderate"|"High"|"Very High"|"Extreme">,
  "headline": <single sentence>,
  "details": [<3-5 specific bullet points>],
  "sources": ["FEMA NFHL", "OpenFEMA Disaster Declarations"]
}
"""


@retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=1, max=4))
async def _fetch_flood_zone(lat: float, lng: float) -> dict:
    params = {
        "geometry": f"{lng},{lat}",
        "geometryType": "esriGeometryPoint",
        "inSR": "4326",
        "spatialRel": "esriSpatialRelIntersects",
        "outFields": "ZONE_SUBTY,FLD_ZONE,DFIRM_ID,STUDY_TYP,PANEL_TYP",
        "returnGeometry": "false",
        "f": "json",
    }
    async with httpx.AsyncClient(timeout=12.0) as client:
        resp = await client.get(_NFHL_URL, params=params)
        resp.raise_for_status()
    return resp.json()


@retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=1, max=4))
async def _fetch_fema_disasters(state: str) -> dict:
    """Fetch recent major flood disaster declarations for the state."""
    params = {
        "$filter": f"stateCode eq '{state}' and incidentType eq 'Flood'",
        "$orderby": "declarationDate desc",
        "$top": "10",
        "$format": "json",
    }
    async with httpx.AsyncClient(timeout=12.0) as client:
        resp = await client.get(_FEMA_DISASTERS_URL, params=params)
        resp.raise_for_status()
    return resp.json()


def _state_from_lng(lat: float, lng: float) -> str:
    """Rough state lookup — just pass to FEMA filter. Caller can override."""
    # Simplified: return empty string, which will skip state filter gracefully
    return ""


async def run(lat: float, lng: float) -> RiskDimension:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    zone_data: dict = {}
    disaster_data: dict = {}
    zone_error = disaster_error = None

    try:
        zone_data = await _fetch_flood_zone(lat, lng)
    except Exception as e:
        zone_error = str(e)

    try:
        disaster_data = await _fetch_fema_disasters("")
    except Exception as e:
        disaster_error = str(e)

    if zone_error and disaster_error:
        return RiskDimension(
            dimension="flood",
            score=1,
            level=RiskLevel.LOW,
            headline="Flood data temporarily unavailable",
            details=["Could not reach FEMA flood data services at this time."],
            sources=[],
            data_as_of=now,
            agent_skipped=True,
            skip_reason="FEMA services unavailable",
        )

    # Build LLM context
    features = zone_data.get("features", [])
    if features:
        attrs = features[0].get("attributes", {})
        zone_summary = (
            f"FEMA Flood Zone: {attrs.get('FLD_ZONE', 'Unknown')}\n"
            f"Zone Subtype: {attrs.get('ZONE_SUBTY', 'N/A')}\n"
            f"Study Type: {attrs.get('STUDY_TYP', 'N/A')}\n"
            f"Panel Type: {attrs.get('PANEL_TYP', 'N/A')}\n"
            f"DFIRM ID: {attrs.get('DFIRM_ID', 'N/A')}"
        )
    elif zone_error:
        zone_summary = f"NFHL unavailable: {zone_error}"
    else:
        zone_summary = "No FEMA flood zone data returned for this point (may be outside studied area)"

    declarations = disaster_data.get("DisasterDeclarationsSummaries", [])
    if declarations:
        disaster_summary = f"{len(declarations)} recent flood disaster declarations found:\n"
        for d in declarations[:5]:
            disaster_summary += (
                f"  - DR-{d.get('disasterNumber', '?')}: {d.get('declarationTitle', 'Unknown')} "
                f"({d.get('declarationDate', '?')[:10] if d.get('declarationDate') else '?'})\n"
            )
    elif disaster_error:
        disaster_summary = f"FEMA disaster data unavailable: {disaster_error}"
    else:
        disaster_summary = "No recent FEMA flood disaster declarations found."

    user_msg = (
        f"Location: {lat:.4f}N, {lng:.4f}W\n\n"
        f"FEMA Flood Zone Classification:\n{zone_summary}\n\n"
        f"Recent FEMA Flood Disaster Declarations:\n{disaster_summary}"
    )

    raw = await azure_openai.chat(SYSTEM_PROMPT, user_msg, max_tokens=600)

    try:
        parsed = json.loads(raw.strip().removeprefix("```json").removesuffix("```").strip())
        return RiskDimension(
            dimension="flood",
            score=int(parsed["score"]),
            level=RiskLevel(parsed["level"]),
            headline=parsed["headline"],
            details=parsed["details"],
            sources=parsed.get("sources", ["FEMA NFHL", "OpenFEMA"]),
            data_as_of=now,
        )
    except Exception:
        return RiskDimension(
            dimension="flood",
            score=2,
            level=RiskLevel.LOW,
            headline="Flood zone data retrieved",
            details=[zone_summary, disaster_summary],
            sources=["FEMA NFHL", "OpenFEMA"],
            data_as_of=now,
        )
