"""PaperBanana — Patent Diagram Generation Microservice.

FastAPI application entry-point.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.routes.diagrams import router as diagrams_router
from app.routes.health import router as health_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Startup / shutdown lifecycle hook."""
    settings = get_settings()

    # Ensure the local output directory exists when in local storage mode.
    if settings.storage_mode == "local":
        output_dir = Path(settings.local_storage_path)
        output_dir.mkdir(parents=True, exist_ok=True)
        logger.info("Local storage directory ready: %s", output_dir.resolve())

    logger.info(
        "PaperBanana service started (storage_mode=%s)",
        settings.storage_mode,
    )
    yield
    logger.info("PaperBanana service shutting down")


app = FastAPI(
    title="PaperBanana — Patent Diagram Service",
    description=(
        "AI-powered microservice for generating patent-style technical "
        "diagrams and converting hand-drawn sketches into clean illustrations."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------

settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(health_router)
app.include_router(diagrams_router)

# ---------------------------------------------------------------------------
# Static file serving (local storage mode)
# ---------------------------------------------------------------------------

if settings.storage_mode == "local":
    _output_dir = Path(settings.local_storage_path)
    _output_dir.mkdir(parents=True, exist_ok=True)
    app.mount(
        "/static/output",
        StaticFiles(directory=str(_output_dir)),
        name="output",
    )
