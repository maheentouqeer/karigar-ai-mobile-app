# KARIGAR AI — AGENTS.md
# Read this before every task. These rules are non-negotiable.

## Project Overview
Karigar AI is a multi-agent AI system for Pakistan's informal home services market.
It is being built for the AISeekho 2026 Antigravity Hackathon.
Deadline: May 20, 2026. Demo video: May 25-26.

## Architecture
- Mobile: React Native + Expo (karigar-mobile/)
- Backend: FastAPI + Python (karigar-backend/)
- Agents: Google ADK multi-agent system (karigar-backend/agents/)
- Database: Firebase Firestore
- Hosting: Google Cloud Run (backend) + Expo EAS (mobile)
- Core Platform: Google Antigravity + ADK (MANDATORY)

## Non-Negotiable Rules

### Agent Rules
1. Google ADK is the ONLY agent framework. Never suggest LangChain, CrewAI, or LangGraph.
2. All agents use LlmAgent from google.adk.agents
3. Root coordinator routes ALL requests — never bypass it
4. Every agent decision MUST append to the trace_log list
5. negotiation_agent uses gemini-2.5-pro, all others use gemini-2.5-flash
6. Confidence < 0.70 in NLU → ask ONE clarifying question, never proceed blindly

### Language Rules  
7. All user-facing text must have both Urdu and English versions
8. Urdu text uses Noto Nastaliq Urdu font with textAlign: 'right'
9. API responses include both: {message_urdu: "...", message_en: "..."}
10. Price displays always use ₨ (Pakistani Rupee) symbol

### Code Rules
11. TypeScript strict mode — no 'any' types
12. All API calls go through services/api.ts — never fetch() directly in components
13. All colors from constants/theme.ts — never hardcode hex in components
14. Each agent in its own file in karigar-backend/agents/
15. Every tool function has type hints + docstring

### Demo Rules
16. All 5 stress-test scenarios must work on command: "run demo [1-5]"
17. Agent trace screen must stream live during all operations
18. Mock data uses realistic Pakistani names, G-sector locations, PKR prices
19. Provider DB has minimum 30 providers across 6 service categories

### Privacy Rules
20. No real personal data anywhere — all mock/anonymized
21. Provider photos are generated avatars from initials, not real faces
22. firebase-service-account.json is NEVER committed to git

## File Structure
karigar-ai/
├── AGENTS.md              ← this file
├── DESIGN.md              ← from Stitch export
├── .gitignore
├── karigar-mobile/        ← React Native + Expo app
├── karigar-backend/       ← FastAPI + ADK agents
│   ├── agent.py          ← root coordinator
│   ├── agents/           ← sub-agents
│   ├── tools/            ← tool functions
│   ├── main.py           ← FastAPI server
│   └── requirements.txt
└── scripts/              ← data seeding, utilities

## Current Status
[ ] Phase 1: Stitch designs done
[ ] Phase 2: React Native code from AI Studio  
[ ] Phase 3: Antigravity setup (current)
[ ] Phase 4: ADK agents built
[ ] Phase 5: Backend + Firebase connected
[ ] Phase 6: Phone testing
[ ] Phase 7: Demo preparation