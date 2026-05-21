"""
Karigar AI — Configuration Module
Loads environment variables from .env and exports them as a typed Settings class.
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic import Field
from pydantic_settings import BaseSettings

# Load .env from the same directory as this file
_env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=_env_path)


class Settings(BaseSettings):
    """Typed application settings — populated from environment variables."""

    # ── Google Cloud ──────────────────────────────────────────────
    google_cloud_project: str = Field(default="karigar-ai-496514")
    google_application_credentials: str = Field(default="./firebase-service-account.json")
    google_cloud_region: str = Field(default="us-central1")

    # ── Firebase ──────────────────────────────────────────────────
    firebase_project_id: str = Field(default="karigai-ai")
    firebase_service_account_path: str = Field(default="./firebase-service-account.json")

    # ── Google Maps ───────────────────────────────────────────────
    google_maps_api_key: str = Field(default="")
    google_stt_language: str = Field(default="ur-PK")
    google_tts_language: str = Field(default="ur-PK")

    # ── Vertex AI ─────────────────────────────────────────────────
    vertex_ai_project: str = Field(default="karigar-ai-496514")
    vertex_ai_location: str = Field(default="us-central1")
    gemini_model_flash: str = Field(default="gemini-2.5-flash")
    gemini_model_pro: str = Field(default="gemini-2.5-pro")

    # ── Server ────────────────────────────────────────────────────
    port: int = Field(default=8000)
    cors_origin: str = Field(default="http://localhost:8081")

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
        "extra": "ignore"
    }


# Singleton instance — import this everywhere
settings = Settings()
