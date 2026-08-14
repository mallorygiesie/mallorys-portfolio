"""
DALL-E 3 image generation via Azure OpenAI.
Requires a DALL-E 3 deployment in Azure OpenAI Studio.
"""
from __future__ import annotations

from openai import AsyncAzureOpenAI

from config import settings


def _client() -> AsyncAzureOpenAI:
    return AsyncAzureOpenAI(
        azure_endpoint=settings.azure_openai_endpoint,
        api_key=settings.azure_openai_api_key,
        api_version="2024-02-01",
    )


def _build_prompt(title: str, summary: str, style_keywords: list[str], category: str) -> str:
    style = ", ".join(style_keywords[:4]) if style_keywords else "minimal, clean"
    desc = summary or title
    return (
        f"Editorial product photography, pure white background, soft natural light. "
        f"{category.capitalize()} item: {desc}. "
        f"Aesthetic: {style}. "
        f"No text, no watermarks, no people. Clean, minimal, high quality."
    )


async def generate_image(
    title: str,
    summary: str,
    style_keywords: list[str],
    category: str,
) -> str:
    """Returns a temporary DALL-E image URL (valid ~1 hour)."""
    prompt = _build_prompt(title, summary, style_keywords, category)
    client = _client()
    response = await client.images.generate(
        model=settings.azure_openai_image_deployment,
        prompt=prompt,
        size="1024x1024",
        quality="standard",
        n=1,
    )
    return response.data[0].url or ""
