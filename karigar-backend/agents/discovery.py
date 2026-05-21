from google.adk.agents import LlmAgent
from tools.firestore import get_providers_by_service
from tools.scoring import get_travel_time_estimate
from google.adk.tools import FunctionTool

DISCOVERY_INSTRUCTION = """
You are the Provider Discovery Agent for Karigar AI.

Given a parsed service request, find all matching providers from the database.

Steps:
1. Call get_providers_by_service with the service_type and area
2. For each provider, calculate travel time estimate from user location
3. Filter out providers where active_bookings >= max_daily_bookings (fully booked)
4. Return ALL available providers (max 15) with their travel_time_minutes added
5. Log: {"agent": "discovery", "found": N, "filtered_out": M}

Always return providers as a list even if empty.
If no providers found, return empty list with explanation.
"""

def create_discovery_agent():
    return LlmAgent(
        name="discovery_agent", 
        model="gemini-2.5-flash",
        description="Discovers available service providers from database and Maps",
        instruction=DISCOVERY_INSTRUCTION,
        tools=[
            FunctionTool(get_providers_by_service),
            FunctionTool(get_travel_time_estimate)
        ]
    )

discovery_agent = create_discovery_agent()
