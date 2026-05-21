"""
Karigar AI -- Shared Firebase initialization.
Import `db` from this module anywhere you need Firestore access.
"""

import firebase_admin
from firebase_admin import credentials, firestore
from pathlib import Path
from config import settings

_app = None
_db = None


def _ensure_init():
    global _app, _db
    if _app is not None:
        return

    # If Firebase was already initialized (e.g. by main.py lifespan), reuse it
    try:
        _app = firebase_admin.get_app()
    except ValueError:
        sa_path = Path(settings.firebase_service_account_path)
        if not sa_path.exists():
            raise FileNotFoundError(
                f"Firebase service account not found at {sa_path.resolve()}"
            )
        cred = credentials.Certificate(str(sa_path))
        _app = firebase_admin.initialize_app(cred, {
            "projectId": settings.firebase_project_id,
        })

    _db = firestore.client()


def get_db():
    """Return a Firestore client, initializing Firebase if needed."""
    _ensure_init()
    return _db


# Convenience: import db directly
class _LazyDB:
    """Lazy proxy so `from firebase_init import db` works at import time."""
    def __getattr__(self, name):
        return getattr(get_db(), name)

db = _LazyDB()
