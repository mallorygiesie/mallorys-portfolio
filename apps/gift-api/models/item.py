from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel


class Item(BaseModel):
    id: str
    source: Literal["raindrop"]
    title: str
    description: str = ""
    url: str
    image_url: str = ""
    board_or_collection: str = ""
    category: Literal["beauty", "fashion", "home", "kitchen", "other"] = "other"
    tags: list[str] = []
    style_keywords: list[str] = []
    colors: list[str] = []
    materials: list[str] = []
    summary: str = ""
    brand: str = ""
    saved_at: Optional[datetime] = None


class ItemInSearch(Item):
    """Item as returned from Azure AI Search (embedding excluded from response)."""
    score: float = 0.0


class CandidateItem(BaseModel):
    title: str
    description: str = ""


class HistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    question: str
    candidate_item: Optional[CandidateItem] = None
    history: list[HistoryMessage] = []


class ChatResponse(BaseModel):
    answer: str
    sources: list[ItemInSearch] = []


class SyncResponse(BaseModel):
    synced: int
    message: str
