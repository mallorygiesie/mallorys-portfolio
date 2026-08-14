from __future__ import annotations

import httpx
from fastapi import APIRouter, Query

router = APIRouter(prefix="/suggest", tags=["suggest"])

# Photon — open-source, keyless geocoder built for as-you-type autocomplete.
_PHOTON_URL = "https://photon.komoot.io/api/"
# Bias results toward the continental US (this app only assesses US addresses).
_US_CENTER = {"lat": 39.8, "lon": -98.6}


def _format_label(props: dict) -> str:
    parts: list[str] = []
    house = props.get("housenumber")
    street = props.get("street") or props.get("name")
    if house and street:
        parts.append(f"{house} {street}")
    elif street:
        parts.append(street)
    city = props.get("city") or props.get("town") or props.get("village") or props.get("county")
    if city:
        parts.append(city)
    if props.get("state"):
        parts.append(props["state"])
    if props.get("postcode"):
        parts.append(props["postcode"])
    return ", ".join(parts)


@router.get("")
async def suggest(q: str = Query(..., min_length=3, max_length=120)):
    """Return up to 6 US address suggestions for a partial query (keyless)."""
    params = {
        "q": q,
        "limit": "10",
        "lang": "en",
        "lat": _US_CENTER["lat"],
        "lon": _US_CENTER["lon"],
    }
    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            resp = await client.get(_PHOTON_URL, params=params)
            resp.raise_for_status()
            data = resp.json()
    except Exception:
        return {"suggestions": []}

    suggestions: list[dict] = []
    seen: set[str] = set()
    for feature in data.get("features", []):
        props = feature.get("properties", {})
        if props.get("countrycode") not in (None, "US"):
            continue
        label = _format_label(props)
        if not label or label in seen:
            continue
        seen.add(label)
        coords = (feature.get("geometry", {}) or {}).get("coordinates") or [None, None]
        suggestions.append({"label": label, "lat": coords[1], "lon": coords[0]})
        if len(suggestions) >= 6:
            break

    return {"suggestions": suggestions}
