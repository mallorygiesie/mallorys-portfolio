from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from config import settings
from routers import assess

app = FastAPI(
    title="SiteRisk API",
    description="Real-time environmental risk assessment via multi-agent AI.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(assess.router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok"}


# Serve built React frontend in production
_DIST = Path(__file__).parent / "frontend_dist"

if _DIST.exists():

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        candidate = (_DIST / full_path).resolve()
        if candidate.is_relative_to(_DIST) and candidate.is_file():
            return FileResponse(str(candidate))
        return FileResponse(str(_DIST / "index.html"))
