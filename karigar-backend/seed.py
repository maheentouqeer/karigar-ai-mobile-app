import os
import time
from pathlib import Path
from dotenv import load_dotenv

# Load env before any initialization
load_dotenv(".env")

from firebase_init import get_db

dummy_providers = [
    {
        "id": "prov-1",
        "name": "Tariq AC Services",
        "role": "AC Technician",
        "service_types": ["AC Repair", "AC Installation", "AC Servicing"],
        "rating": 4.8,
        "total_reviews": 112,
        "area": "G-13",
        "base_rate_pkr": 600,
        "trust_score": 92,
        "verified": True,
        "active": True,
        "cancellation_rate_30d": 2.1,
    },
    {
        "id": "prov-2",
        "name": "Ali Plumbers",
        "role": "Plumber",
        "service_types": ["Plumbing", "Pipe Leak", "Geyser Repair"],
        "rating": 4.5,
        "total_reviews": 45,
        "area": "F-8",
        "base_rate_pkr": 800,
        "trust_score": 85,
        "verified": True,
        "active": True,
        "cancellation_rate_30d": 5.4,
    },
    {
        "id": "prov-3",
        "name": "Iqbal Electrician",
        "role": "Electrician",
        "service_types": ["Electrical", "Wiring", "UPS Repair"],
        "rating": 4.2,
        "total_reviews": 29,
        "area": "G-9",
        "base_rate_pkr": 500,
        "trust_score": 76,
        "verified": False,
        "active": True,
        "cancellation_rate_30d": 10.0,
    }
]

def seed_db():
    db = get_db()
    
    # Write providers
    print("Seeding providers...")
    for p in dummy_providers:
        db.collection("providers").document(p["id"]).set(p)
    print("Done seeding providers.")

if __name__ == "__main__":
    seed_db()
