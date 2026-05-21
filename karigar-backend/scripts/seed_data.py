"""
Karigar AI — Firestore Seed Script
Populates the 'providers' collection with 30 mock providers across 6 categories.
"""

import os
import sys
import random
from pathlib import Path

import firebase_admin
from firebase_admin import credentials, firestore

# ── Firebase Init ─────────────────────────────────────────────────
SA_PATH = Path(__file__).resolve().parent.parent / "firebase-service-account.json"

if not SA_PATH.exists():
    print(f"❌ Service account not found: {SA_PATH}")
    sys.exit(1)

cred = credentials.Certificate(str(SA_PATH))
app = firebase_admin.initialize_app(cred)
db = firestore.client()

print("Firebase connected\n")

# ── Helpers ───────────────────────────────────────────────────────
random.seed(42)  # reproducible randomness

SLOTS = ["09:00", "11:00", "14:00", "17:00", "19:00"]


def phone():
    return f"0300-{random.randint(1000000, 9999999)}"


def trust(rating, on_time, cancel):
    return int((rating / 5) * 40 + on_time * 40 + (1 - cancel) * 20)


# ── Provider Data ─────────────────────────────────────────────────
PROVIDERS = [
    # ── AC_repair ─────────────────────────────────────────────────
    ("Ali Ahmad AC Services",    "AC_repair",  "G-13", 33.6844, 73.0479, 800,  4.8, 0.91, 0.04, "Split AC installation & repair"),
    ("Tariq Cooling Solutions",  "AC_repair",  "G-10", 33.6938, 73.0651, 750,  4.5, 0.85, 0.12, "Window AC servicing"),
    ("Hassan AC Expert",         "AC_repair",  "F-8",  33.7215, 73.0423, 900,  4.9, 0.95, 0.02, "Inverter AC specialist"),
    ("Bilal Refrigeration",      "AC_repair",  "G-11", 33.6891, 73.0558, 700,  4.2, 0.78, 0.28, "Refrigeration & AC gas refill"),
    ("Usman AC Center",          "AC_repair",  "F-10", 33.7089, 73.0612, 850,  4.6, 0.88, 0.06, "Central AC maintenance"),

    # ── plumbing ──────────────────────────────────────────────────
    ("Rashid Plumbing Works",    "plumbing",   "G-9",  33.6997, 73.0734, 600,  4.7, 0.92, 0.03, "Pipe fitting & leak repair"),
    ("Kamran Pipes Expert",      "plumbing",   "G-13", 33.6821, 73.0502, 550,  4.3, 0.80, 0.15, "Water tank installation"),
    ("Zubair Water Solutions",   "plumbing",   "F-7",  33.7298, 73.0367, 650,  4.6, 0.89, 0.05, "Water filtration systems"),
    ("Adeel Plumber",            "plumbing",   "G-6",  33.7156, 73.0789, 500,  3.9, 0.71, 0.33, "General plumbing"),
    ("Imran Drainage",           "plumbing",   "G-8",  33.7034, 73.0698, 580,  4.4, 0.86, 0.08, "Drainage & sewage"),

    # ── electrical ────────────────────────────────────────────────
    ("Shahid Electric Co",       "electrical", "G-13", 33.6852, 73.0467, 700,  4.7, 0.90, 0.04, "House wiring & panel boards"),
    ("Naeem Wiring Expert",      "electrical", "G-11", 33.6908, 73.0571, 650,  4.5, 0.84, 0.10, "Commercial wiring"),
    ("Faisal Electrician",       "electrical", "F-8",  33.7189, 73.0445, 750,  4.8, 0.93, 0.03, "UPS & solar installation"),
    ("Asif Electric",            "electrical", "G-10", 33.6945, 73.0634, 600,  4.1, 0.76, 0.22, "Basic electrical repairs"),
    ("Hamid Power Solutions",    "electrical", "F-10", 33.7067, 73.0589, 800,  4.6, 0.87, 0.07, "Generator & inverter service"),

    # ── tutoring ──────────────────────────────────────────────────
    ("Sara Math Tutor",          "tutoring",   "G-13", 33.6867, 73.0489, 400,  4.9, 0.97, 0.01, "O/A-Level Mathematics"),
    ("Ahmed Science Expert",     "tutoring",   "G-9",  33.7012, 73.0712, 500,  4.7, 0.94, 0.03, "Physics & Chemistry"),
    ("Fatima English Tutor",     "tutoring",   "F-8",  33.7201, 73.0412, 450,  4.8, 0.96, 0.02, "English language & literature"),
    ("Zainab Home Tutor",        "tutoring",   "G-11", 33.6923, 73.0545, 350,  4.5, 0.91, 0.05, "Primary education"),
    ("Omer Physics Tutor",       "tutoring",   "F-10", 33.7078, 73.0601, 600,  4.6, 0.93, 0.04, "FSc & BSc Physics"),

    # ── beautician ────────────────────────────────────────────────
    ("Mehwish Beauty Parlour",   "beautician", "G-13", 33.6839, 73.0512, 1000, 4.8, 0.89, 0.06, "Bridal & party makeup"),
    ("Hina Salon Expert",        "beautician", "G-10", 33.6956, 73.0623, 800,  4.6, 0.85, 0.09, "Hair styling & treatment"),
    ("Ayesha Beautician",        "beautician", "F-7",  33.7267, 73.0389, 1200, 4.9, 0.92, 0.03, "Skincare & facial treatments"),
    ("Nadia Home Beauty",        "beautician", "G-11", 33.6934, 73.0534, 700,  4.3, 0.79, 0.18, "Home beauty services"),
    ("Sana Makeup Artist",       "beautician", "G-9",  33.7023, 73.0723, 900,  4.5, 0.87, 0.07, "Professional makeup artist"),

    # ── mechanic ──────────────────────────────────────────────────
    ("Waqas Auto Workshop",      "mechanic",   "G-13", 33.6878, 73.0478, 800,  4.6, 0.88, 0.08, "Car engine & transmission"),
    ("Javed Car Expert",         "mechanic",   "G-10", 33.6967, 73.0645, 700,  4.4, 0.82, 0.14, "Suzuki & Toyota specialist"),
    ("Iqbal Mechanic",           "mechanic",   "F-8",  33.7178, 73.0434, 750,  4.7, 0.91, 0.05, "Brake & suspension repair"),
    ("Amir Auto Service",        "mechanic",   "G-11", 33.6912, 73.0556, 650,  4.1, 0.75, 0.25, "General auto repair"),
    ("Raza Workshop",            "mechanic",   "G-9",  33.7001, 73.0701, 900,  4.8, 0.94, 0.03, "AC & electrical diagnostics"),
]

# ── Seed Firestore ────────────────────────────────────────────────
collection = db.collection("providers")
written = 0

for idx, (name, category, area, lat, lng, rate, rating, on_time, cancel, spec) in enumerate(PROVIDERS, start=1):
    doc_id = f"prov_{idx:03d}"

    # Stress-test: high cancellers are fully booked
    max_daily = 6
    if cancel > 0.20:
        active_bookings = max_daily
    else:
        active_bookings = random.randint(0, 4)

    doc = {
        "id": doc_id,
        "name": name,
        "service_types": [category],
        "area": area,
        "lat": lat,
        "lng": lng,
        "rating": rating,
        "total_reviews": random.randint(50, 200),
        "reviews_this_week": random.randint(1, 8),
        "on_time_rate": on_time,
        "cancellation_rate_30d": cancel,
        "base_rate_pkr": rate,
        "availability": {
            "slots": SLOTS,
        },
        "active_bookings": active_bookings,
        "max_daily_bookings": max_daily,
        "verified": True,
        "trust_score": trust(rating, on_time, cancel),
        "phone": phone(),
        "experience_years": random.randint(3, 15),
        "specialization": spec,
        "active": True,
        "created_at": firestore.SERVER_TIMESTAMP,
    }

    collection.document(doc_id).set(doc)
    print(f"  - {doc_id}: {name} ({category}, {area}) — trust={doc['trust_score']}")
    written += 1

print(f"\nDone! {written} providers written to Firestore 'providers' collection.")
