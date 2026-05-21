# ADK Karigar Skill

## Activate When
Building, editing, or debugging any ADK agent in karigar-backend/agents/

## Pre-Task Checklist (do before writing any agent code)
1. Fetch latest ADK docs via ADK Documentation MCP
2. Read AGENTS.md for non-negotiable rules
3. Read karigar-backend/agents/ to understand existing agents

## Agent Template
```python
from google.adk.agents import LlmAgent
from typing import Any

agent_name = LlmAgent(
    name="agent_name",
    model="gemini-2.5-flash",  # use gemini-2.5-pro ONLY for negotiation_agent
    description="One line description of what this agent does",
    instruction="""
    [Detailed instruction here]
    
    CRITICAL: Before every action, state what you are about to do.
    CRITICAL: After every action, append result to trace_log.
    CRITICAL: All user messages respond in the user's language.
    """,
    tools=[tool_function_1, tool_function_2]
)
```

## Agent Registry (current agents)
- coordinator → agent.py (root, routes to all sub-agents)
- nlu_agent → agents/nlu.py
- discovery_agent → agents/discovery.py
- ranking_agent → agents/ranking.py
- negotiation_agent → agents/negotiation.py (uses Pro model)
- booking_agent → agents/booking.py
- followup_agent → agents/followup.py
- dispute_agent → agents/dispute.py
- recovery_agent → agents/recovery.py