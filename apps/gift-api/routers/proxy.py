from __future__ import annotations

import httpx
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/proxy", tags=["proxy"])

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"}


@router.get("/image")
async def proxy_image(url: str = Query(...)):
    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
            resp = await client.get(
                url,
                headers={
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
                    "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
                },
            )
            resp.raise_for_status()

        content_type = resp.headers.get("content-type", "image/jpeg").split(";")[0].strip()
        if content_type not in ALLOWED_CONTENT_TYPES:
            raise HTTPException(status_code=400, detail="Not an image.")

        return StreamingResponse(
            iter([resp.content]),
            media_type=content_type,
            headers={"Cache-Control": "public, max-age=86400"},
        )
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail="Image fetch failed.")
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))
