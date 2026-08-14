from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from models.item import ItemInSearch
from services import azure_search

router = APIRouter(prefix="/items", tags=["items"])


@router.get("", response_model=list[ItemInSearch])
async def list_items(
    source: Optional[str] = Query(None, description="Filter by source: raindrop"),
    category: Optional[str] = Query(None, description="Filter by category"),
    top: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
):
    return await azure_search.list_items(
        source_filter=source,
        category_filter=category,
        top=top,
        skip=skip,
    )


@router.get("/{item_id}", response_model=ItemInSearch)
async def get_item(item_id: str):
    item = await azure_search.get_item(item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return item
