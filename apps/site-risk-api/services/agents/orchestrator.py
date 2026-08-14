"""Orchestrator: routes to relevant agents, fans out in parallel, streams results.

The routing step is an LLM call that reads the user's context (e.g. "planning a hike",
"buying a house") and decides which risk dimensions to invoke. This is the non-trivial
reasoning step that distinguishes the agentic pattern from a plain dashboard.

Fan-out uses asyncio.wait(FIRST_COMPLETED) so each RiskDimension is yielded as soon
as its agent finishes — giving the frontend the live card-by-card reveal.
"""
from __future__ import annotations

import asyncio
import json
from typing import AsyncIterator, Optional

from models.assessment import GeocodedLocation, RiskDimension, RiskLevel
from services import azure_openai
from services.agents import air_quality, fire, flood, history, weather

_ALL_DIMENSIONS = ["wildfire", "flood", "air_quality", "weather", "history"]

_AGENT_MAP = {
    "wildfire": fire.run,
    "flood": flood.run,
    "air_quality": air_quality.run,
    "weather": weather.run,
    "history": history.run,
}

_ROUTING_SYSTEM_PROMPT = """\
You are an environmental risk triage specialist. Given a user's purpose for assessing
a location, decide which risk dimensions are most relevant.

Available dimensions: wildfire, flood, air_quality, weather, history

Rules:
- Default (no context or general inquiry): return all five
- Outdoor recreation (hiking, camping, trail running): wildfire, air_quality, weather, history — skip flood
- Property purchase / home buying: all five
- Farming / agriculture: all five
- Short-term travel / visit: wildfire, air_quality, weather, history
- Flood-specific inquiry: flood, weather, history
- Construction / development: flood, wildfire, history

Always include "history" — it provides county-level disaster context for any purpose.

Return ONLY a JSON array, e.g. ["wildfire", "air_quality", "weather", "history"]
"""


async def route(location: GeocodedLocation, context: Optional[str]) -> list[str]:
    """Use an LLM to select which agents are relevant for the user's context."""
    if not context:
        return _ALL_DIMENSIONS

    user_msg = (
        f"Location: {location.display_name}\n"
        f"User's stated purpose: {context}\n\n"
        "Which risk dimensions should be assessed? Return JSON array only."
    )
    raw = await azure_openai.chat(_ROUTING_SYSTEM_PROMPT, user_msg, max_tokens=80, temperature=0.0)
    try:
        selected = json.loads(raw.strip().removeprefix("```json").removesuffix("```").strip())
        return [d for d in selected if d in _AGENT_MAP]
    except Exception:
        return _ALL_DIMENSIONS


async def run_agents(
    location: GeocodedLocation,
    dimensions: list[str],
) -> AsyncIterator[RiskDimension]:
    """Fan out selected agents in parallel, yield each RiskDimension as it completes."""
    tasks: dict[asyncio.Task, str] = {
        asyncio.create_task(_AGENT_MAP[dim](location.lat, location.lng)): dim
        for dim in dimensions
        if dim in _AGENT_MAP
    }

    pending = set(tasks.keys())
    while pending:
        done, pending = await asyncio.wait(pending, return_when=asyncio.FIRST_COMPLETED)
        for task in done:
            try:
                result: RiskDimension = task.result()
            except Exception as e:
                dim = tasks[task]
                from datetime import datetime, timezone
                result = RiskDimension(
                    dimension=dim,
                    score=1,
                    level=RiskLevel.LOW,
                    headline=f"{dim.replace('_', ' ').title()} agent encountered an error",
                    details=[str(e)],
                    sources=[],
                    data_as_of=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
                    agent_skipped=True,
                    skip_reason=str(e),
                )
            yield result


_SYNTHESIS_SYSTEM_PROMPT = """\
You are an environmental risk analyst writing a concise site risk briefing for a member
of the public. You receive structured risk assessments across multiple dimensions and
synthesize them into a plain-English briefing.

Rules:
- Lead with the highest-risk finding
- Explicitly call out compound risk when multiple dimensions are elevated simultaneously
  (e.g., active wildfire + poor air quality + Red Flag Warning = compounding emergency)
- Use plain language — no jargon unless you define it
- Be specific: cite data (AQI values, fire names, flood zone codes)
- Include actionable guidance appropriate to the risk level
- 3–5 short paragraphs, no bullet lists — this is a narrative briefing
- End with data freshness note (when each source was last updated)
- Tone: calm, factual, and useful — not alarmist, not dismissive
"""


async def synthesize(
    location: GeocodedLocation,
    results: list[RiskDimension],
    context: Optional[str],
) -> AsyncIterator[str]:
    """Stream the narrative synthesis after all agents have completed."""
    results_text = ""
    for r in results:
        status = " [DATA UNAVAILABLE — interpreted from context]" if r.agent_skipped else ""
        results_text += (
            f"\n{r.dimension.upper().replace('_', ' ')} RISK — Score {r.score}/5 ({r.level}){status}\n"
            f"Headline: {r.headline}\n"
        )
        for detail in r.details:
            results_text += f"  • {detail}\n"
        results_text += f"  Sources: {', '.join(r.sources)} | As of: {r.data_as_of}\n"

    user_msg = (
        f"Location: {location.display_name} ({location.lat:.4f}N, {location.lng:.4f}W)\n"
        + (f"User's purpose: {context}\n" if context else "")
        + f"\nRisk assessment results:\n{results_text}"
    )

    async for token in azure_openai.chat_stream(_SYNTHESIS_SYSTEM_PROMPT, user_msg, max_tokens=700):
        yield token
