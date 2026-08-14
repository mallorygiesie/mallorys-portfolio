from __future__ import annotations

import httpx

from config import settings

_TAVILY_URL = "https://api.tavily.com/search"


async def search(query: str, max_results: int = 5) -> str:
    """Call Tavily and return LLM-ready text. Returns a short error string if unconfigured."""
    if not settings.tavily_api_key:
        return "Web search unavailable (TAVILY_API_KEY not set)."

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(
            _TAVILY_URL,
            json={
                "api_key": settings.tavily_api_key,
                "query": query,
                "max_results": max_results,
                "search_depth": "advanced",
                "include_answer": False,
            },
        )
        resp.raise_for_status()
        data = resp.json()

    results = data.get("results", [])
    if not results:
        return "No web results found."

    lines = []
    for r in results:
        title = r.get("title", "")
        url = r.get("url", "")
        snippet = (r.get("content") or "")[:300]
        lines.append(f"Title: {title}\nURL: {url}\nSummary: {snippet}")

    return "\n\n".join(lines)
