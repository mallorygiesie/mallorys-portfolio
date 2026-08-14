from __future__ import annotations

import json

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from models.assessment import AssessmentRequest, RiskDimension
from services import geocoder
from services.agents import orchestrator

router = APIRouter(prefix="/assess", tags=["assess"])


def _sse(event: dict) -> str:
    return f"data: {json.dumps(event)}\n\n"


@router.post("")
async def assess(request: AssessmentRequest):
    async def generate():
        try:
            # 1. Geocode
            yield _sse({"type": "status", "text": "Locating address..."})
            try:
                location = await geocoder.geocode(request.address)
            except ValueError as e:
                yield _sse({"type": "error", "text": str(e)})
                return

            yield _sse({
                "type": "location",
                "lat": location.lat,
                "lng": location.lng,
                "display_name": location.display_name,
            })

            # 2. Route — LLM decides which agents matter for this context
            yield _sse({"type": "status", "text": "Determining relevant risk dimensions..."})
            dimensions = await orchestrator.route(location, request.context)

            yield _sse({"type": "agents_selected", "agents": dimensions})
            for dim in dimensions:
                yield _sse({"type": "agent_running", "dimension": dim})

            # 3. Fan out agents in parallel — yield each card as it arrives
            yield _sse({"type": "status", "text": f"Running {len(dimensions)} risk agents in parallel..."})
            completed_results: list[RiskDimension] = []

            async for result in orchestrator.run_agents(location, dimensions):
                completed_results.append(result)
                yield _sse({
                    "type": "risk_update",
                    "result": result.model_dump(mode="json"),
                })

            # 4. Stream synthesis narrative
            yield _sse({"type": "status", "text": "Synthesizing assessment..."})
            async for token in orchestrator.synthesize(location, completed_results, request.context):
                yield _sse({"type": "briefing_token", "text": token})

            # 5. Done
            avg_score = (
                sum(r.score for r in completed_results) / len(completed_results)
                if completed_results else 0
            )
            yield _sse({"type": "done", "summary_score": round(avg_score, 1)})

        except Exception as exc:
            yield _sse({"type": "error", "text": str(exc)})

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
