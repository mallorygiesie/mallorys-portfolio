"""
Run once to create (or recreate) the Azure AI Search index with the correct schema.

Usage:
    cd backend && python scripts/setup_index.py
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from azure.core.credentials import AzureKeyCredential
from azure.search.documents.indexes import SearchIndexClient
from azure.search.documents.indexes.models import (
    HnswAlgorithmConfiguration,
    SearchableField,
    SearchField,
    SearchFieldDataType,
    SearchIndex,
    SimpleField,
    VectorSearch,
    VectorSearchProfile,
)

from config import settings

EMBEDDING_DIMENSIONS = 1536  # text-embedding-3-small


def create_index():
    credential = AzureKeyCredential(settings.azure_search_api_key)
    client = SearchIndexClient(
        endpoint=settings.azure_search_endpoint,
        credential=credential,
    )

    fields = [
        SimpleField(name="id", type=SearchFieldDataType.String, key=True, filterable=True),
        SimpleField(name="source", type=SearchFieldDataType.String, filterable=True, facetable=True),
        SearchableField(name="title", type=SearchFieldDataType.String),
        SearchableField(name="description", type=SearchFieldDataType.String),
        SearchableField(name="summary", type=SearchFieldDataType.String),
        SimpleField(name="url", type=SearchFieldDataType.String),
        SimpleField(name="image_url", type=SearchFieldDataType.String),
        SimpleField(name="board_or_collection", type=SearchFieldDataType.String, filterable=True, facetable=True),
        SimpleField(name="category", type=SearchFieldDataType.String, filterable=True, facetable=True),
        SearchField(
            name="tags",
            type=SearchFieldDataType.Collection(SearchFieldDataType.String),
            searchable=True,
            filterable=True,
            facetable=True,
        ),
        SearchField(
            name="style_keywords",
            type=SearchFieldDataType.Collection(SearchFieldDataType.String),
            searchable=True,
            filterable=True,
        ),
        SearchField(
            name="colors",
            type=SearchFieldDataType.Collection(SearchFieldDataType.String),
            searchable=True,
            filterable=True,
        ),
        SearchField(
            name="materials",
            type=SearchFieldDataType.Collection(SearchFieldDataType.String),
            searchable=True,
            filterable=True,
        ),
        SearchableField(name="brand", type=SearchFieldDataType.String, filterable=True, facetable=True),
        SimpleField(
            name="saved_at",
            type=SearchFieldDataType.DateTimeOffset,
            filterable=True,
            sortable=True,
        ),
        SearchField(
            name="embedding",
            type=SearchFieldDataType.Collection(SearchFieldDataType.Single),
            searchable=True,
            vector_search_dimensions=EMBEDDING_DIMENSIONS,
            vector_search_profile_name="default-profile",
        ),
    ]

    vector_search = VectorSearch(
        profiles=[VectorSearchProfile(name="default-profile", algorithm_configuration_name="default-hnsw")],
        algorithms=[HnswAlgorithmConfiguration(name="default-hnsw")],
    )

    index = SearchIndex(
        name=settings.azure_search_index_name,
        fields=fields,
        vector_search=vector_search,
    )

    result = client.create_or_update_index(index)
    print(f"Index '{result.name}' created/updated successfully.")


if __name__ == "__main__":
    create_index()
