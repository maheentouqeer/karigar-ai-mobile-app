"""
Karigar AI -- Dynamic pricing engine.
Calculates service price with urgency surcharge, distance, and loyalty discount.
"""


def calculate_dynamic_price(provider: dict, request: dict) -> dict:
    """Compute the total price for a service request.

    Parameters
    ----------
    provider : dict  -- provider document (needs base_rate_pkr)
    request  : dict  -- request with optional keys:
                        urgency (1-5), distance_km, returning_customer

    Returns
    -------
    dict with full price breakdown in English and Urdu
    """
    base = provider.get("base_rate_pkr", 0)

    # -- Urgency surcharge --
    urgency = request.get("urgency", 3)
    urgency_surcharge = 0
    if urgency >= 4:
        urgency_surcharge = base * 0.20   # same-day urgent
    if urgency == 5:
        urgency_surcharge = base * 0.30   # emergency

    # -- Distance charge --
    distance_km = request.get("distance_km", 5)
    distance_charge = max(0, (distance_km - 3) * 30)  # PKR 30/km after 3 km

    # -- Loyalty discount --
    loyalty_discount = 0
    if request.get("returning_customer"):
        loyalty_discount = base * 0.05

    subtotal = base + urgency_surcharge + distance_charge - loyalty_discount

    return {
        "base_rate": base,
        "urgency_surcharge": urgency_surcharge,
        "distance_charge": distance_charge,
        "loyalty_discount": loyalty_discount,
        "subtotal": subtotal,
        "total": subtotal,
        "breakdown_urdu": (
            f"bunyadi: Rs{base} + fori: Rs{urgency_surcharge} "
            f"+ faasla: Rs{distance_charge} - riayat: Rs{loyalty_discount}"
        ),
        "breakdown_en": (
            f"Base: Rs{base} + Urgency: Rs{urgency_surcharge} "
            f"+ Distance: Rs{distance_charge} - Discount: Rs{loyalty_discount}"
        ),
    }
