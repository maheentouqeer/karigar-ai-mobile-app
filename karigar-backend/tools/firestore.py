"""
Karigar AI -- Firestore helper functions.
All reads/writes to Firestore go through this module.
"""

import random
import time
from firebase_admin import firestore as fs
from firebase_init import get_db


# ---------------------------------------------------------------------------
# Providers
# ---------------------------------------------------------------------------

def get_all_providers() -> list:
    """Return all active providers."""
    db = get_db()
    docs = db.collection("providers").where("active", "==", True).stream()
    return [doc.to_dict() for doc in docs]


def get_providers_by_service(service_type: str, area: str = None) -> list:
    """Return active providers whose service_types array contains *service_type*.
    Optionally filter by area.
    """
    db = get_db()
    query = (
        db.collection("providers")
        .where("active", "==", True)
        .where("service_types", "array_contains", service_type)
    )
    if area:
        query = query.where("area", "==", area)
    docs = query.stream()
    results = [doc.to_dict() for doc in docs]

    # Tutoring must never return AC/cooling providers
    st = (service_type or "").lower()
    if st == "tutoring":
        filtered = []
        for p in results:
            types = p.get("service_types") or []
            joined = " ".join(str(t).lower() for t in types)
            if any(x in joined for x in ("ac", "cooling", "air condition", "aircondition")):
                continue
            if any(x in joined for x in ("tutor", "teach", "education", "academy", "ustad")) or not types:
                filtered.append(p)
        return filtered

    return results


# ---------------------------------------------------------------------------
# Bookings
# ---------------------------------------------------------------------------

def check_calendar_conflict(provider_id: str, slot_time: str) -> bool:
    """Return True if *provider_id* already has a non-cancelled booking at *slot_time*."""
    db = get_db()
    docs = (
        db.collection("bookings")
        .where("provider_id", "==", provider_id)
        .where("slot_time", "==", slot_time)
        .stream()
    )
    for doc in docs:
        data = doc.to_dict()
        if data.get("status") != "cancelled":
            return True
    return False


def write_booking(provider_id: str, service_type: str, slot_time: str, price: int) -> str:
    """Write a booking document and return the generated booking_id."""
    db = get_db()
    ts = int(time.time())
    rand = random.randint(1000, 9999)
    booking_id = f"KAI-{ts}-{rand}"

    booking_data = {
        "provider_id": provider_id,
        "service_type": service_type,
        "slot_time": slot_time,
        "price": price,
        "booking_id": booking_id,
        "status": "confirmed",
        "created_at": fs.SERVER_TIMESTAMP,
    }

    db.collection("bookings").document(booking_id).set(booking_data)
    return booking_id


def get_booking(booking_id: str) -> dict:
    """Retrieve a single booking by its ID."""
    db = get_db()
    doc = db.collection("bookings").document(booking_id).get()
    if doc.exists:
        return doc.to_dict()
    return {}


def update_booking_status(booking_id: str, status: str):
    """Update the status of a booking."""
    db = get_db()
    update = {"status": status, "updated_at": fs.SERVER_TIMESTAMP}
    db.collection("bookings").document(booking_id).update(update)


# ---------------------------------------------------------------------------
# Provider trust / reputation
# ---------------------------------------------------------------------------

def update_provider_trust_score(provider_id: str, score_change: float) -> float | None:
    """Increment (or decrement) a provider's trust_score. Returns new score or None."""
    db = get_db()
    ref = db.collection("providers").document(provider_id)
    doc = ref.get()
    if not doc.exists:
        return None

    data = doc.to_dict()
    new_score = max(0, min(100, data.get("trust_score", 50) + score_change))

    ref.update({
        "trust_score": new_score,
        "updated_at": fs.SERVER_TIMESTAMP,
    })
    return new_score


# ---------------------------------------------------------------------------
# Receipt
# ---------------------------------------------------------------------------

def generate_receipt(booking: dict) -> dict:
    """Build a human-readable receipt dict from a completed booking."""
    ts = int(time.time())
    receipt_number = f"RCP-{ts}"

    base = booking.get("base_rate", 0)
    distance = booking.get("distance_charge", 0)
    urgency = booking.get("urgency_surcharge", 0)
    discount = booking.get("negotiation_discount", 0)
    total = base + distance + urgency - discount

    provider_name = booking.get("provider_name", "N/A")
    service_type = booking.get("service_type", "N/A")

    return {
        "booking_id": booking.get("booking_id", ""),
        "provider_name": provider_name,
        "service_type": service_type,
        "date": booking.get("date", ""),
        "time": booking.get("time", ""),
        "location": booking.get("location", ""),
        "price_breakdown": {
            "base_rate": base,
            "distance_charge": distance,
            "urgency_surcharge": urgency,
            "negotiation_discount": discount,
            "total": total,
        },
        "receipt_number": receipt_number,
        "urdu_summary": f"bukking tasdeeq: {provider_name} - {service_type} - Rs{total}",
    }
