"""
Raindrop.io API client.
Docs: https://developer.raindrop.io/
"""
from __future__ import annotations

from datetime import datetime

import httpx

from config import settings
from models.item import Item

BASE_URL = "https://api.raindrop.io/rest/v1"


def _headers() -> dict[str, str]:
    return {"Authorization": f"Bearer {settings.raindrop_token}"}


def _parse_raindrop(drop: dict) -> Item:
    cover = drop.get("cover", "")
    # cover may be a list or string
    if isinstance(cover, list):
        cover = cover[0] if cover else ""

    created = drop.get("created")
    saved_at = datetime.fromisoformat(created.replace("Z", "+00:00")) if created else None

    return Item(
        id=f"raindrop_{drop['_id']}",
        source="raindrop",
        title=drop.get("title", "Untitled"),
        description=drop.get("excerpt", ""),
        url=drop.get("link", ""),
        image_url=cover,
        board_or_collection=drop.get("collection", {}).get("title", ""),
        tags=drop.get("tags", []),
        saved_at=saved_at,
    )


async def fetch_all_items() -> list[Item]:
    """Fetch all bookmarks from all Raindrop collections."""
    items: list[Item] = []
    async with httpx.AsyncClient(headers=_headers(), timeout=30) as client:
        # Get collections first
        col_resp = await client.get(f"{BASE_URL}/collections")
        col_resp.raise_for_status()
        collections = col_resp.json().get("items", [])
        collection_map: dict[int, str] = {
            c["_id"]: c.get("title", "") for c in collections
        }

        # Fetch all raindrops (collection 0 = all)
        page = 0
        while True:
            resp = await client.get(
                f"{BASE_URL}/raindrops/0",
                params={"perpage": 50, "page": page},
            )
            resp.raise_for_status()
            data = resp.json()
            drops = data.get("items", [])
            if not drops:
                break
            for drop in drops:
                item = _parse_raindrop(drop)
                # Enrich collection name from map if missing
                col_id = drop.get("collection", {}).get("$id")
                if col_id and not item.board_or_collection:
                    item.board_or_collection = collection_map.get(col_id, "")
                items.append(item)
            if len(drops) < 50:
                break
            page += 1

    return items
