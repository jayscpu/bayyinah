from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "bayyinah-api"}
