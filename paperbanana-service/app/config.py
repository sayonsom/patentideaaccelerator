"""Application configuration loaded from environment variables."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv

load_dotenv()


def _parse_cors_origins() -> list[str]:
    raw = os.getenv("CORS_ORIGINS", "http://localhost:3000")
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


@dataclass(frozen=True)
class Settings:
    """Immutable application settings derived from environment variables."""

    gemini_api_key: str = field(
        default_factory=lambda: os.getenv("GEMINI_API_KEY", "")
    )
    aws_s3_bucket: str = field(
        default_factory=lambda: os.getenv("AWS_S3_BUCKET", "ipramp-patent-images")
    )
    aws_region: str = field(
        default_factory=lambda: os.getenv("AWS_REGION", "us-east-1")
    )
    aws_access_key_id: str = field(
        default_factory=lambda: os.getenv("AWS_ACCESS_KEY_ID", "")
    )
    aws_secret_access_key: str = field(
        default_factory=lambda: os.getenv("AWS_SECRET_ACCESS_KEY", "")
    )
    storage_mode: Literal["local", "s3"] = field(
        default_factory=lambda: os.getenv("STORAGE_MODE", "local")  # type: ignore[return-value]
    )
    local_storage_path: str = field(
        default_factory=lambda: os.getenv("LOCAL_STORAGE_PATH", "./output")
    )
    cors_origins: list[str] = field(default_factory=_parse_cors_origins)

    @property
    def local_storage_dir(self) -> Path:
        return Path(self.local_storage_path)


def get_settings() -> Settings:
    """Factory that returns a fresh Settings instance."""
    return Settings()
