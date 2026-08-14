from __future__ import annotations

import httpx

from models.assessment import GeocodedLocation

_CENSUS_URL = "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress"


async def geocode(address: str) -> GeocodedLocation:
    """Geocode a US address using the Census Bureau Geocoding API (no key required)."""
    params = {
        "address": address,
        "benchmark": "4",
        "format": "json",
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(_CENSUS_URL, params=params)
        resp.raise_for_status()
        data = resp.json()

    matches = data.get("result", {}).get("addressMatches", [])
    if not matches:
        raise ValueError(f"Could not geocode address: {address!r}")

    match = matches[0]
    coords = match["coordinates"]
    return GeocodedLocation(
        address=address,
        lat=float(coords["y"]),
        lng=float(coords["x"]),
        display_name=match.get("matchedAddress", address),
    )
