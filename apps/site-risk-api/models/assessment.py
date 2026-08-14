from __future__ import annotations

from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel


class RiskLevel(str, Enum):
    LOW = "Low"
    MODERATE = "Moderate"
    HIGH = "High"
    VERY_HIGH = "Very High"
    EXTREME = "Extreme"


class RiskDimension(BaseModel):
    dimension: str  # "wildfire" | "flood" | "air_quality" | "weather" | "history"
    score: int      # 1–5
    level: RiskLevel
    headline: str
    details: list[str]
    sources: list[str]
    geojson: Optional[Any] = None        # GeoJSON for map overlays / structured history profile
    threat_vector: Optional[Any] = None  # fire spread threat vector for map rendering
    data_as_of: str
    agent_skipped: bool = False
    skip_reason: Optional[str] = None


class GeocodedLocation(BaseModel):
    address: str
    lat: float
    lng: float
    display_name: str


class AssessmentRequest(BaseModel):
    address: str
    context: Optional[str] = None  # user's purpose: "hiking", "buying a home", etc.
