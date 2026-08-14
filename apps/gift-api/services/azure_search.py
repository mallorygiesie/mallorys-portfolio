from __future__ import annotations

from typing import Optional

from azure.core.credentials import AzureKeyCredential
from azure.search.documents.aio import SearchClient
from azure.search.documents.models import VectorizedQuery

from config import settings
from models.item import Item, ItemInSearch


INDEX_NAME = settings.azure_search_index_name

if settings.azure_search_api_key:
    # Local dev / fallback: API key auth.
    _credential = AzureKeyCredential(settings.azure_search_api_key)
else:
    # Production: Managed Identity (Entra ID) — no stored key.
    from azure.identity.aio import DefaultAzureCredential

    _credential = DefaultAzureCredential()


def _search_client() -> SearchClient:
    return SearchClient(
        endpoint=settings.azure_search_endpoint,
        index_name=INDEX_NAME,
        credential=_credential,
    )


def _item_to_doc(item: Item, embedding: list[float]) -> dict:
    return {
        "id": item.id,
        "source": item.source,
        "title": item.title,
        "description": item.description,
        "url": item.url,
        "image_url": item.image_url,
        "board_or_collection": item.board_or_collection,
        "category": item.category,
        "tags": item.tags,
        "style_keywords": item.style_keywords,
        "colors": item.colors,
        "materials": item.materials,
        "summary": item.summary,
        "brand": item.brand,
        "saved_at": item.saved_at.isoformat() if item.saved_at else None,
        "embedding": embedding,
    }


def _doc_to_item(doc: dict, score: float = 0.0) -> ItemInSearch:
    return ItemInSearch(
        id=doc.get("id", ""),
        source=doc.get("source", "raindrop"),
        title=doc.get("title", ""),
        description=doc.get("description", ""),
        url=doc.get("url", ""),
        image_url=doc.get("image_url", ""),
        board_or_collection=doc.get("board_or_collection", ""),
        category=doc.get("category", "other"),
        tags=doc.get("tags") or [],
        style_keywords=doc.get("style_keywords") or [],
        colors=doc.get("colors") or [],
        materials=doc.get("materials") or [],
        summary=doc.get("summary", ""),
        brand=doc.get("brand") or "",
        saved_at=doc.get("saved_at"),
        score=score,
    )


async def upsert_items(items_with_embeddings: list[tuple[Item, list[float]]]) -> None:
    docs = [_item_to_doc(item, emb) for item, emb in items_with_embeddings]
    async with _search_client() as client:
        await client.merge_or_upload_documents(documents=docs)


async def search(
    query: str,
    query_embedding: list[float],
    source_filter: Optional[str] = None,
    top: int = 8,
) -> list[ItemInSearch]:
    vector_query = VectorizedQuery(
        vector=query_embedding,
        k_nearest_neighbors=top,
        fields="embedding",
    )
    filter_expr = f"source eq '{source_filter}'" if source_filter else None

    async with _search_client() as client:
        results = await client.search(
            search_text=query,
            vector_queries=[vector_query],
            filter=filter_expr,
            top=top,
            select=[
                "id", "source", "title", "description", "url", "image_url",
                "board_or_collection", "category", "tags", "style_keywords",
                "colors", "materials", "summary", "brand", "saved_at",
            ],
        )
        items: list[ItemInSearch] = []
        async for result in results:
            score = result.get("@search.score", 0.0) or 0.0
            items.append(_doc_to_item(dict(result), float(score)))
        return items


async def list_items(
    source_filter: Optional[str] = None,
    category_filter: Optional[str] = None,
    top: int = 50,
    skip: int = 0,
) -> list[ItemInSearch]:
    filters = []
    if source_filter:
        filters.append(f"source eq '{source_filter}'")
    if category_filter:
        filters.append(f"category eq '{category_filter}'")
    filter_expr = " and ".join(filters) if filters else None

    async with _search_client() as client:
        results = await client.search(
            search_text="*",
            filter=filter_expr,
            top=top,
            skip=skip,
            order_by=["saved_at desc"],
            select=[
                "id", "source", "title", "description", "url", "image_url",
                "board_or_collection", "category", "tags", "style_keywords",
                "colors", "materials", "summary", "brand", "saved_at",
            ],
        )
        items: list[ItemInSearch] = []
        async for result in results:
            score = result.get("@search.score", 0.0) or 0.0
            items.append(_doc_to_item(dict(result), float(score)))
        return items


async def get_item(item_id: str) -> Optional[ItemInSearch]:
    async with _search_client() as client:
        try:
            doc = await client.get_document(key=item_id)
            return _doc_to_item(dict(doc))
        except Exception:
            return None
