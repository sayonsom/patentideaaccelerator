"""Diagram generation and retrieval endpoints."""

from __future__ import annotations

import logging
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse

from app.config import Settings, get_settings
from app.models.schemas import DiagramGenerateRequest, DiagramResponse
from app.services.generator import convert_sketch, generate_diagram
from app.services.storage import StorageService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/diagrams", tags=["diagrams"])

# Maximum upload size: 10 MB
_MAX_UPLOAD_BYTES = 10 * 1024 * 1024
_ALLOWED_IMAGE_TYPES = {"image/png", "image/jpeg", "image/webp", "image/gif"}


def _get_storage(settings: Annotated[Settings, Depends(get_settings)]) -> StorageService:
    return StorageService(settings)


def _resolve_api_key(per_request_key: str | None, settings: Settings) -> str:
    """Return the Gemini key to use, preferring the per-request value."""
    key = per_request_key or settings.gemini_api_key
    if not key:
        raise HTTPException(
            status_code=422,
            detail=(
                "No Gemini API key available. Provide one in the request body "
                "(gemini_api_key) or set the GEMINI_API_KEY environment variable."
            ),
        )
    return key


# ------------------------------------------------------------------
# POST /api/v1/diagrams/generate
# ------------------------------------------------------------------

@router.post("/generate", response_model=DiagramResponse, status_code=201)
async def generate_diagram_endpoint(
    body: DiagramGenerateRequest,
    settings: Annotated[Settings, Depends(get_settings)],
    storage: Annotated[StorageService, Depends(_get_storage)],
) -> DiagramResponse:
    """Generate a patent-style technical diagram from a text description."""

    api_key = _resolve_api_key(body.gemini_api_key, settings)

    try:
        image_bytes, metadata = await generate_diagram(
            source_context=body.source_context,
            communicative_intent=body.communicative_intent,
            diagram_type=body.diagram_type,
            style=body.style,
            api_key=api_key,
        )
    except RuntimeError as exc:
        logger.exception("Diagram generation failed")
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unexpected error during diagram generation")
        raise HTTPException(
            status_code=500,
            detail=f"Internal error during diagram generation: {exc}",
        ) from exc

    filename = f"patent-diagram-{uuid.uuid4().hex[:8]}.png"
    image_id, image_url = await storage.save_image(image_bytes, filename, "image/png")

    return DiagramResponse(
        image_url=image_url,
        image_id=image_id,
        filename=filename,
        mime_type="image/png",
        size_bytes=len(image_bytes),
        metadata=metadata,
    )


# ------------------------------------------------------------------
# POST /api/v1/diagrams/convert-sketch
# ------------------------------------------------------------------

@router.post("/convert-sketch", response_model=DiagramResponse, status_code=201)
async def convert_sketch_endpoint(
    file: Annotated[UploadFile, File(description="Hand-drawn sketch image to convert")],
    settings: Annotated[Settings, Depends(get_settings)],
    storage: Annotated[StorageService, Depends(_get_storage)],
    description: Annotated[str, Form()] = "",
    gemini_api_key: Annotated[str | None, Form()] = None,
) -> DiagramResponse:
    """Convert an uploaded hand-drawn sketch into a clean patent diagram."""

    # Validate upload
    if file.content_type and file.content_type not in _ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported image type '{file.content_type}'. Allowed: {_ALLOWED_IMAGE_TYPES}",
        )

    sketch_bytes = await file.read()
    if len(sketch_bytes) > _MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {_MAX_UPLOAD_BYTES // (1024 * 1024)} MB.",
        )

    if len(sketch_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    api_key = _resolve_api_key(gemini_api_key, settings)

    try:
        image_bytes, metadata = await convert_sketch(
            sketch_bytes=sketch_bytes,
            description=description,
            api_key=api_key,
        )
    except RuntimeError as exc:
        logger.exception("Sketch conversion failed")
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unexpected error during sketch conversion")
        raise HTTPException(
            status_code=500,
            detail=f"Internal error during sketch conversion: {exc}",
        ) from exc

    filename = f"patent-sketch-{uuid.uuid4().hex[:8]}.png"
    image_id, image_url = await storage.save_image(image_bytes, filename, "image/png")

    return DiagramResponse(
        image_url=image_url,
        image_id=image_id,
        filename=filename,
        mime_type="image/png",
        size_bytes=len(image_bytes),
        metadata=metadata,
    )


# ------------------------------------------------------------------
# GET /api/v1/diagrams/{image_id}
# ------------------------------------------------------------------

@router.get("/{image_id}")
async def get_diagram_image(
    image_id: str,
    storage: Annotated[StorageService, Depends(_get_storage)],
) -> FileResponse:
    """Retrieve a previously generated diagram image by its ID."""

    file_path = await storage.get_image_path(image_id)
    if file_path is None:
        raise HTTPException(status_code=404, detail=f"Image '{image_id}' not found.")

    return FileResponse(
        path=file_path,
        media_type="image/png",
        filename=f"{image_id}.png",
    )
