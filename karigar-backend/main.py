"""
Karigar AI — FastAPI Backend
Multi-agent AI system for Pakistan's informal home services market.
"""

import logging
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

import firebase_admin
from firebase_admin import credentials, firestore
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from firebase_init import get_db
from pydantic import BaseModel

from config import settings

# ── Logging ───────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s │ %(levelname)s │ %(message)s")
logger = logging.getLogger("karigar")

# ── Firebase ──────────────────────────────────────────────────────
_firebase_app: firebase_admin.App | None = None
_firestore_client = None


def _init_firebase() -> None:
    """Initialize Firebase Admin SDK using the service-account JSON."""
    global _firebase_app, _firestore_client

    sa_path = Path(settings.firebase_service_account_path)
    if not sa_path.exists():
        raise FileNotFoundError(
            f"Firebase service account not found at {sa_path.resolve()}. "
            "Set FIREBASE_SERVICE_ACCOUNT_PATH in .env."
        )

    cred = credentials.Certificate(str(sa_path))
    _firebase_app = firebase_admin.initialize_app(cred, {
        "projectId": settings.firebase_project_id,
    })
    _firestore_client = firestore.client()
    logger.info("✅ Firebase Admin SDK initialized  (project: %s)", settings.firebase_project_id)


def _verify_firebase() -> bool:
    """Quick Firestore connectivity check."""
    try:
        # Attempt a lightweight read to verify the connection
        _firestore_client.collection("_health").document("ping").get()
        return True
    except Exception as exc:
        logger.warning("⚠️  Firestore connectivity check failed: %s", exc)
        return True  # Non-fatal — SDK is still initialized


# ── Lifespan ──────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    logger.info("🚀 Starting Karigar AI backend …")
    _init_firebase()
    _verify_firebase()
    logger.info("🟢 Backend ready on port %s", settings.port)
    yield
    logger.info("🛑 Shutting down Karigar AI backend …")


# ── App ───────────────────────────────────────────────────────────
app = FastAPI(
    title="Karigar AI",
    description="Multi-agent AI backend for Pakistan's home services market",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — Expo dev (LAN, localhost, web)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://192.168.0.108:8081",
        "http://localhost:8081",
        "http://localhost:19006",
        "http://localhost:19000",
        "http://127.0.0.1:8081",
        "http://127.0.0.1:19006",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


from agent import run_agent
import asyncio
import time

@app.get("/health")
async def health_check():
    """Liveness / readiness probe."""
    return {
        "status": "ok",
        "project": "karigar-ai",
        "firebase": "connected" if _firebase_app else "disconnected",
    }

@app.post("/api/request")
async def handle_request(body: dict):
    try:
        metadata = {"location": body.get("location")}
        if body.get("service_type"):
            metadata["service_type_hint"] = body.get("service_type")
        result = await run_agent(
            user_message=body.get("message", ""),
            session_id=body.get("session_id", "default"),
            user_id=body.get("user_id", "anonymous"),
            metadata=metadata,
        )
        
        # Save interaction to Firestore
        try:
            db = get_db()
            session_id = body.get("session_id", "default")
            conv_ref = db.collection("conversations").document(session_id)
            conv_doc = conv_ref.get()
            
            new_interaction = {
                "timestamp": firestore.SERVER_TIMESTAMP,
                "user_message": body.get("message", ""),
                "ai_response_en": result.get("response_en", ""),
                "ai_response_urdu": result.get("response_urdu", ""),
                "trace_log": result.get("trace_log", [])
            }
            
            if conv_doc.exists:
                conv_ref.update({
                    "interactions": firestore.ArrayUnion([new_interaction]),
                    "updated_at": firestore.SERVER_TIMESTAMP
                })
            else:
                conv_ref.set({
                    "user_id": body.get("user_id", "anonymous"),
                    "created_at": firestore.SERVER_TIMESTAMP,
                    "updated_at": firestore.SERVER_TIMESTAMP,
                    "interactions": [new_interaction]
                })
        except Exception as fb_err:
            logger.error("Failed to sync to Firestore: %s", fb_err)
            
        return result
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        print("FULL ERROR:", error_detail)
        return {
            "error": str(e),
            "traceback": error_detail,
            "response_en": "Error occurred",
            "trace_log": []
        }

@app.post("/api/simulate/cancel/{booking_id}")
async def simulate_cancellation(booking_id: str):
    start = time.time()
    try:
        result = await run_agent(
            user_message=f"Provider cancelled booking {booking_id}. Run recovery.",
            session_id=f"recovery-{booking_id}",
            user_id="system"
        )
        result["recovery_time_ms"] = int((time.time() - start) * 1000)
        return result
    except Exception as e:
        import traceback
        return {"error": str(e), "trace": traceback.format_exc()}

from tools.firestore import get_all_providers, get_booking, update_provider_trust_score
from tools.voice_tools import transcribe_audio
from agent import root_agent
from fastapi import UploadFile, File

@app.get("/api/providers")
async def api_providers():
    return get_all_providers()

@app.get("/api/booking/{booking_id}")
async def api_booking(booking_id: str):
    return get_booking(booking_id)

@app.post("/api/booking/{booking_id}/dispute")
async def api_dispute(booking_id: str, body: dict):
    try:
        result = await run_agent(
            user_message=f"I want to dispute booking {booking_id}. Reason: {body.get('reason', 'Quality issues')}",
            session_id=f"dispute-{booking_id}",
            user_id=body.get("user_id", "system")
        )
        return result
    except Exception as e:
        import traceback
        return {"error": str(e), "trace": traceback.format_exc()}

@app.post("/api/voice/transcribe")
async def api_voice_transcribe(audio: UploadFile = File(...)):
    audio_bytes = await audio.read()
    result = transcribe_audio(audio_bytes)
    transcript = result.get("transcript", "") if isinstance(result, dict) else str(result)
    return {"text": transcript, "transcript": transcript, "confidence": result.get("confidence", 0) if isinstance(result, dict) else 0}

@app.get("/api/health/agents")
async def health_agents():
    return {"status": "ok", "agents": [agent.name for agent in root_agent.sub_agents]}

@app.get("/api/chat/history/{session_id}")
async def api_chat_history(session_id: str):
    db = get_db()
    doc = db.collection("conversations").document(session_id).get()
    if doc.exists:
        return doc.to_dict()
    return {"interactions": []}


@app.post("/api/provider/{provider_id}/review")
async def api_provider_review(provider_id: str, body: dict):
    """Update provider trust score from customer feedback."""
    rating = int(body.get("rating", 3))
    review_text = body.get("review", "")
    delta = 2 if rating >= 4 else (-3 if rating <= 2 else 0)
    new_score = update_provider_trust_score(provider_id, delta)
    return {
        "success": True,
        "provider_id": provider_id,
        "rating": rating,
        "review": review_text,
        "score_change": delta,
        "new_score": new_score,
    }


@app.get("/api/provider/{provider_id}/slots")
async def api_provider_slots(provider_id: str, date: str = None):
    """Available time slots for booking (demo schedule)."""
    from datetime import date as date_cls
    _ = date or date_cls.today().isoformat()
    return {
        "provider_id": provider_id,
        "slots": [
            {"time": "ASAP", "available": True},
            {"time": "Today 4:00 PM", "available": True},
            {"time": "Today 6:00 PM", "available": True},
            {"time": "Tomorrow Morning", "available": True},
            {"time": "Tomorrow 2:00 PM", "available": False},
        ],
    }


@app.get("/api/provider/requests")
async def api_provider_requests(provider_id: str = None):
    """Mock incoming job requests for provider dashboard."""
    requests = [
        {
            "id": "REQ-001",
            "service_type": "AC_repair",
            "location": "G-13, Street 45",
            "budget": 800,
            "urgency": 5,
            "minutes_ago": 2,
            "status": "pending",
        },
        {
            "id": "REQ-002",
            "service_type": "plumbing",
            "location": "F-10",
            "budget": 600,
            "urgency": 3,
            "minutes_ago": 18,
            "status": "pending",
        },
    ]
    if provider_id:
        return {"requests": requests, "provider_id": provider_id}
    return {"requests": requests}


@app.put("/api/users/{user_id}")
async def api_upsert_user(user_id: str, body: dict):
    """Optional Firestore user profile sync from mobile auth."""
    try:
        db = get_db()
        db.collection("users").document(user_id).set(
            {
                "name": body.get("name"),
                "email": body.get("email"),
                "role": body.get("role", "customer"),
                "address": body.get("address", ""),
                "updated_at": firestore.SERVER_TIMESTAMP,
            },
            merge=True,
        )
        return {"success": True, "user_id": user_id}
    except Exception as exc:
        logger.warning("User profile sync failed: %s", exc)
        return {"success": False, "error": str(exc)}
