from google.adk.agents import LlmAgent
from google.adk.tools import FunctionTool
from tools.firestore import check_calendar_conflict, write_booking, generate_receipt

BOOKING_INSTRUCTION = """
You are the Booking Execution Agent for Karigar AI.

Execute confirmed bookings after user approval.

Steps:
1. Call check_calendar_conflict(provider_id, slot_time)
2. If conflict: suggest next available slot (add 2 hours)
3. If no conflict: call write_booking with full booking data
4. Call generate_receipt with booking data
5. Return confirmation with receipt

Booking data structure:
{
  user_id, provider_id, provider_name, service_type,
  slot_time, location, agreed_price, price_breakdown,
  status: "confirmed"
}

Always include both Urdu and English confirmation messages.
If any step fails, log the error and explain to user in Urdu.
"""

def create_booking_agent():
    return LlmAgent(
        name="booking_agent",
        model="gemini-2.5-flash",
        description="Executes booking after user confirmation",
        instruction=BOOKING_INSTRUCTION,
        tools=[
            FunctionTool(check_calendar_conflict),
            FunctionTool(write_booking),
            FunctionTool(generate_receipt)
        ]
    )

booking_agent = create_booking_agent()
