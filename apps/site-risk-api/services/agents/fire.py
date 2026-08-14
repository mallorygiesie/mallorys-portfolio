"""Wildfire Risk Agent.

Tools:
  - NASA FIRMS VIIRS NRT: active fire detections within 100 km, updated ~3 hrs
  - NIFC Active Fire Perimeters: official containment perimeters (ArcGIS, no key)
  - Open-Meteo: current wind speed + direction (no key)

Computes a fire spread threat vector: identifies the most threatening upwind active fire
pixel and estimates how long it would take to reach the site at current wind speed using
a simplified spread model.
"""
from __future__ import annotations

import asyncio
import csv
import io
import json
import math
from datetime import datetime, timezone
from typing import Optional

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from config import settings
from models.assessment import RiskDimension, RiskLevel
from services import azure_openai

_OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

_FIRMS_URL = "https://firms.modaps.eosdis.nasa.gov/api/area/csv/{key}/VIIRS_SNPP_NRT/{bbox}/1"
_NIFC_URL = (
    "https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services"
    "/Active_Fires/FeatureServer/0/query"
)

SYSTEM_PROMPT = """\
You are a wildfire risk analyst with expertise in fire behavior, weather-driven fire spread,
and public safety assessment. You receive raw satellite fire detection data and official
fire perimeter data for a location, then produce a structured risk assessment.

Key interpretation rules:
- Fire pixels within 10 km = imminent/extreme threat regardless of count
- Fire pixels 10–30 km + Red Flag conditions = Very High
- Active named fires within 50 km = High minimum
- FRP (Fire Radiative Power) > 500 MW = intense, rapidly spreading fire
- Consider time of detections: daytime detections with high FRP are more dangerous
- Absence of detections does NOT mean no risk — assess structural risk from vegetation/climate

Return ONLY valid JSON matching this schema:
{
  "score": <int 1-5>,
  "level": <"Low"|"Moderate"|"High"|"Very High"|"Extreme">,
  "headline": <single sentence summary>,
  "details": [<3-5 specific bullet points with data citations>],
  "sources": ["NASA FIRMS VIIRS NRT", "NIFC Active Fire Perimeters"]
}
"""


def _bbox(lat: float, lng: float, km: float = 100) -> str:
    """Approximate bounding box string for FIRMS (west,south,east,north)."""
    deg = km / 111.0
    return f"{lng - deg:.4f},{lat - deg:.4f},{lng + deg:.4f},{lat + deg:.4f}"


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    return r * 2 * math.asin(math.sqrt(a))


@retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=1, max=4))
async def _fetch_firms(lat: float, lng: float) -> list[dict]:
    if not settings.firms_api_key:
        return []
    url = _FIRMS_URL.format(key=settings.firms_api_key, bbox=_bbox(lat, lng))
    async with httpx.AsyncClient(timeout=12.0) as client:
        resp = await client.get(url)
        resp.raise_for_status()
    reader = csv.DictReader(io.StringIO(resp.text))
    rows = list(reader)
    # Annotate each row with distance from the target
    for row in rows:
        try:
            row["_dist_km"] = _haversine_km(lat, lng, float(row["latitude"]), float(row["longitude"]))
        except Exception:
            row["_dist_km"] = 999
    return sorted(rows, key=lambda r: r["_dist_km"])


@retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=1, max=4))
async def _fetch_nifc(lat: float, lng: float) -> dict:
    """Fetch active fire perimeters within ~100 miles."""
    params = {
        "where": "1=1",
        "geometry": json.dumps({"x": lng, "y": lat, "spatialReference": {"wkid": 4326}}),
        "geometryType": "esriGeometryPoint",
        "inSR": "4326",
        "spatialRel": "esriSpatialRelWithin",
        "distance": "100",
        "units": "esriSRUnit_StatuteMile",
        "outFields": "IncidentName,GISAcres,PercentContained,FireDiscoveryDateTime",
        "outSR": "4326",
        "f": "geojson",
    }
    async with httpx.AsyncClient(timeout=12.0) as client:
        resp = await client.get(_NIFC_URL, params=params)
        resp.raise_for_status()
    return resp.json()


@retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=1, max=4))
async def _fetch_wind(lat: float, lng: float) -> Optional[dict]:
    """Fetch current wind speed (km/h) and direction (degrees) from Open-Meteo."""
    params = {
        "latitude": f"{lat:.4f}",
        "longitude": f"{lng:.4f}",
        "current": "wind_speed_10m,wind_direction_10m,wind_gusts_10m",
        "wind_speed_unit": "kmh",
        "timezone": "auto",
        "forecast_days": "1",
    }
    async with httpx.AsyncClient(timeout=8.0) as client:
        resp = await client.get(_OPEN_METEO_URL, params=params)
        resp.raise_for_status()
    current = resp.json().get("current", {})
    speed = current.get("wind_speed_10m")
    direction = current.get("wind_direction_10m")
    gusts = current.get("wind_gusts_10m")
    if speed is None or direction is None:
        return None
    return {"speed_kmh": speed, "direction_deg": direction, "gusts_kmh": gusts}


def _bearing(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Compute initial bearing from point 1 to point 2 in degrees (0=N, 90=E)."""
    lat1r, lat2r = math.radians(lat1), math.radians(lat2)
    dlng = math.radians(lng2 - lng1)
    x = math.sin(dlng) * math.cos(lat2r)
    y = math.cos(lat1r) * math.sin(lat2r) - math.sin(lat1r) * math.cos(lat2r) * math.cos(dlng)
    return (math.degrees(math.atan2(x, y)) + 360) % 360


def _angle_diff(a: float, b: float) -> float:
    """Absolute angular difference between two bearings, wrapped to [0, 180]."""
    return min(abs(a - b) % 360, 360 - abs(a - b) % 360)


def _compute_threat_vector(
    firms_rows: list[dict],
    site_lat: float,
    site_lng: float,
    wind: Optional[dict],
) -> Optional[dict]:
    """
    Identify the most threatening upwind fire pixel and compute spread estimate.

    Wind direction (meteorological convention) = the direction the wind is coming FROM.
    A fire is 'upwind' when it lies in the direction the wind is blowing FROM —
    meaning wind is pushing it toward the site.

    Simplified spread rate: ~30% of wind speed (km/h) based on general fire behaviour
    literature for grass/shrub fuels in open terrain. Actual spread depends on slope,
    fuel moisture, and firebreak presence — this is an indicative estimate only.
    """
    if not firms_rows or not wind:
        return None

    wind_from_deg = wind["direction_deg"]  # wind is blowing FROM this direction
    wind_speed = wind["speed_kmh"]

    best: Optional[dict] = None
    best_score = -1.0

    for row in firms_rows[:50]:
        try:
            fire_lat = float(row["latitude"])
            fire_lng = float(row["longitude"])
            dist_km = float(row.get("_dist_km", 999))
            frp = float(row.get("frp", 0) or 0)
        except (ValueError, TypeError):
            continue

        if dist_km > 150:
            continue

        # Bearing FROM the fire TO the site
        bearing_fire_to_site = _bearing(fire_lat, fire_lng, site_lat, site_lng)

        # Wind is blowing FROM wind_from_deg — so it carries fire in the opposite direction
        wind_to_deg = (wind_from_deg + 180) % 360

        # Angular alignment: how well is wind pushing this fire toward the site?
        alignment = _angle_diff(bearing_fire_to_site, wind_to_deg)
        if alignment > 75:
            continue  # fire is not being pushed toward site

        # Score = intensity / distance, weighted by wind alignment
        alignment_factor = math.cos(math.radians(alignment))
        score = (frp + 1) / (dist_km + 1) * alignment_factor

        if score > best_score:
            best_score = score
            # Simplified spread: 30% of wind speed, minimum 2 km/h
            spread_rate = max(wind_speed * 0.30, 2.0)
            est_hours = dist_km / spread_rate if spread_rate > 0 else None

            best = {
                "fire_lat": fire_lat,
                "fire_lng": fire_lng,
                "distance_km": round(dist_km, 1),
                "frp_mw": round(frp, 1),
                "wind_speed_kmh": round(wind_speed, 1),
                "wind_gusts_kmh": round(wind["gusts_kmh"], 1) if wind.get("gusts_kmh") else None,
                "wind_from_deg": round(wind_from_deg, 1),
                "bearing_to_site_deg": round(bearing_fire_to_site, 1),
                "alignment_deg": round(alignment, 1),
                "spread_rate_kmh": round(spread_rate, 1),
                "est_hours": round(est_hours, 1) if est_hours is not None else None,
            }

    return best


async def run(lat: float, lng: float) -> RiskDimension:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    firms_data: list[dict] = []
    nifc_data: dict = {}
    wind: Optional[dict] = None
    firms_error = nifc_error = None

    results = await asyncio.gather(
        _fetch_firms(lat, lng),
        _fetch_nifc(lat, lng),
        _fetch_wind(lat, lng),
        return_exceptions=True,
    )
    if isinstance(results[0], Exception):
        firms_error = str(results[0])
    else:
        firms_data = results[0]  # type: ignore[assignment]

    if isinstance(results[1], Exception):
        nifc_error = str(results[1])
    else:
        nifc_data = results[1]  # type: ignore[assignment]

    if not isinstance(results[2], Exception):
        wind = results[2]  # type: ignore[assignment]

    if firms_error and nifc_error:
        return RiskDimension(
            dimension="wildfire",
            score=1,
            level=RiskLevel.LOW,
            headline="Wildfire data temporarily unavailable",
            details=["Could not reach NASA FIRMS or NIFC at this time. Check local fire agency resources."],
            sources=[],
            data_as_of=now,
            agent_skipped=True,
            skip_reason="Both fire data sources unavailable",
        )

    # Compute fire spread threat vector from FIRMS pixels + live wind
    threat_vector = _compute_threat_vector(firms_data, lat, lng, wind)

    # Summarise FIRMS for LLM
    nearby = [r for r in firms_data if r.get("_dist_km", 999) <= 100]
    firms_summary = f"{len(nearby)} active fire pixel(s) detected within 100 km.\n"
    for r in nearby[:10]:
        firms_summary += (
            f"  - {r.get('_dist_km', '?'):.1f} km away | "
            f"FRP: {r.get('frp', '?')} MW | "
            f"Brightness: {r.get('bright_ti4', '?')} K | "
            f"Date: {r.get('acq_date', '?')} {r.get('acq_time', '')}\n"
        )
    if firms_error:
        firms_summary = f"FIRMS data unavailable: {firms_error}\n"

    nifc_features = nifc_data.get("features", [])
    nifc_summary = f"{len(nifc_features)} named fire perimeter(s) within 100 miles.\n"
    for feat in nifc_features[:5]:
        props = feat.get("properties", {})
        nifc_summary += (
            f"  - {props.get('IncidentName', 'Unknown')} | "
            f"{props.get('GISAcres', '?'):.0f} acres | "
            f"{props.get('PercentContained', '?')}% contained\n"
        )
    if nifc_error:
        nifc_summary = f"NIFC data unavailable: {nifc_error}\n"

    wind_summary = ""
    if wind:
        wind_summary = (
            f"\nCurrent wind: {wind['speed_kmh']} km/h from {wind['direction_deg']}°"
            + (f", gusting to {wind['gusts_kmh']} km/h" if wind.get("gusts_kmh") else "")
        )
        if threat_vector:
            wind_summary += (
                f"\nMost threatening upwind fire: {threat_vector['distance_km']} km away, "
                f"FRP {threat_vector['frp_mw']} MW, "
                f"est. spread rate {threat_vector['spread_rate_kmh']} km/h"
                + (f" → site in ~{threat_vector['est_hours']}h" if threat_vector.get("est_hours") else "")
            )

    user_msg = (
        f"Location: {lat:.4f}N, {lng:.4f}W\n\n"
        f"NASA FIRMS (satellite fire detections, last 24h):\n{firms_summary}\n"
        f"NIFC Active Fire Perimeters:\n{nifc_summary}"
        + wind_summary
    )

    sources = ["NASA FIRMS VIIRS NRT", "NIFC Active Fire Perimeters"]
    if wind:
        sources.append("Open-Meteo (wind)")

    raw = await azure_openai.chat(SYSTEM_PROMPT, user_msg, max_tokens=600)

    try:
        parsed = json.loads(raw.strip().removeprefix("```json").removesuffix("```").strip())
        return RiskDimension(
            dimension="wildfire",
            score=int(parsed["score"]),
            level=RiskLevel(parsed["level"]),
            headline=parsed["headline"],
            details=parsed["details"],
            sources=parsed.get("sources", sources),
            geojson=nifc_data if nifc_features else None,
            threat_vector=threat_vector,
            data_as_of=now,
        )
    except Exception:
        return RiskDimension(
            dimension="wildfire",
            score=3,
            level=RiskLevel.MODERATE,
            headline="Wildfire risk assessment completed with partial data",
            details=[firms_summary.strip(), nifc_summary.strip()],
            sources=sources,
            geojson=nifc_data if nifc_features else None,
            threat_vector=threat_vector,
            data_as_of=now,
        )
