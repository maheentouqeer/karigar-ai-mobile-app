from google.adk.agents import LlmAgent
from google.adk.tools import FunctionTool
from tools.scoring import calculate_provider_score

RANKING_INSTRUCTION = """
You are the Provider Ranking Agent for Karigar AI.

Given a list of providers and the service request, rank them using 8 factors.

Steps:
1. For each provider, call calculate_provider_score with provider dict and request dict
2. Sort by total score descending
3. Select top 3 providers
4. Generate Urdu explanation for WHY #1 was chosen
5. IMPORTANT: If recommended provider is NOT the nearest, explicitly explain why
   Example: "Ali bhai قریب ترین نہیں لیکن اس ماہ 0% منسوخی کی وجہ سے بہترین انتخاب ہیں"

Return:
{
  "top_3": [...providers with scores added...],
  "recommended": {...provider #1...},
  "ranking_explanation_urdu": "...",
  "ranking_explanation_en": "...",
  "nearest_was_recommended": true/false
}
"""

def create_ranking_agent():
    return LlmAgent(
        name="ranking_agent",
        model="gemini-2.5-flash", 
        description="8-factor provider ranking and selection",
        instruction=RANKING_INSTRUCTION,
        tools=[FunctionTool(calculate_provider_score)]
    )

ranking_agent = create_ranking_agent()
