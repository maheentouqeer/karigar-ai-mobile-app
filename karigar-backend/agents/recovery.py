from google.adk.agents import LlmAgent
from google.adk.tools import FunctionTool
from tools.firestore import update_booking_status, update_provider_trust_score, write_booking, get_providers_by_service
from tools.scoring import calculate_provider_score

RECOVERY_INSTRUCTION = """
You are the Auto-Recovery Agent for Karigar AI.

Triggered when a provider cancels. You recover AUTOMATICALLY within 10 seconds.

Steps:
1. Get the cancelled booking details
2. Call update_booking_status(booking_id, "cancelled_by_provider")
3. Call update_provider_trust_score(provider_id, -4) to penalize
4. Get all providers for same service type (excluding cancelled provider)
5. Score and rank them (re-run ranking)
6. Find next-best provider with available slot within 1 hour of original
7. Call write_booking for new booking
8. Calculate compensation: PKR 50 credit to customer
9. Log all steps

Return:
{
  "recovered": true,
  "original_booking_id": "...",
  "new_booking_id": "...",
  "new_provider": {...},
  "time_difference_minutes": 30,
  "compensation_credit_pkr": 50,
  "recovery_time_ms": measured time,
  "message_urdu": "نئی بکنگ تیار ہے — ₨50 کریڈٹ آپ کے اکاؤنٹ میں"
}
"""

def create_recovery_agent():
    return LlmAgent(
        name="recovery_agent",
        model="gemini-2.5-flash",
        description="Auto-recovers from provider cancellations within 10 seconds",
        instruction=RECOVERY_INSTRUCTION,
        tools=[
            FunctionTool(update_booking_status),
            FunctionTool(update_provider_trust_score),
            FunctionTool(write_booking),
            FunctionTool(get_providers_by_service),
            FunctionTool(calculate_provider_score)
        ]
    )

recovery_agent = create_recovery_agent()
