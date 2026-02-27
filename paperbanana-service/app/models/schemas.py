"""Pydantic request / response schemas for the diagram API."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class DiagramGenerateRequest(BaseModel):
    """Body for POST /api/v1/diagrams/generate."""

    source_context: str = Field(
        ...,
        min_length=1,
        max_length=10_000,
        description="Technical description of the invention or system to diagram.",
    )
    communicative_intent: str = Field(
        ...,
        min_length=1,
        max_length=2_000,
        description="What the diagram should communicate (e.g. 'Show the data flow between microservices').",
    )
    diagram_type: str = Field(
        default="methodology",
        description="Type of diagram: methodology, architecture, flowchart, block, sequence.",
    )
    style: str = Field(
        default="patent_bw",
        description="Visual style: patent_bw (black & white line art), technical, schematic.",
    )
    gemini_api_key: str | None = Field(
        default=None,
        description="Optional per-request Gemini API key. Falls back to server-level key.",
    )


class SketchConvertRequest(BaseModel):
    """Metadata that accompanies the uploaded sketch image in a multipart form."""

    description: str = Field(
        default="",
        max_length=5_000,
        description="Optional description of what the sketch represents.",
    )
    gemini_api_key: str | None = Field(
        default=None,
        description="Optional per-request Gemini API key.",
    )


class DiagramResponse(BaseModel):
    """Unified response returned after diagram generation or sketch conversion."""

    image_url: str = Field(..., description="URL where the generated image can be retrieved.")
    image_id: str = Field(..., description="Unique identifier for the image (UUID).")
    filename: str = Field(..., description="Stored filename on disk or in S3.")
    mime_type: str = Field(default="image/png", description="MIME type of the image.")
    size_bytes: int = Field(..., ge=0, description="Size of the image in bytes.")
    metadata: dict[str, Any] = Field(
        default_factory=dict,
        description="Extra metadata: prompt used, model version, diagram_type, etc.",
    )
