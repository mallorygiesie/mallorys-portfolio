from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from config import settings
from services import image_gen

router = APIRouter(prefix="/generate", tags=["generate"])


class ImageRequest(BaseModel):
    title: str
    summary: str = ""
    style_keywords: list[str] = []
    category: str = "other"


class ImageResponse(BaseModel):
    url: str


@router.post("/image", response_model=ImageResponse)
async def generate_image(request: ImageRequest):
    if not settings.azure_openai_image_deployment:
        raise HTTPException(status_code=503, detail="Image generation not configured.")
    try:
        url = await image_gen.generate_image(
            title=request.title,
            summary=request.summary,
            style_keywords=request.style_keywords,
            category=request.category,
        )
        return ImageResponse(url=url)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
