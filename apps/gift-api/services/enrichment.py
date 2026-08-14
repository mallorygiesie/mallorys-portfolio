"""
Enrichment pipeline: takes a raw Item, asks Azure OpenAI to extract
category / tags / style / colors / materials, generates a summary,
then embeds the summary for indexing.
"""
from __future__ import annotations

import json
import re

from models.item import Item
from services.azure_openai import chat, embed

ENRICHMENT_PROMPT = """\
You are a shopping assistant. Given a product title, description, and URL, extract structured metadata.

Return ONLY valid JSON with these keys:
{
  "category": "beauty|fashion|home|kitchen|other",
  "tags": ["list", "of", "tags"],
  "style_keywords": ["minimal", "cozy", "etc"],
  "colors": ["color names"],
  "materials": ["material names"],
  "summary": "one-sentence summary of the item",
  "brand": "Brand name only (e.g. 'A Emery', 'The Frankie Shop', 'Louis Vuitton'). Use the URL domain or title to identify it. Empty string if unknown."
}

Be concise. Use title case for brand. Use lowercase for everything else. Max 8 tags, 5 style_keywords, 4 colors, 4 materials.
"""


def _extract_json(text: str) -> dict:
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        return json.loads(match.group())
    return {}


async def enrich_item(item: Item) -> Item:
    """Fill in category, tags, style metadata, summary, brand via LLM."""
    user_msg = f"Title: {item.title}\nDescription: {item.description}\nURL: {item.url}"
    try:
        raw = await chat(ENRICHMENT_PROMPT, user_msg)
        data = _extract_json(raw)
        item.category = data.get("category", item.category)
        item.tags = data.get("tags", item.tags)
        item.style_keywords = data.get("style_keywords", item.style_keywords)
        item.colors = data.get("colors", item.colors)
        item.materials = data.get("materials", item.materials)
        item.summary = data.get("summary", item.summary) or item.title
        item.brand = data.get("brand", item.brand) or ""
    except Exception:
        item.summary = item.summary or item.title
    return item


async def embed_item(item: Item) -> list[float]:
    """Generate embedding from enriched item text."""
    text = " ".join(filter(None, [
        item.title,
        item.summary,
        item.description,
        " ".join(item.tags),
        " ".join(item.style_keywords),
        item.category,
        item.board_or_collection,
    ]))
    return await embed(text)
