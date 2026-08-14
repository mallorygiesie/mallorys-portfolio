import asyncio
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from config import settings
from dependencies import require_admin
from routers import chat, generate, items, proxy, sync
from routers.sync import _ingest_and_index
from services import raindrop


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Skip the startup ingest in production: the index is already populated, and
    # auto-ingest would run paid LLM enrichment on every restart.
    if not settings.is_prod:
        asyncio.create_task(_ingest_and_index(raindrop.fetch_all_items()))
    yield


app = FastAPI(
    title="Mallory Gift & Taste API",
    description="Personalized gift and preference recommendations from Raindrop.io.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(items.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
# Expensive endpoints — gated behind ADMIN_TOKEN in production (open in dev).
app.include_router(sync.router, prefix="/api", dependencies=[Depends(require_admin)])
app.include_router(generate.router, prefix="/api", dependencies=[Depends(require_admin)])
app.include_router(proxy.router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok"}


# Serve the built React frontend in production
_DIST = Path(__file__).parent / "frontend_dist"

if _DIST.exists():

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        candidate = (_DIST / full_path).resolve()
        if candidate.is_relative_to(_DIST) and candidate.is_file():
            return FileResponse(str(candidate))
        return FileResponse(str(_DIST / "index.html"))
