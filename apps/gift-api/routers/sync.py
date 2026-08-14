"""
/sync endpoints: trigger ingestion + enrichment + indexing for Raindrop.
"""
from __future__ import annotations

import asyncio

from fastapi import APIRouter, BackgroundTasks, HTTPException

from models.item import SyncResponse
from services import azure_search, enrichment, raindrop

router = APIRouter(prefix="/sync", tags=["sync"])


async def _ingest_and_index(items_coro) -> int:
    """Fetch items, enrich, embed, and upsert to Azure AI Search."""
    items = await items_coro
    if not items:
        return 0

    # Enrich all items concurrently (batched to avoid rate limits)
    batch_size = 10
    for i in range(0, len(items), batch_size):
        batch = items[i : i + batch_size]
        await asyncio.gather(*[enrichment.enrich_item(item) for item in batch])

    # Embed and collect
    embeddings = await asyncio.gather(
        *[enrichment.embed_item(item) for item in items]
    )
    pairs = list(zip(items, embeddings))
    await azure_search.upsert_items(pairs)
    return len(pairs)


@router.post("/raindrop", response_model=SyncResponse)
async def sync_raindrop(background_tasks: BackgroundTasks):
    """Trigger a Raindrop.io sync. Runs in background."""
    async def run():
        await _ingest_and_index(raindrop.fetch_all_items())

    background_tasks.add_task(run)
    return SyncResponse(synced=0, message="Raindrop sync started in background.")


@router.post("/raindrop/blocking", response_model=SyncResponse)
async def sync_raindrop_blocking():
    """Sync Raindrop items and wait for completion (use for testing)."""
    try:
        count = await _ingest_and_index(raindrop.fetch_all_items())
        return SyncResponse(synced=count, message=f"Synced {count} Raindrop items.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
