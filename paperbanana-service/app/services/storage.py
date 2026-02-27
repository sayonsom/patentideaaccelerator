"""Storage service — persists generated images to local disk or AWS S3."""

from __future__ import annotations

import logging
import uuid
from pathlib import Path
from typing import TYPE_CHECKING

import boto3
from botocore.exceptions import ClientError

if TYPE_CHECKING:
    from app.config import Settings

logger = logging.getLogger(__name__)


class StorageService:
    """Handles image persistence for both local and S3 storage modes."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._s3_client: boto3.client | None = None

        if settings.storage_mode == "s3":
            self._s3_client = boto3.client(
                "s3",
                region_name=settings.aws_region,
                aws_access_key_id=settings.aws_access_key_id or None,
                aws_secret_access_key=settings.aws_secret_access_key or None,
            )

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def save_image(
        self,
        image_bytes: bytes,
        filename: str,
        content_type: str = "image/png",
    ) -> tuple[str, str]:
        """Persist *image_bytes* and return ``(image_id, url)``."""
        image_id = uuid.uuid4().hex

        if self._settings.storage_mode == "s3":
            return await self._save_to_s3(image_id, image_bytes, filename, content_type)
        return await self._save_to_local(image_id, image_bytes, filename)

    async def get_image_path(self, image_id: str) -> str | None:
        """Return the local filesystem path for *image_id*, or ``None``."""
        storage_dir = self._settings.local_storage_dir
        # Images are stored as <image_id>.png
        candidate = storage_dir / f"{image_id}.png"
        if candidate.exists():
            return str(candidate)

        # Also check with original extension pattern
        for path in storage_dir.iterdir():
            if path.stem == image_id:
                return str(path)

        return None

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _save_to_local(
        self,
        image_id: str,
        image_bytes: bytes,
        filename: str,
    ) -> tuple[str, str]:
        storage_dir = self._settings.local_storage_dir
        storage_dir.mkdir(parents=True, exist_ok=True)

        dest = storage_dir / f"{image_id}.png"
        dest.write_bytes(image_bytes)

        url = f"/api/v1/diagrams/{image_id}"
        logger.info("Saved image locally: %s (%d bytes)", dest, len(image_bytes))
        return image_id, url

    async def _save_to_s3(
        self,
        image_id: str,
        image_bytes: bytes,
        filename: str,
        content_type: str,
    ) -> tuple[str, str]:
        if self._s3_client is None:
            raise RuntimeError("S3 client not initialised — check AWS credentials.")

        key = f"diagrams/{image_id}/{filename}"
        bucket = self._settings.aws_s3_bucket

        try:
            self._s3_client.put_object(
                Bucket=bucket,
                Key=key,
                Body=image_bytes,
                ContentType=content_type,
            )
        except ClientError as exc:
            logger.exception("Failed to upload to S3: %s", exc)
            raise RuntimeError(f"S3 upload failed: {exc}") from exc

        url = f"https://{bucket}.s3.{self._settings.aws_region}.amazonaws.com/{key}"
        logger.info("Uploaded image to S3: %s (%d bytes)", url, len(image_bytes))
        return image_id, url
