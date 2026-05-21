"""
Karigar AI -- 8-factor provider scoring system.
Ranks providers based on specialization, reliability, proximity, and budget fit.
"""

import math
import os

import googlemaps
from config import settings


# ---------------------------------------------------------------------------
# Travel-time estimation
# ---------------------------------------------------------------------------

def get_travel_time_estimate(
    provider_lat: float,
    provider_lng: float,
    user_lat: float,
    user_lng: float,
) -> int:
    """Return estimated travel time in minutes.

    Uses the Google Maps Distance Matrix API when a key is available,
    otherwise falls back to a Haversine straight-line estimate at 30 km/h.
    """
    api_key = settings.google_maps_api_key

    # --- Try real Maps API first ---
    if api_key:
        try:
            gmaps = googlemaps.Client(key=api_key)
            result = gmaps.distance_matrix(
                origins=[(provider_lat, provider_lng)],
                destinations=[(user_lat, user_lng)],
                mode="driving",
            )
            duration_sec = (
                result["rows"][0]["elements"][0]["duration"]["value"]
            )
            return max(1, int(duration_sec / 60))
        except Exception:
            pass  # Fall through to estimate

    # --- Haversine fallback ---
    R = 6371  # Earth radius in km
    lat1, lat2 = math.radians(provider_lat), math.radians(user_lat)
    dlat = math.radians(user_lat - provider_lat)
    dlng = math.radians(user_lng - provider_lng)

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin(dlng / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance_km = R * c

    avg_speed_kmh = 30  # city traffic average
    travel_min = (distance_km / avg_speed_kmh) * 60
    return max(1, int(travel_min))


# ---------------------------------------------------------------------------
# 8-factor scoring
# ---------------------------------------------------------------------------

WEIGHTS = {
    "specialization_match": 0.25,
    "on_time_rate":         0.20,
    "rating_score":         0.15,
    "travel_time_score":    0.15,
    "availability_score":   0.10,
    "cancellation_penalty": 0.10,
    "review_recency_score": 0.03,
    "budget_fit_score":     0.02,
}


def calculate_provider_score(provider: dict, request: dict) -> dict:
    """Score a provider against a service request.

    Parameters
    ----------
    provider : dict   -- a Firestore provider document
    request  : dict   -- incoming request with keys like
                         service_type, budget, lat, lng, travel_minutes

    Returns
    -------
    dict with total, breakdown, rank_reason_en, rank_reason_urdu
    """

    # 1. Specialization match
    req_service = request.get("service_type", "")
    prov_services = provider.get("service_types", [])
    if req_service in prov_services:
        spec = 1.0
    elif any(req_service.split("_")[0] in s for s in prov_services):
        spec = 0.5
    else:
        spec = 0.0

    # 2. On-time rate
    on_time = provider.get("on_time_rate", 0.5)

    # 3. Rating
    rating = provider.get("rating", 3.0) / 5.0

    # 4. Travel time
    travel_minutes = request.get("travel_minutes")
    if travel_minutes is None:
        user_lat = request.get("lat")
        user_lng = request.get("lng")
        if user_lat and user_lng:
            travel_minutes = get_travel_time_estimate(
                provider.get("lat", 0),
                provider.get("lng", 0),
                user_lat,
                user_lng,
            )
        else:
            travel_minutes = 15  # default assumption
    travel = max(0.0, 1.0 - (travel_minutes / 60))

    # 5. Availability
    active = provider.get("active_bookings", 0)
    max_daily = provider.get("max_daily_bookings", 6)
    avail = 1.0 if active < max_daily else 0.0

    # 6. Cancellation penalty
    cancel = 1.0 - provider.get("cancellation_rate_30d", 0.0)

    # 7. Review recency
    recency = min(1.0, provider.get("reviews_this_week", 0) / 5)

    # 8. Budget fit
    budget = request.get("budget", 99999)
    base_rate = provider.get("base_rate_pkr", 0)
    if base_rate <= budget:
        budget_fit = 1.0
    elif base_rate <= budget * 1.3:
        budget_fit = 0.5
    else:
        budget_fit = 0.0

    breakdown = {
        "specialization_match": spec,
        "on_time_rate":         on_time,
        "rating_score":         rating,
        "travel_time_score":    travel,
        "availability_score":   avail,
        "cancellation_penalty": cancel,
        "review_recency_score": recency,
        "budget_fit_score":     budget_fit,
    }

    total = sum(WEIGHTS[k] * breakdown[k] for k in WEIGHTS)

    # --- Human-readable reason ---
    top_factors = sorted(breakdown.items(), key=lambda x: x[1], reverse=True)[:3]
    reason_parts_en = []
    reason_parts_ur = []
    factor_labels = {
        "specialization_match": ("high specialization",       "behtreen maharat"),
        "on_time_rate":         ("excellent punctuality",     "behtreen waqt ki paabandi"),
        "rating_score":         ("top rating",                "aaala darjabandi"),
        "travel_time_score":    ("nearby location",           "qareeb maqam"),
        "availability_score":   ("immediate availability",    "fori dastiyaabi"),
        "cancellation_penalty": ("low cancellations",         "kam mansookhi"),
        "review_recency_score": ("recent positive reviews",   "haaliya muthbet jaize"),
        "budget_fit_score":     ("within budget",             "bajet mein"),
    }
    for factor_name, _ in top_factors:
        en, ur = factor_labels[factor_name]
        reason_parts_en.append(en)
        reason_parts_ur.append(ur)

    cancel_pct = int(provider.get("cancellation_rate_30d", 0) * 100)

    return {
        "total": round(total, 3),
        "breakdown": breakdown,
        "rank_reason_en":   f"Recommended because: {' + '.join(reason_parts_en)}",
        "rank_reason_urdu": f"Tajweez kardah kyunke: {' + '.join(reason_parts_ur)}",
    }
