import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from sqlalchemy import text

from app.core.database import engine, Base
from app.api.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Add bilingual name columns to existing databases
        for col in ("name_en", "name_ar"):
            try:
                await conn.execute(text(f"ALTER TABLE users ADD COLUMN {col} VARCHAR(255)"))
            except Exception:
                pass  # Column already exists
    yield


app = FastAPI(
    title="Bayyinah API",
    description="AI-powered educational assessment platform with Socratic dialogue",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow localhost in dev, and Render domain in production
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:5175",
]
render_url = os.getenv("RENDER_EXTERNAL_URL")
if render_url:
    allowed_origins.append(render_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "bayyinah-api"}


# Serve frontend static files in production
FRONTEND_DIR = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

if FRONTEND_DIR.exists():
    # Serve static assets (JS, CSS, images)
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIR / "assets"), name="static-assets")

    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        # Try to serve the exact file first
        file_path = FRONTEND_DIR / full_path
        if full_path and file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        # Otherwise serve index.html for SPA routing
        return FileResponse(FRONTEND_DIR / "index.html")
