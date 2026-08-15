from __future__ import annotations

import json
import re

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from models.item import ChatRequest, ItemInSearch
from services import azure_openai, azure_search, rate_limit
from services.web_search import search as web_search

_RECOMMENDATION_RE = re.compile(
    r"\b(buy|but|get|gift|recommend|suggest|purchase|shop|find|search|look for|looking"
    r"|spend|budget|thoughts|options?|ideas?"
    r"|what (should|can|to|kind|type|style|sort)"
    r"|which|where)\b"
    r"|[$£€]\s*\d",
    re.IGNORECASE,
)

router = APIRouter(prefix="/chat", tags=["chat"])

SYSTEM_PROMPT = """\
You are a gift-shopping assistant helping people buy things for Mallory. \
You know Mallory's taste through her Raindrop.io bookmarks. \
The person you are talking to is a gift-buyer — NOT Mallory. \
Never say "your saves" or "you've saved." Always say "Mallory's saves," "she saved," or "her taste."

Rules:
1. Saved items first. If any saved item directly answers the question (she already bookmarked it), \
   lead with that — link to it and explain why it's a match. These are the highest-confidence answers.
2. Web results always included. When "Additional products found online" are provided, always include \
   them in your response — do not offer to search, ask permission, or hold them back. \
   For every web result you mention, include its title as a clickable markdown link with the exact URL. \
   Note that product pages can go out of stock or expire — tell the buyer to search for the item by name \
   if a link doesn't work. Never invent or guess URLs.
3. For evaluation questions ("would Mallory like X?"), compare against her saves only.
4. Be clear about confidence: saved item = high confidence, web result = inferred match.
5. Be brief. Top 2-3 items max, even for broad questions — do not enumerate every category you can think of. \
   1-2 sentences per item, one sentence of "why it fits her taste," no separate reasoning bullet. \
   Skip preambles ("Here are a few directions...") and skip the closing question asking for budget/preference — \
   just answer. If the buyer wants more options or narrower ones, they'll ask.
6. No hallucinated products. If no "Additional products found online" section is in the context, \
   do NOT name specific brands, products, or prices from your training data. \
   Describe what qualities to look for and suggest the buyer search for those characteristics themselves.
"""


def _build_context(items: list[ItemInSearch]) -> str:
    lines = []
    for item in items:
        lines.append(
            f"[Raindrop (saved)] {item.title}"
            + (f" — {item.summary}" if item.summary else "")
            + (f" | Tags: {', '.join(item.tags)}" if item.tags else "")
            + (f" | Style: {', '.join(item.style_keywords)}" if item.style_keywords else "")
            + (f" | Category: {item.category}" if item.category != "other" else "")
        )
    return "\n".join(lines) if lines else "No relevant items found in Mallory's data."


def _sse(event: dict) -> str:
    return f"data: {json.dumps(event)}\n\n"


@router.post("")
async def chat(request: ChatRequest, http_request: Request):
    rate_limit.check_and_increment(http_request)

    async def generate():
        try:
            yield _sse({"type": "status", "text": "Searching Mallory's saves…"})

            query = request.question
            if request.candidate_item:
                query += f" {request.candidate_item.title} {request.candidate_item.description}"

            query_embedding = await azure_openai.embed(query)
            results = await azure_search.search(
                query=query,
                query_embedding=query_embedding,
                source_filter=None,
                top=8,
            )

            context = _build_context(results)
            candidate_info = ""
            if request.candidate_item:
                candidate_info = (
                    f"\n\nCandidate item to evaluate:\n"
                    f"Title: {request.candidate_item.title}\n"
                    f"Description: {request.candidate_item.description}"
                )

            is_recommendation = bool(_RECOMMENDATION_RE.search(request.question)) and not request.candidate_item

            web_context = ""
            if is_recommendation:
                yield _sse({"type": "status", "text": "Searching the web…"})

                style_tags: list[str] = []
                for item in results[:4]:
                    style_tags.extend(item.style_keywords[:2])
                taste_hint = " ".join(list(dict.fromkeys(style_tags))[:4])

                search_hits = []
                shopping_q = re.sub(
                    r"\b(what|should|i|mallory|her|she|would|for|me|my|us|buy|but|get|thoughts?|ideas?|options?|spend|budget|looking)\b",
                    " ",
                    request.question,
                    flags=re.IGNORECASE,
                )
                shopping_q = re.sub(r"\s+", " ", shopping_q).strip()
                primary_query = f"women's {shopping_q} buy {taste_hint}"
                sr = await web_search(primary_query, max_results=4)
                search_hits.append(f"--- Product search results ---\n{sr}")

                saved_brands = list(dict.fromkeys(
                    item.brand for item in results if item.brand
                ))[:3]
                for brand in saved_brands:
                    sr_brand = await web_search(f"{brand} {shopping_q}", max_results=2)
                    search_hits.append(f"--- {brand} (brand she's saved) ---\n{sr_brand}")

                web_context = (
                    "\n\nAdditional products found online (use these to supplement saves — include URLs):\n"
                    + "\n\n".join(search_hits)
                )

            user_message = (
                f"Question: {request.question}\n\n"
                f"Mallory's saved items (check these first — high confidence):\n{context}"
                f"{candidate_info}"
                f"{web_context}"
            )

            yield _sse({"type": "status", "text": "Thinking…"})

            history_dicts = [{"role": m.role, "content": m.content} for m in request.history[-6:]]
            async for token in azure_openai.chat_stream(
                SYSTEM_PROMPT,
                user_message,
                max_tokens=1200 if is_recommendation else 600,
                history=history_dicts or None,
            ):
                yield _sse({"type": "token", "text": token})

            sources = [r.model_dump(mode="json") for r in results]
            yield _sse({"type": "done", "sources": sources})

        except Exception as exc:
            from openai import BadRequestError
            if isinstance(exc, BadRequestError) and getattr(exc, "code", None) == "content_filter":
                yield _sse({
                    "type": "error",
                    "text": (
                        "Azure's content filter flagged this request as a false positive "
                        "(common with beauty/skincare topics). Try rephrasing your question, "
                        "e.g. \"recommend a face wash under $100.\""
                    ),
                })
            else:
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
