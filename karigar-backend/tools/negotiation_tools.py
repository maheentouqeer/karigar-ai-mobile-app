"""
Karigar AI -- Negotiation tools.
Budget-gap analysis, creative compromise solutions, and provider acceptance logic.
"""


def calculate_budget_gap(customer_budget: float, provider_min: float) -> dict:
    """Quantify the gap between what the customer can pay and the provider's rate."""
    gap = provider_min - customer_budget
    gap_percent = (gap / provider_min) * 100 if provider_min > 0 else 0

    return {
        "gap": gap,
        "gap_percent": round(gap_percent, 1),
        "feasible": gap_percent <= 40,  # >40% gap = no deal possible
        "customer_budget": customer_budget,
        "provider_min": provider_min,
    }


def find_creative_solutions(gap: float, provider: dict, request: dict) -> list:
    """Generate compromise offers that might bridge the price gap.

    Returns a list of solution dicts sorted by estimated savings.
    """
    solutions = []
    base_rate = provider.get("base_rate_pkr", 0)

    # Solution 1: Off-peak timing (evening discount)
    if request.get("urgency", 3) <= 3:
        off_peak_price = base_rate * 0.80
        if off_peak_price >= (base_rate * 0.70):  # provider won't go below 70%
            solutions.append({
                "type": "off_peak",
                "new_price": off_peak_price,
                "compromise_detail_en": "Book for 6-8 PM slot (low demand hours)",
                "compromise_detail_urdu": "shaam 6-8 bajay ki slot lein (kam maang ke awqaat)",
                "estimated_savings": base_rate - off_peak_price,
            })

    # Solution 2: Next available slot tomorrow
    tomorrow_price = base_rate * 0.85
    solutions.append({
        "type": "next_slot",
        "new_price": tomorrow_price,
        "compromise_detail_en": "Book for tomorrow morning (advance booking discount)",
        "compromise_detail_urdu": "kal subah book karein (peshgi booking par riayat)",
        "estimated_savings": base_rate - tomorrow_price,
    })

    # Solution 3: Basic service only (scope reduction)
    if "AC_repair" in provider.get("service_types", []):
        basic_price = base_rate * 0.70
        solutions.append({
            "type": "scope_reduction",
            "new_price": basic_price,
            "compromise_detail_en": "Basic checkup only (no parts replacement)",
            "compromise_detail_urdu": "sirf bunyadi jaanch (purze tabdeel nahi)",
            "estimated_savings": base_rate - basic_price,
        })

    # Filter: prefer solutions within (or close to) customer budget
    budget = request.get("budget", 0)
    affordable = [s for s in solutions if s["new_price"] <= budget * 1.1]
    return affordable if affordable else solutions[:2]  # always return >= 2 options


def evaluate_provider_acceptance(provider: dict, proposed_price: float) -> dict:
    """Simulate whether a provider would accept a proposed price.

    Providers are more flexible when their daily slots are mostly open.
    They never accept below 65% (or 60% when quiet) of their base rate.
    """
    base = provider.get("base_rate_pkr", 0)
    min_acceptable = base * 0.65  # hard floor

    workload_factor = (
        provider.get("active_bookings", 0)
        / max(1, provider.get("max_daily_bookings", 6))
    )

    # Less busy => more willing to negotiate
    if workload_factor < 0.3:
        min_acceptable = base * 0.60

    accepts = proposed_price >= min_acceptable

    if accepts:
        return {
            "accepts": True,
            "final_price": proposed_price,
            "reason_urdu": f"Rs{proposed_price:.0f} par raazi hain",
        }
    else:
        counter = min_acceptable * 1.05
        return {
            "accepts": False,
            "counter_price": round(counter, -1),
            "reason_urdu": f"kam az kam Rs{counter:.0f} chahiye",
        }
