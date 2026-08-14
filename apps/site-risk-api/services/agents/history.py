"""Historical Disaster Agent.

Tools:
  - US Census Bureau Geocoder: reverse geocode lat/lng → county FIPS + state FIPS (no key)
  - OpenFEMA Disaster Declarations: all federally declared disasters for the county (no key)

Produces a structured disaster history profile: total count, breakdown by type and decade,
and the most notable events. This gives the LLM-scored risk dimensions temporal context —
a score of 3/5 means something different in a county with 40 prior declarations vs. 2.
"""
from __future__ import annotations

import json
from collections import Counter, defaultdict
from datetime import datetime, timezone
from typing import Any, Optional

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from models.assessment import RiskDimension, RiskLevel
from services import azure_openai

_CENSUS_URL = "https://geocoding.geo.census.gov/geocoder/geographies/coordinates"
_FEMA_URL = "https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries"

SYSTEM_PROMPT = """\
You are a disaster risk historian. You receive all federally declared disasters for a US county
going back decades and produce a concise risk profile summary.

Rules:
- Lead with the total count and most frequent type
- Note any clustering (multiple disasters in a short window = systemic vulnerability)
- Call out the most recent major event by name/date
- Score is based on frequency relative to US average (~1.5 federal declarations/county/year):
    1 = Very infrequent (< 0.5/yr)
    2 = Below average (0.5–1/yr)
    3 = Average (1–2/yr)
    4 = Above average (2–3/yr)
    5 = High frequency (3+/yr or recent catastrophic events)
- Keep it factual and specific — cite actual disaster numbers and names

Return ONLY valid JSON:
{
  "score": <int 1-5>,
  "level": <"Low"|"Moderate"|"High"|"Very High"|"Extreme">,
  "headline": <single sentence with total count and top hazard type>,
  "details": [<3-5 bullet points citing real events and patterns>],
  "sources": ["OpenFEMA Disaster Declarations", "US Census Bureau Geocoder"]
}
"""


@retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=1, max=4))
async def _get_fips(lat: float, lng: float) -> Optional[dict]:
    """Reverse geocode to county FIPS via Census Bureau."""
    params = {
        "x": f"{lng:.6f}",
        "y": f"{lat:.6f}",
        "benchmark": "4",
        "vintage": "4",
        "format": "json",
    }
    async with httpx.AsyncClient(timeout=12.0) as client:
        resp = await client.get(_CENSUS_URL, params=params)
        resp.raise_for_status()
    data = resp.json()
    try:
        geo = data["result"]["geographies"]["Counties"][0]
        return {
            "state_fips": geo["STATE"],
            "county_fips": geo["COUNTY"],
            "county_name": geo["NAME"],
            "state_name": geo.get("STATE_NAME", ""),
        }
    except (KeyError, IndexError):
        return None


# Declarations that don't reflect a hazard striking *this* place:
#   - COVID-19 hit every US county (universal, not location-specific)
#   - "Evacuation" emergencies (e.g. EM-3223 Hurricane Katrina Evacuation) are
#     evacuee-support declarations filed across ~30 inland host states
_NOISE_KEYWORDS = ("covid", "pandemic", "evacuation", "evacuee")


def _is_local_hazard(d: dict) -> bool:
    """Exclude nationwide pandemic + evacuation-support declarations."""
    title = (d.get("declarationTitle") or "").lower()
    inc = (d.get("incidentType") or "").lower()
    if inc in ("biological",):  # COVID and other pandemics
        return False
    return not any(k in title for k in _NOISE_KEYWORDS)


@retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=1, max=4))
async def _fetch_disasters(state_fips: str, county_fips: str) -> list[dict]:
    """Fetch hazard disaster declarations for a county from OpenFEMA.

    Filters out nationwide pandemic and evacuation-support declarations so the
    profile reflects hazards that actually struck the location.
    """
    params = {
        "$filter": (
            f"fipsStateCode eq '{state_fips}' and "
            f"fipsCountyCode eq '{county_fips}'"
        ),
        "$orderby": "declarationDate desc",
        "$top": "200",
        "$select": "disasterNumber,declarationTitle,incidentType,declarationDate,incidentBeginDate,incidentEndDate,designatedArea",
        "$format": "json",
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(_FEMA_URL, params=params)
        resp.raise_for_status()
    records = resp.json().get("DisasterDeclarationsSummaries", [])
    return [d for d in records if _is_local_hazard(d)]


def _build_profile(declarations: list[dict], county_name: str, state_name: str) -> dict[str, Any]:
    """Aggregate raw declarations into a structured history profile."""
    type_counts: Counter = Counter()
    decade_counts: Counter = Counter()
    years: list[int] = []

    for d in declarations:
        inc_type = d.get("incidentType", "Unknown")
        type_counts[inc_type] += 1
        date_str = d.get("declarationDate") or d.get("incidentBeginDate") or ""
        if date_str:
            try:
                year = int(date_str[:4])
                years.append(year)
                decade = f"{(year // 10) * 10}s"
                decade_counts[decade] += 1
            except ValueError:
                pass

    notable = declarations[:8]

    return {
        "total": len(declarations),
        "county": county_name,
        "state": state_name,
        "by_type": dict(type_counts.most_common()),
        "by_decade": dict(sorted(decade_counts.items())),
        "year_range": [min(years), max(years)] if years else [],
        "notable": [
            {
                "number": f"DR-{d.get('disasterNumber', '?')}",
                "title": d.get("declarationTitle", "Unknown"),
                "type": d.get("incidentType", "Unknown"),
                "date": (d.get("declarationDate") or "")[:10],
            }
            for d in notable
        ],
    }


async def run(lat: float, lng: float) -> RiskDimension:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    fips = None
    fips_error = None
    declarations: list[dict] = []
    declarations_error = None

    try:
        fips = await _get_fips(lat, lng)
    except Exception as e:
        fips_error = str(e)

    if not fips:
        return RiskDimension(
            dimension="history",
            score=1,
            level=RiskLevel.LOW,
            headline="County FIPS lookup unavailable — disaster history skipped",
            details=["Could not resolve county from coordinates via Census Bureau geocoder."],
            sources=[],
            data_as_of=now,
            agent_skipped=True,
            skip_reason=fips_error or "No FIPS returned",
        )

    try:
        declarations = await _fetch_disasters(fips["state_fips"], fips["county_fips"])
    except Exception as e:
        declarations_error = str(e)

    if not declarations:
        return RiskDimension(
            dimension="history",
            score=1,
            level=RiskLevel.LOW,
            headline=f"No federal disaster declarations found for {fips['county_name']}, {fips['state_name']}",
            details=[declarations_error or "OpenFEMA returned no records for this county."],
            sources=["OpenFEMA Disaster Declarations"],
            data_as_of=now,
        )

    profile = _build_profile(declarations, fips["county_name"], fips["state_name"])

    total = profile["total"]
    top_type = next(iter(profile["by_type"]), "Unknown")
    year_range = profile["year_range"]
    span_years = (year_range[1] - year_range[0]) if len(year_range) == 2 else 1
    rate_per_year = total / max(span_years, 1)

    summary = (
        f"{fips['county_name']}, {fips['state_name']}: {total} federal disaster declarations"
        + (f" ({year_range[0]}–{year_range[1]})" if year_range else "")
        + f"\nRate: {rate_per_year:.1f} declarations/year\n"
        + f"Most common type: {top_type} ({profile['by_type'].get(top_type, 0)} events)\n"
        + "By decade: " + ", ".join(f"{k}: {v}" for k, v in profile["by_decade"].items()) + "\n"
        + "Recent events:\n"
        + "\n".join(
            f"  - {e['number']} {e['title']} ({e['type']}, {e['date']})"
            for e in profile["notable"][:6]
        )
    )

    user_msg = f"Location: {lat:.4f}N, {lng:.4f}W\n\n{summary}"

    raw = await azure_openai.chat(SYSTEM_PROMPT, user_msg, max_tokens=500)

    try:
        parsed = json.loads(raw.strip().removeprefix("```json").removesuffix("```").strip())
        return RiskDimension(
            dimension="history",
            score=int(parsed["score"]),
            level=RiskLevel(parsed["level"]),
            headline=parsed["headline"],
            details=parsed["details"],
            sources=parsed.get("sources", ["OpenFEMA", "US Census Bureau"]),
            geojson=profile,
            data_as_of=now,
        )
    except Exception:
        return RiskDimension(
            dimension="history",
            score=3,
            level=RiskLevel.MODERATE,
            headline=f"{total} federal disaster declarations in {fips['county_name']} since {year_range[0] if year_range else 'records began'}",
            details=[summary],
            sources=["OpenFEMA", "US Census Bureau"],
            geojson=profile,
            data_as_of=now,
        )
