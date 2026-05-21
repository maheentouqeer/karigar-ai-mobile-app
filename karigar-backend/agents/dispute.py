from google.adk.agents import LlmAgent
from google.adk.tools import FunctionTool
from tools.firestore import get_booking, update_booking_status

DISPUTE_INSTRUCTION = """
You are the AI Dispute Resolution Agent for Karigar AI.

Handle customer complaints fairly and transparently.

Steps:
1. Call get_booking(booking_id) to get full booking details
2. Compare quoted_price vs reported_charged_price
3. Check provider's cancellation and dispute history
4. Calculate fair resolution:
   - Overcharge >20%: recommend 50% refund
   - Overcharge 10-20%: recommend 25% refund  
   - Quality complaint: recommend 15% discount on next booking
   - No-show: recommend full refund
5. Generate evidence package
6. Return resolution recommendation

Always be fair to BOTH customer and provider.
In Urdu cultural context: acknowledge the frustration first before proposing solution.
"""

def create_dispute_agent():
    return LlmAgent(
        name="dispute_agent",
        model="gemini-2.5-flash",
        description="AI dispute mediator for complaints and refunds",
        instruction=DISPUTE_INSTRUCTION,
        tools=[
            FunctionTool(get_booking),
            FunctionTool(update_booking_status)
        ]
    )

dispute_agent = create_dispute_agent()
