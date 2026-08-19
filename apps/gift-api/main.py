import asyncio
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

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
_DIST = (Path(__file__).parent / "frontend_dist").resolve()


def _resolve_static(full_path: str) -> Optional[Path]:
    """Map a request path onto a file in the Next.js static export.

    Pages are emitted as siblings of their segment directory (`projects.html`
    next to `projects/`), so an extensionless route has to try the `.html`
    form before giving up. Returns None if nothing matches.
    """
    # Strip surrounding slashes so "" (the root) and "/projects/" both work.
    # A leading slash would make `_DIST / rel` jump to the filesystem root and
    # silently escape the export directory.
    rel_path = full_path.strip("/")
    if not rel_path:
        candidates = ("index.html",)
    else:
        candidates = (rel_path, f"{rel_path}.html", f"{rel_path}/index.html")

    for rel in candidates:
        candidate = (_DIST / rel).resolve()
        if candidate.is_relative_to(_DIST) and candidate.is_file():
            return candidate
    return None


if _DIST.exists():

    # GET *and* HEAD: Next's client router probes routes with HEAD before a
    # client-side navigation, and FastAPI's @app.get does not imply HEAD the
    # way Starlette's plain routes do. Answering 405 made the router treat
    # every page as missing and render its 404 until a full reload.
    @app.api_route("/{full_path:path}", methods=["GET", "HEAD"], include_in_schema=False)
    async def serve_spa(full_path: str):
        match = _resolve_static(full_path)
        if match is not None:
            return FileResponse(str(match))
        # Unknown path -> Next's own 404 page if present, else the app shell.
        # Status must really be 404 so crawlers and the router don't treat a
        # missing route as a valid page.
        not_found = _DIST / "404.html"
        fallback = not_found if not_found.is_file() else _DIST / "index.html"
        return FileResponse(str(fallback), status_code=404)
