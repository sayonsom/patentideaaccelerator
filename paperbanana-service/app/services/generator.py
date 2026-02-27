"""Diagram generation service powered by the Gemini API.

This module calls Gemini directly for both text reasoning (diagram
description) and image generation (Imagen via Gemini).  When the
PaperBanana library is verified on PyPI we can swap the internals
without changing the public interface.
"""

from __future__ import annotations

import io
import logging
from typing import Any

from PIL import Image

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Prompt templates
# ---------------------------------------------------------------------------

_PATENT_STYLE_INSTRUCTIONS = (
    "Generate a black-and-white technical line drawing suitable for a "
    "patent application. Use numbered reference elements (100, 200, 300 etc). "
    "Clean professional illustration style with labeled components. "
    "No shading or gradients. All text labels should be clear and legible. "
    "Use solid black lines on a white background."
)

_DIAGRAM_TYPE_HINTS: dict[str, str] = {
    "methodology": "Show a step-by-step process flow with numbered method steps in boxes connected by arrows.",
    "architecture": "Show a system architecture with numbered components, data stores, and interconnections.",
    "flowchart": "Show a decision flowchart with numbered decision diamonds and process rectangles.",
    "block": "Show a block diagram with numbered functional modules and signal/data flow arrows.",
    "sequence": "Show a sequence diagram with numbered interaction steps between system entities.",
}

_SKETCH_CONVERSION_PROMPT = (
    "You are looking at a hand-drawn sketch of a technical diagram. "
    "Create a clean, professional black-and-white patent-style technical "
    "drawing that faithfully represents the same architecture / flow shown "
    "in the sketch. Use numbered reference elements (100, 200, 300 etc). "
    "No shading or gradients. All text labels should be clear and legible."
)


def _build_generation_prompt(
    source_context: str,
    communicative_intent: str,
    diagram_type: str,
    style: str,
) -> str:
    """Assemble the full prompt sent to Gemini for diagram generation."""
    type_hint = _DIAGRAM_TYPE_HINTS.get(diagram_type, _DIAGRAM_TYPE_HINTS["methodology"])

    parts = [
        _PATENT_STYLE_INSTRUCTIONS,
        "",
        f"Diagram type guidance: {type_hint}",
        "",
        f"Technical context:\n{source_context}",
        "",
        f"Communicative intent (what the diagram should convey):\n{communicative_intent}",
    ]

    if style != "patent_bw":
        parts.append(f"\nAdditional style note: {style}")

    return "\n".join(parts)


# ---------------------------------------------------------------------------
# Public service functions
# ---------------------------------------------------------------------------


async def generate_diagram(
    source_context: str,
    communicative_intent: str,
    diagram_type: str = "methodology",
    style: str = "patent_bw",
    api_key: str | None = None,
) -> tuple[bytes, dict[str, Any]]:
    """Generate a patent-style diagram and return ``(png_bytes, metadata)``.

    Raises ``RuntimeError`` when the Gemini API is unavailable or the
    key is missing.
    """
    try:
        import google.generativeai as genai
    except ImportError as exc:
        raise RuntimeError(
            "google-generativeai is not installed. "
            "Run: pip install google-generativeai"
        ) from exc

    if not api_key:
        raise RuntimeError("A Gemini API key is required for diagram generation.")

    genai.configure(api_key=api_key)

    prompt = _build_generation_prompt(source_context, communicative_intent, diagram_type, style)
    metadata: dict[str, Any] = {
        "diagram_type": diagram_type,
        "style": style,
        "prompt_length": len(prompt),
    }

    # Step 1 — Ask Gemini to reason about the diagram layout.
    text_model = genai.GenerativeModel("gemini-2.0-flash")
    description_prompt = (
        "You are a patent illustrator assistant. Given the following request, "
        "describe in detail what a patent-style technical diagram should look like. "
        "List every numbered component (100, 200, 300 ...), connections, labels, "
        "and layout. Be very specific.\n\n"
        f"{prompt}"
    )

    try:
        description_response = await _async_generate_content(text_model, description_prompt)
        diagram_description = description_response.text
        metadata["diagram_description"] = diagram_description
    except Exception:
        logger.exception("Gemini text generation failed")
        diagram_description = prompt  # Fallback — use the raw prompt

    # Step 2 — Generate the image via Gemini's image generation model.
    image_bytes = await _generate_image(genai, diagram_description, api_key)
    metadata["model"] = "gemini-2.0-flash"

    return image_bytes, metadata


async def convert_sketch(
    sketch_bytes: bytes,
    description: str = "",
    api_key: str | None = None,
) -> tuple[bytes, dict[str, Any]]:
    """Convert a hand-drawn sketch into a clean patent diagram.

    Returns ``(png_bytes, metadata)``.
    """
    try:
        import google.generativeai as genai
    except ImportError as exc:
        raise RuntimeError(
            "google-generativeai is not installed. "
            "Run: pip install google-generativeai"
        ) from exc

    if not api_key:
        raise RuntimeError("A Gemini API key is required for sketch conversion.")

    genai.configure(api_key=api_key)

    metadata: dict[str, Any] = {"mode": "sketch_conversion"}

    # Load the sketch into a PIL Image for Gemini vision.
    sketch_image = Image.open(io.BytesIO(sketch_bytes))

    # Step 1 — Vision pass: understand the sketch.
    vision_model = genai.GenerativeModel("gemini-2.0-flash")
    vision_prompt = (
        f"{_SKETCH_CONVERSION_PROMPT}\n\n"
        f"Additional context from the user: {description}" if description else _SKETCH_CONVERSION_PROMPT
    )

    try:
        vision_response = await _async_generate_content(vision_model, [vision_prompt, sketch_image])
        understood = vision_response.text
        metadata["sketch_analysis"] = understood
    except Exception:
        logger.exception("Gemini vision analysis failed")
        understood = description or "Technical diagram"

    # Step 2 — Generate clean patent diagram based on analysis.
    generation_prompt = (
        f"{_PATENT_STYLE_INSTRUCTIONS}\n\n"
        f"Based on this analysis of a hand-drawn sketch, create a clean patent diagram:\n{understood}"
    )

    image_bytes = await _generate_image(genai, generation_prompt, api_key)
    metadata["model"] = "gemini-2.0-flash"

    return image_bytes, metadata


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


async def _async_generate_content(model: Any, prompt: Any) -> Any:
    """Wrapper that calls ``model.generate_content`` in async-friendly way.

    google-generativeai's ``generate_content`` is synchronous, so we run
    it via ``asyncio.to_thread`` to avoid blocking the event loop.
    """
    import asyncio

    return await asyncio.to_thread(model.generate_content, prompt)


async def _generate_image(genai: Any, prompt: str, api_key: str) -> bytes:
    """Generate an image using Gemini's image generation capabilities.

    Tries Imagen 3 first.  If unavailable, falls back to creating a
    placeholder diagram so the rest of the pipeline can be tested.
    """
    import asyncio

    full_prompt = (
        f"{_PATENT_STYLE_INSTRUCTIONS}\n\n"
        f"Create this diagram:\n{prompt}"
    )

    try:
        # Try using Gemini 2.0 Flash with image generation
        model = genai.GenerativeModel("gemini-2.0-flash-exp-image-generation")
        response = await asyncio.to_thread(
            model.generate_content,
            full_prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="image/png",
            ),
        )

        # Extract image bytes from response
        if hasattr(response, "candidates") and response.candidates:
            for part in response.candidates[0].content.parts:
                if hasattr(part, "inline_data") and part.inline_data:
                    return part.inline_data.data

    except Exception:
        logger.warning(
            "Gemini image generation model unavailable, falling back to placeholder",
            exc_info=True,
        )

    # Fallback — generate a placeholder PNG with the description text.
    return _create_placeholder_image(prompt)


def _create_placeholder_image(description: str) -> bytes:
    """Create a simple placeholder PNG with wrapped description text.

    This ensures callers always receive valid image bytes even when the
    Gemini image generation model is not available.
    """
    width, height = 1200, 900
    img = Image.new("RGB", (width, height), "white")

    try:
        from PIL import ImageDraw, ImageFont

        draw = ImageDraw.Draw(img)

        # Border
        draw.rectangle([10, 10, width - 10, height - 10], outline="black", width=2)

        # Title
        draw.text(
            (width // 2, 40),
            "PATENT DIAGRAM — PLACEHOLDER",
            fill="black",
            anchor="mt",
        )
        draw.line([(50, 65), (width - 50, 65)], fill="black", width=1)

        # Wrap description text
        max_chars_per_line = 90
        lines: list[str] = []
        for paragraph in description[:2000].split("\n"):
            while len(paragraph) > max_chars_per_line:
                split_at = paragraph[:max_chars_per_line].rfind(" ")
                if split_at == -1:
                    split_at = max_chars_per_line
                lines.append(paragraph[:split_at])
                paragraph = paragraph[split_at:].lstrip()
            lines.append(paragraph)

        y = 85
        for line in lines[:45]:  # cap at 45 lines
            draw.text((60, y), line, fill="black")
            y += 18

        # Footer
        draw.text(
            (width // 2, height - 30),
            "[Generated by PaperBanana Service — Gemini image model not available]",
            fill="gray",
            anchor="mb",
        )

    except Exception:
        logger.warning("Could not draw text on placeholder image", exc_info=True)

    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return buffer.getvalue()
