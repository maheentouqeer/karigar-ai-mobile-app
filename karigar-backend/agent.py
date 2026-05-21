import time
import json
from google.adk.agents import LlmAgent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from agents.nlu import nlu_agent
from agents.discovery import discovery_agent
from agents.ranking import ranking_agent
from agents.negotiation import negotiation_agent
from agents.booking import booking_agent
from agents.recovery import recovery_agent
from agents.dispute import dispute_agent

ROOT_INSTRUCTION = """
You are Karigar AI — Pakistan's intelligent home services coordinator.
You orchestrate specialized agents to handle service requests end-to-end.

WORKFLOW:
1. NLU Agent → parse the user message
2. If confidence < 0.70 → return clarification question STOP
3. Discovery Agent → find available providers  
4. Ranking Agent → score and rank top 3
5. If user_budget < provider_min → Negotiation Agent → find middle ground
6. Present results to user and WAIT for confirmation
7. On confirmation → Booking Agent → execute and confirm
8. Schedule follow-up (set status in Firestore)

TRACE LOG: After every agent step, append to trace_log:
{
  "step": N,
  "agent": "agent_name",
  "action": "what happened",
  "duration_ms": time taken,
  "output_summary": "brief summary"
}

RESPONSE FORMAT:
{
  "response_en": "English response",
  "response_urdu": "اردو جواب",
  "trace_log": [...],
  "providers": [...] or null,
  "negotiation_result": {...} or null,
  "booking_id": "KAI-..." or null,
  "needs_confirmation": true/false,
  "next_action": "select_provider" or "confirm_booking" or "complete"
}

Respond in the SAME LANGUAGE the user used (Urdu if they wrote Urdu, etc.)
"""

root_agent = LlmAgent(
    name="karigar_coordinator",
    model="gemini-2.5-flash",
    description="Root orchestrator for Karigar AI — coordinates all specialized agents",
    instruction=ROOT_INSTRUCTION,
    sub_agents=[
        nlu_agent,
        discovery_agent, 
        ranking_agent,
        negotiation_agent,
        booking_agent,
        recovery_agent,
        dispute_agent
    ]
)

# Session service for multi-turn conversations
session_service = InMemorySessionService()

# Runner — this is what FastAPI calls
runner = Runner(
    agent=root_agent,
    app_name="karigar_ai",
    session_service=session_service
)

async def run_agent(user_message: str, session_id: str, user_id: str, metadata: dict = None) -> dict:
    start_time = time.time()
    
    # Ensure session exists for adk runner
    try:
        await session_service.get_session(session_id=session_id)
    except Exception:
        try:
            await session_service.create_session(session_id=session_id, user_id=user_id, app_name="karigar_ai")
        except Exception:
            pass

    enriched_message = user_message
    if metadata:
        hint = metadata.get("service_type_hint")
        loc = metadata.get("location")
        if hint:
            enriched_message = f"[service_type_hint={hint}] {enriched_message}"
        if loc:
            enriched_message = f"{enriched_message}\n[location={loc}]"

    content = types.Content(
        role="user",
        parts=[types.Part(text=enriched_message)]
    )
    
    trace_log = []
    final_response = ""
    
    async for event in runner.run_async(
        user_id=user_id,
        session_id=session_id, 
        new_message=content
    ):
        if event.is_final_response():
            if event.content and event.content.parts:
                final_response = event.content.parts[0].text
        
        # Capture agent actions for trace log
        if hasattr(event, 'actions') and event.actions:
            for action in event.actions:
                trace_log.append({
                    "step": len(trace_log) + 1,
                    "agent": getattr(action, 'agent_name', 'coordinator'),
                    "action": str(action)[:100],
                    "duration_ms": int((time.time() - start_time) * 1000)
                })
    
    # Parse response if JSON
    import re
    # attempt to strip markdown if it exists
    stripped_response = final_response.strip()
    if stripped_response.startswith("```json"):
        stripped_response = stripped_response[7:]
    if stripped_response.endswith("```"):
        stripped_response = stripped_response[:-3]
    stripped_response = stripped_response.strip()

    try:
        parsed = json.loads(stripped_response)
        parsed["trace_log"] = trace_log if trace_log else parsed.get("trace_log", [])
        return parsed
    except Exception as e:
        return {
            "response_en": final_response,
            "response_urdu": final_response,
            "trace_log": trace_log,
            "providers": None,
            "booking_id": None,
            "needs_confirmation": False,
            "error_parsing_json": str(e)
        }
