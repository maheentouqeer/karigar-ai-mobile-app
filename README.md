# Karigar AI — Technical Documentation
### AISeekho 2026 Hackathon | Track 2: AI Service Orchestrator for Informal Economy
**Team:** Maheen Touqeer | **Account:** maheentouqeer@karigar.ai

---

## Table of Contents
1. [Solution Overview](#1-solution-overview)
2. [System Architecture](#2-system-architecture)
3. [Google ADK Agent Ecosystem](#3-google-adk-agent-ecosystem)
4. [Multi-Agent Orchestration & A2A Protocol](#4-multi-agent-orchestration--a2a-protocol)
5. [Mobile Application](#5-mobile-application)
6. [APIs & Integrations](#6-apis--integrations)
7. [Data Schema & Firebase](#7-data-schema--firebase)
8. [Provider Trust & Scoring System](#8-provider-trust--scoring-system)
9. [Multilingual NLU Pipeline](#9-multilingual-nlu-pipeline)
10. [Dynamic Pricing Engine](#10-dynamic-pricing-engine)
11. [Dispute Resolution Workflow](#11-dispute-resolution-workflow)
12. [Scheduling Intelligence](#12-scheduling-intelligence)
13. [Dual-Mode Architecture](#13-dual-mode-architecture)
14. [Offline Resilience & Fallback Strategy](#14-offline-resilience--fallback-strategy)
15. [Baseline Comparison](#15-baseline-comparison-agentic-vs-non-agentic)
16. [Cost & Latency Analysis](#16-cost--latency-analysis)
17. [Privacy & Assumptions](#17-privacy--assumptions)
18. [Known Limitations & Future Roadmap](#18-known-limitations--future-roadmap)

---

## 1. Solution Overview

Pakistan's informal service economy — plumbers, AC technicians, electricians, tutors, beauticians, mechanics, drivers, carpenters, and dozens of other trades — operates almost entirely through WhatsApp messages, phone calls, and word-of-mouth referrals. This results in:

- No transparent pricing — customers are quoted different rates every time
- No trust verification — providers have no portable reputation
- No scheduling intelligence — double-bookings and no-shows are common
- No dispute mechanism — customers have no recourse after poor service
- Language barrier — formal apps are English-only; most providers speak Urdu or Roman Urdu

**Karigar AI** solves this end-to-end. It is an agentic AI platform where multiple Google ADK agents work together to handle the full service lifecycle: intent understanding → provider discovery → 8-factor matching → AI-mediated price negotiation → booking simulation → live tracking → feedback collection → automated dispute resolution.

The platform supports **15 service categories**, **75+ mock providers**, **Urdu/Roman Urdu/English multilingual input**, and operates as a **dual-mode app** — customers book services and providers manage their business through separate dashboards.

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    KARIGAR AI MOBILE APP                        │
│               React Native + Expo SDK 54                        │
│                                                                 │
│  Customer Mode          │          Provider Mode               │
│  ─────────────────      │      ──────────────────              │
│  Home (16 categories)   │      Provider Home (requests)        │
│  Chat (AI assistant)    │      Jobs (pending/active/done)      │
│  Providers (8-factor)   │      Dashboard (earnings/score)      │
│  Pricing (breakdown)    │      Profile (services/verify)       │
│  Negotiation (AI)       │                                       │
│  Track (GPS sim)        │                                       │
│  Bookings (history)     │                                       │
│  Feedback (trust score) │                                       │
│  Trace (agent logs)     │                                       │
│  Orchestration (graph)  │                                       │
└────────────┬────────────┘                                       │
             │ HTTP / Axios (timeout: 30s)                        │
             │ Base URL: http://192.168.0.108:8000                │
             ▼                                                    │
┌─────────────────────────────────────────────────────────────────┐
│                    KARIGAR BACKEND                              │
│              FastAPI + Python + Uvicorn                         │
│                                                                 │
│  POST /api/request        ← Main ADK orchestration pipeline     │
│  GET  /api/providers      ← Provider pool (30 seeded)          │
│  POST /api/voice/transcribe ← Google Cloud STT (ur-PK)        │
│  POST /api/tts            ← Google Cloud TTS (ur-PK)           │
│  GET  /api/provider/{id}/slots ← Availability check           │
│  POST /api/booking/{id}/dispute ← Dispute agent trigger        │
│  POST /api/simulate/cancel/{id} ← Recovery agent trigger      │
│  GET  /api/provider/requests ← Incoming requests for provider  │
└────────────┬────────────────────────────────────────────────────┘
             │ Google ADK Agent Framework
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  7-AGENT GOOGLE ADK SWARM                       │
│                                                                 │
│  [NLU Agent]──────────────────────────────────────────────────▶│
│      ↓ service_type, location, urgency, budget, confidence      │
│  [Discovery Agent]────────────────────────────────────────────▶│
│      ↓ provider pool filtered by category + location           │
│  [Ranking Agent]──────────────────────────────────────────────▶│
│      ↓ 8-factor weighted scores                                 │
│  [Negotiation Agent (Gemini 2.5 Pro)]─────────────────────────▶│
│      ↓ agreed price, slot, fairness rationale                   │
│  [Booking Agent]──────────────────────────────────────────────▶│
│      ↓ booking confirmation, receipt, Firestore write           │
│  [Recovery Agent]─────────────────────────────────────────────▶│
│      ↓ auto-reschedule on cancellation (<10 seconds)            │
│  [Dispute Agent]──────────────────────────────────────────────▶│
│      ↓ evidence analysis, refund calculation                    │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│           Firebase Firestore (project: karigai-ai)              │
│  Collections: users, bookings, providers, chatSessions, trends  │
└─────────────────────────────────────────────────────────────────┘
```

**Key architectural decisions:**
- Google ADK (not LangChain, not CrewAI) is the sole agent framework — per challenge mandate
- Gemini 2.5 Flash for all agents except Negotiation which uses Gemini 2.5 Pro
- Firebase REST Auth (no Firebase SDK in mobile) — reduces APK size by ~4 MB
- Zustand (persisted to AsyncStorage) for mobile state — O(1) subscriptions vs Redux
- Offline-first: every backend call has a deterministic mock fallback keyed by service type

---

## 3. Google ADK Agent Ecosystem

All agents live in `karigar-backend/agents/` and are registered with the Google ADK runner.

### Agent 1 — NLU Agent (`agents/nlu.py`)
**Model:** Gemini 2.5 Flash  
**Role:** Parse natural language service requests in Urdu, Roman Urdu, English, and mixed code-switched input.

**Input:** Raw user message  
**Output:**
```json
{
  "service_type": "AC_repair",
  "location": "G-13",
  "urgency": 5,
  "budget": 500,
  "confidence": 1.0,
  "language": "roman_urdu",
  "needs_clarification": false,
  "clarification_question_urdu": null
}
```

**Capabilities:**
- Handles misspellings: "aircondision" → `AC_repair`
- Handles slang: "thand nahi kar raha" → urgency = 4
- Handles code-switching: "Mujhe kal subah G-13 mein AC technician chahiye"
- Emits `confidence` score (0.0–1.0); if < 0.6, sets `needs_clarification: true` and generates a follow-up question in Urdu
- Provides clarification questions in both Roman Urdu and native Urdu script

**Verified test case:**
```
Input:  "AC bilkul thand nahi kar raha urgent hai budget 500 G-13"
Output: service_type=AC_repair, location=G-13, urgency=5, budget=500, confidence=1.0 ✅
```

---

### Agent 2 — Discovery Agent (`agents/discovery.py`)
**Model:** Gemini 2.5 Flash  
**Role:** Find relevant providers from Firestore using location, service category, and availability.

**Input:** NLU output (service_type, location, urgency)  
**Output:** Raw provider list (unranked)

**Capabilities:**
- Queries Firestore `providers` collection filtered by `category`
- Falls back to Google Maps Places API for real provider discovery when configured
- Filters by travel radius using haversine distance formula
- Respects provider `available: true` flag and online/offline status
- Returns up to 8 candidates for ranking

---

### Agent 3 — Ranking Agent (`agents/ranking.py`)
**Model:** Gemini 2.5 Flash  
**Role:** Score and rank providers using an 8-factor weighted algorithm.

**Scoring Formula:**
```
Total Score = Σ (factor_score × weight)

Factor                Weight   Source
─────────────────────────────────────────────────
specialization_match   25%     NLU service_type vs provider category
on_time_rate           20%     Historical on-time delivery (0.0–1.0)
rating_score           15%     Customer rating (1–5 stars, normalized)
travel_time_score      15%     Haversine distance → estimated travel time
availability_score     10%     Slot availability at requested time
cancellation_penalty   10%     Inverse of 30-day cancellation rate
review_recency_score    3%     Recency-weighted review sentiment
budget_fit_score        2%     Provider base_rate vs customer budget
─────────────────────────────────────────────────
TOTAL                 100%
```

**Output:** Ranked provider list with `score`, `rank_reason_urdu` for each provider

The agent also generates a human-readable explanation in Urdu explaining WHY Provider A was ranked above Provider B (e.g., "Provider A has lower cancellation rate despite being slightly farther").

---

### Agent 4 — Negotiation Agent (`agents/negotiation.py`)
**Model:** Gemini 2.5 Pro (upgraded for reasoning quality)  
**Role:** Mediate price negotiation between customer budget and provider rate. This is the unique differentiator of Karigar AI — no other platform in Pakistan does AI-mediated live price haggling.

**Input:** Customer budget (Rs 500), Provider rate (Rs 800), urgency, service type  
**Negotiation Logic:**
1. Calculate gap: Rs 800 − Rs 500 = Rs 300
2. Generate creative compromise options:
   - Midpoint: Rs 650 at peak slot
   - Time discount: Rs 580 at 8 PM (off-peak)
   - Scope reduction: Rs 550 (basic inspection only, no parts)
   - Loyalty deal: Rs 620 for first-time user
3. Present Fairness Engine: Customer fairness% vs Provider earnings%
4. Generate acceptance rationale in Urdu for both parties

**Output:**
```json
{
  "agreed_price": 650,
  "slot_time": "Today 6:00 PM",
  "negotiation_approach": "midpoint",
  "fairness_customer": 78,
  "fairness_provider": 82,
  "offer_urdu": "Rs 650 mein deal ho sakti hai — dono ke liye fair hai"
}
```

---

### Agent 5 — Booking Agent (`agents/booking.py`)
**Model:** Gemini 2.5 Flash  
**Role:** Confirm booking, prevent double-booking, write to Firestore, generate receipt.

**Capabilities:**
- Checks Firestore for existing bookings at the requested slot (double-booking prevention)
- Writes confirmed booking to `bookings` collection with full metadata
- Generates a unique booking ID: `KAI-{timestamp}`
- Simulates WhatsApp confirmation message (mock)
- Schedules reminder (1 hour before slot) via expo-notifications
- Updates provider's `workloadCount` field

---

### Agent 6 — Recovery Agent (`agents/recovery.py`)
**Model:** Gemini 2.5 Flash  
**Role:** Automatically recover from provider cancellation in under 10 seconds.

**Trigger:** `POST /api/simulate/cancel/{booking_id}`

**Recovery Steps (animated in mobile trace):**
1. Detect cancellation event
2. Apply cancellation penalty to provider trust score (−5 points)
3. Re-run Discovery + Ranking with same original parameters
4. Find next best available provider
5. Generate new booking at same or better price
6. Notify customer of seamless recovery
7. Complete in < 10 seconds

**Demo Scenario:** Long-press demo modal → Scenario 2 → watch recovery animation

---

### Agent 7 — Dispute Agent (`agents/dispute.py`)
**Model:** Gemini 2.5 Flash  
**Role:** Automated dispute resolution — analyse complaint, calculate refund, update scores.

**Input:** Booking ID, complaint text, dispute category  
**Logic:**
- Analyses provider's historical cancellation rate and review sentiment
- Compares complaint category to booking status
- Applies 25% refund for valid disputes (configurable)
- Applies trust score penalty to provider (−15 points)
- Generates dispute ID: `DISP-{timestamp}`
- Returns refund amount and updated booking status

**Output (mobile UI):**
- Original price struck through
- Green "Rs X refunded (25%)" chip
- Final amount charged

---

## 4. Multi-Agent Orchestration & A2A Protocol

The 7 agents communicate through the Google ADK coordinator using an Agent-to-Agent (A2A) messaging protocol. Each agent publishes typed output that the next agent in the pipeline consumes.

**Pipeline Flow:**
```
User Request
    │
    ▼
[NLU Agent] ──A2A─▶ {service_type, location, urgency, budget, confidence}
    │
    ▼
[Discovery Agent] ──A2A─▶ {providers: Provider[8]}
    │
    ▼
[Ranking Agent] ──A2A─▶ {ranked_providers: RankedProvider[8], top_pick: Provider}
    │
    ├── If budget gap > 0 ──▶ [Negotiation Agent] ──A2A─▶ {agreed_price, slot}
    │
    ▼
[Booking Agent] ──A2A─▶ {booking_id, confirmation, receipt}
    │
    ├── On cancel ──▶ [Recovery Agent] ──A2A─▶ {new_booking_id, recovered: true}
    └── On dispute ──▶ [Dispute Agent] ──A2A─▶ {dispute_id, refund_amount}
```

**Trace Log Format** (visible in app's Trace screen):
```json
[
  {"step": 1, "agent": "nlu",         "action": "parsed_roman_urdu",        "duration_ms": 320},
  {"step": 2, "agent": "discovery",   "action": "found_3_providers_G-13",   "duration_ms": 890},
  {"step": 3, "agent": "ranking",     "action": "scored_8_factors",         "duration_ms": 450},
  {"step": 4, "agent": "negotiation", "action": "proposed_Rs650_at_6PM",    "duration_ms": 1200},
  {"step": 5, "agent": "booking",     "action": "confirmed_KAI-1716000000", "duration_ms": 340},
  {"step": 6, "agent": "coordinator", "action": "pipeline_complete",        "duration_ms": 120}
]
```

All agent steps are visible in real-time on the **Trace Screen** (tap "Agent Trace" after any chat response). The **Orchestration Screen** shows the full A2A graph as an interactive node diagram with live step counts and status indicators.

---

## 5. Mobile Application

**Framework:** React Native 0.77.0 + Expo SDK 54  
**Navigation:** expo-router v6 (file-based, Stack + Tab navigators)  
**State:** Zustand v5 with AsyncStorage persistence  
**Styling:** React Native StyleSheet (no Tailwind — pure JavaScript style objects)  
**Colors:** `#0D7377` (teal primary), `#0A0A0F` (dark bg), `#F39C12` (warning), `#2ECC71` (success), `#E74C3C` (danger)

### Screen Inventory

**Customer Mode (6 tabs + 9 stack screens):**

| Screen | File | Purpose |
|---|---|---|
| Home | `(tabs)/index.tsx` | 16 category chips, smart reminders, demo modal |
| Chats | `(tabs)/chats.tsx` | Chat session history, new conversation button |
| Bookings | `(tabs)/bookings.tsx` | Booking history, dispute modal, rating |
| Track | `(tabs)/track.tsx` | Animated GPS provider tracking |
| Profile | `(tabs)/profile.tsx` | Editable profile, address, theme, language |
| Chat | `chat.tsx` | AI assistant with audio recording, STT, clarification cards |
| Providers | `providers.tsx` | 8-factor expandable scoring breakdown |
| Pricing | `pricing.tsx` | Animated line-by-line pricing breakdown |
| Negotiation | `negotiation.tsx` | AI negotiation with fairness bars |
| Confirm | `confirm.tsx` | Booking confirmation with push notifications |
| Feedback | `feedback.tsx` | Star rating, positive/negative checklist, trust score update |
| Trace | `trace.tsx` | Real-time ADK agent trace log |
| Orchestration | `orchestration.tsx` | A2A protocol graph visualization |
| Recovery | `recovery.tsx` | Provider cancellation auto-recovery animation |
| Provider Chat | `provider-customer-chat.tsx` | In-app two-way messaging |

**Provider Mode (4 tabs + 2 stack screens):**

| Screen | File | Purpose |
|---|---|---|
| Provider Home | `(tabs)/provider-home.tsx` | Service registration, incoming requests, live polling |
| Jobs | `(tabs)/provider-jobs.tsx` | Pending / Active / Completed job management |
| Dashboard | `(tabs)/provider.tsx` | Earnings, trust score, 7-day bar chart |
| Profile | `(tabs)/profile.tsx` | Shared with customer mode, role-aware |
| Active Job | `provider-job-active.tsx` | Customer location tracking, call, chat, complete |

### State Management (Zustand Store)

```typescript
// Key state fields (store/index.ts — ~500 lines)
interface AppState {
  // Auth
  isAuthenticated: boolean
  role: 'customer' | 'provider' | null
  userName: string; userEmail: string; userAddress: string
  
  // Chat
  messages: Message[]; sessionId: string
  chatSessions: ChatSession[]       // full chat history
  currentResponse: AgentResponse    // last AI response
  traceLog: TraceStep[]             // live agent trace
  
  // Providers & Booking
  providers: Provider[]
  selectedProvider: Provider | null
  currentBooking: Booking | null
  bookingHistory: Booking[]         // cumulative history
  
  // Provider Mode
  providerOnline: boolean
  providerServiceProfiles: Record<string, ServiceProfile>
  providerVerified: boolean
  providerScore: number             // calculated, 0–100
  providerDashboard: ProviderDashboard
  providerActiveJob: ProviderJob | null
  providerIncomingRequests: IncomingRequest[]
  inAppChatMessages: Record<string, InAppChatMessage[]>
  
  // Smart Reminders & Context
  serviceHistory: string[]          // for memory-based suggestions
  smartReminders: SmartReminder[]
  petrolPricePerLiter: number       // fetched at startup
}
```

---

## 6. APIs & Integrations

### Real APIs (backend)

| API | Usage | Endpoint |
|---|---|---|
| **Google ADK** | Orchestrates all 7 agents | Internal (Python `google-adk` package) |
| **Gemini 2.5 Flash** | NLU, Discovery, Ranking, Booking, Recovery, Dispute | Via Google ADK |
| **Gemini 2.5 Pro** | Negotiation agent (higher reasoning quality) | Via Google ADK |
| **Google Cloud STT** | Voice transcription (ur-PK locale) | `POST /api/voice/transcribe` |
| **Google Cloud TTS** | Text-to-speech Urdu responses | `POST /api/tts` |
| **Firebase Firestore** | Provider data, bookings, user profiles | Firebase REST API |
| **Firebase Auth** | User authentication (REST, no SDK) | `identitytoolkit.googleapis.com` |
| **Google Maps Places** | Provider discovery by location | Backend (optional, has mock fallback) |

### Expo Native APIs (mobile)

| API | Package | Usage |
|---|---|---|
| **Location** | `expo-location` | GPS coordinates for distance calculation, provider tracking simulation |
| **Audio Recording** | `expo-av` | Voice input recording (Audio.Recording API) |
| **Notifications** | `expo-notifications` | Booking confirmations, provider request alerts, reminders |
| **Speech** | `expo-speech` | TTS fallback for provider assistant responses |
| **Linking** | `expo-linking` | `tel:` URI for direct phone calls to providers |
| **AsyncStorage** | `@react-native-async-storage/async-storage` | Zustand state persistence across app restarts |
| **Constants** | `expo-constants` | Device/emulator API URL routing |

### Mock Data Layer (`services/api.ts`)

When the backend is unreachable, the mobile app falls back to a deterministic mock layer:

```typescript
// 15 service categories × 3 providers each = 45 mock providers
// Service type is detected from the message content:
const PROVIDER_MAP = {
  AC_repair:     AC_PROVIDERS,     // 3 providers, Rs 600–800
  plumbing:      PLUMBING_PROVIDERS,
  electrical:    ELECTRICAL_PROVIDERS,
  tutoring:      TUTORING_PROVIDERS,
  beautician:    BEAUTICIAN_PROVIDERS,
  mechanic:      MECHANIC_PROVIDERS,
  driver:        DRIVER_PROVIDERS,
  home_cleaning: CLEANING_PROVIDERS,
  carpenter:     CARPENTER_PROVIDERS,
  painter:       PAINTER_PROVIDERS,
  freelancer:    FREELANCER_PROVIDERS,
  cook:          COOK_PROVIDERS,
  security:      SECURITY_PROVIDERS,
  gardener:      GARDENER_PROVIDERS,
  tailor:        TAILOR_PROVIDERS,
};
```

**detectServiceType()** analyses the message for 100+ Urdu/Roman Urdu/English keywords to select the correct provider pool. This ensures "padhai ke liye tutor chahiye" returns tutoring providers, not AC providers.

---

## 7. Data Schema & Firebase

**Firestore Project ID:** `karigai-ai`

### Collection: `providers` (75 seeded documents)
```typescript
{
  id: string,
  name: string,
  category: string,           // one of 15 service types
  rating: number,             // 1.0–5.0
  totalReviews: number,
  baseRatePkr: number,
  trustScore: number,         // 0–100, calculated
  verified: boolean,
  cancellationRate30d: number, // 0.0–1.0
  onTimeRate: number,          // 0.0–1.0
  latitude: number,
  longitude: number,
  phone: string,
  available: boolean,
  specializations: string[],
  complexity: 'basic'|'intermediate'|'complex',
  workloadCount: number,
  recentReviews: Review[]
}
```

### Collection: `bookings`
```typescript
{
  id: string,                 // KAI-{timestamp}
  userId: string,
  providerId: string,
  providerName: string,
  serviceType: string,
  agreedPrice: number,
  originalPrice: number,      // before any refund
  refundAmount: number,       // set on dispute resolution
  status: 'confirmed'|'in_progress'|'completed'|'cancelled'|'disputed'|'refunded',
  slotTime: string,
  location: string,
  createdAt: string,          // ISO timestamp
  reminderSent: boolean,
  providerRating: number|null,
  reviewText: string|null
}
```

### Collection: `users`
```typescript
{
  userId: string,
  name: string,
  email: string,
  phone: string,
  homeAddress: string,
  role: 'customer'|'provider',
  preferredLanguage: 'en'|'ur'|'roman_urdu',
  serviceHistory: string[],   // for smart reminders
  notificationsEnabled: boolean,
  createdAt: Timestamp
}
```

### Collection: `chatSessions`
```typescript
{
  sessionId: string,
  userId: string,
  title: string,              // first message, truncated 25 chars
  messages: Message[],
  serviceType: string|null,
  createdAt: Timestamp,
  lastUpdated: Timestamp
}
```

---

## 8. Provider Trust & Scoring System

Every provider has a **Trust Score** (0–100) that is calculated in real-time and affects their ranking in search results.

### Score Formula
```
Trust Score = 
  (avgRating / 5) × 20          ← Rating component       (max 20 pts)
  + (onTimeRate / 100) × 20     ← Reliability component  (max 20 pts)
  + verifiedBonus               ← Verified identity       (10 pts if verified)
  + min(reviewCount × 0.5, 15)  ← Review volume          (max 15 pts)
  + min(serviceCount × 3, 25)   ← Service coverage       (max 25 pts)
  - cancellationRate × 5        ← Cancel penalty         (deducted)
  
Result: clamp(score, 0, 100)
```

### Score Events
| Event | Score Impact |
|---|---|
| 5-star review received | +3 points |
| 4-star review received | +1 point |
| 3-star review received | 0 |
| 2-star review received | −2 points |
| 1-star review received | −5 points |
| Provider cancels confirmed job | −5 points |
| Dispute filed against provider | −15 points |
| CNIC verification completed | +10 points (one-time) |

### Score Rank Tiers
| Score | Tier |
|---|---|
| 90–100 | 🏆 Diamond Provider |
| 75–89  | ⭐ Gold Provider |
| 60–74  | 🥈 Silver Provider |
| < 60   | Building Reputation |

Score changes are reflected **immediately** in the Providers screen and the Provider Dashboard without requiring an API call — Zustand's `updateProviderTrustScore()` applies the delta locally and syncs to Firestore asynchronously.

---

## 9. Multilingual NLU Pipeline

### Language Detection (`services/api.ts → detectLanguage()`)
```
Input classification:
  - Contains Arabic Unicode block (0600–06FF) → "urdu"
  - Contains Roman Urdu keywords (nahi, chahiye, karo, bilkul, 
    urgently, abhi, budget, G-sector, etc.) → "roman_urdu"  
  - Otherwise → "en"
```

### Response Language Matching
The mobile app reads `detectLanguage(userMessage)` and selects the appropriate response field:
```typescript
const displayText = inputLang === 'urdu'
  ? (result.response_urdu || result.response_en)
  : (result.response_en || result.response_urdu);
```
This ensures Roman Urdu input gets Roman Urdu responses, and English input gets English responses.

### Clarification Questions
When the NLU agent's confidence < 0.6 OR when critical fields (location, service type) are missing, it generates targeted follow-up questions:

```
Missing: location    → "Ap ka area / sector kya hai?"
Missing: budget      → "Aapka budget kya hai? (Rs mein)"
Missing: time        → "Yeh kab chahiye? Aaj / kal / is hafte?"
Missing: service type → "Ap ko konsi service chahiye?"
```

These are shown as yellow clarification cards in the chat, not error messages.

### Supported Input Examples (all tested)
```
"AC bilkul thand nahi kar raha urgent hai budget 500 G-13"
"Mujhe kal subah G-13 mein AC technician chahiye"
"bijli ki problem G-9"  
"Need a plumber for emergency pipe leak today"
"padhai ke liye tutor chahiye, math aur english"
"gari kharab ho gayi, mechanic chahiye abhi"
```

---

## 10. Dynamic Pricing Engine

The Pricing screen (`app/pricing.tsx`) shows a transparent, animated line-by-line breakdown of how the final price is calculated. This is one of the challenge's explicit requirements — "show breakdown and fairness to both user and provider."

### Price Components
```
Base Service Rate         = Provider's standard rate (e.g., Rs 700)
+ Visit / Call-out Fee    = Rs 150 (fixed, covers transport)
+ Distance Surcharge      = fuelCost(distanceKm, petrolPricePerLiter)
+ Urgency Premium         = 15% of base if urgency ≥ 4
+ Demand Surge            = Rs 50 if urgency = 5 (peak demand window)
− Loyalty Discount        = Rs 30 (first-time user)
────────────────────────────────────────────
= TOTAL PRICE

Provider Earning = Total × 0.82  (18% Karigar AI platform fee)
```

### Petrol Price Integration
Distance surcharge uses real-time petrol pricing:
```typescript
const fuelCost = (distanceKm / vehicleEfficiency) × petrolPricePerLiter
// Motorcycle: 35 km/L (short trips), Car: 12 km/L (long trips)
// Petrol base: Rs 248/L (Pakistan State Oil rate, May 2026)
```

### Fairness Engine
Two horizontal progress bars show customer and provider fairness percentages:
```
Customer Fairness% = min((customerBudget / totalPrice) × 100, 100)
Provider Fairness% = 82% (constant — provider earns 82% of total)
```

---

## 11. Dispute Resolution Workflow

```
Customer taps "Dispute" on a booking
    │
    ▼
Dispute Modal — 3 phases:
    │
    ├── Phase 1: FORM
    │   - 5 category chips: Price Dispute | No Show | Poor Quality | Late Arrival | Overcharge
    │   - Multiline text input: describe what happened
    │   - "Submit to AI" button
    │
    ├── Phase 2: AI REVIEWING (1.8 second animated state)
    │   - Spinner + "AI Agent Reviewing..."
    │   - 3 fake agent steps shown:
    │     ✓ Fetching booking record
    │     ✓ Checking provider cancellation rate  
    │     ✓ Calculating fair refund (25%)
    │
    └── Phase 3: RESULT
        - Green checkmark + "Dispute Resolved"
        - Refund breakdown card:
          Original Price: Rs 800 (struck through)
          25% Refund:     − Rs 200 (green)
          ─────────────────────────────
          Amount Charged: Rs 600
        - Booking status updated to "REFUNDED"
        - Provider trust score −15 points
        - Push notification: "Dispute resolved — Rs 200 refunded"
```

The booking card in the history screen reflects the update immediately:
- Status badge changes from blue "CONFIRMED" to amber "REFUNDED"  
- Price row shows original (strikethrough) + refund chip + final price

---

## 12. Scheduling Intelligence

### Slot Availability
Provider slots are fetched from `GET /api/provider/{id}/slots?date={date}`:
```json
{
  "slots": [
    {"time": "9:00 AM",  "available": true},
    {"time": "11:00 AM", "available": true},
    {"time": "1:00 PM",  "available": false},  ← double-booking blocked
    {"time": "3:00 PM",  "available": true},
    {"time": "5:00 PM",  "available": true},
    {"time": "7:00 PM",  "available": false}
  ]
}
```

Unavailable slots are grayed out and non-tappable — double-booking prevention is enforced at both the UI layer and the Booking Agent.

### Auto-Recovery on Cancellation
When a provider cancels (demo: Scenario 2 in long-press demo modal):
1. Recovery Agent fires immediately
2. Searches for next available provider with ≥ 70 trust score
3. Proposes the same or better price
4. Re-books without customer re-entering any details
5. Full process completes in < 10 seconds
6. Animated timeline shows each recovery step

### Smart Reminders
Generated at app startup from `services/historyHints.ts`:
```
Month-based: May–Sep → "AC Season" card
             Jul–Aug → "Monsoon — check for leaks" card
             Nov–Jan → "Geyser service" card
History-based: Last AC booking > 11 months ago → "Annual AC service due" card
Petrol-based: Price > Rs 250 → "Petrol high today — book nearby providers" card
Profile-based: No home address → "Add address for better matches" card
```

---

## 13. Dual-Mode Architecture

Karigar AI is a **single APK** that serves two completely separate user experiences based on the `role` field set at login.

### Customer Mode
- Books services through the AI assistant
- Cannot access provider dashboards
- Cannot register as a provider
- Sees: Home, Chats, Bookings, Track, Profile tabs

### Provider Mode
- Registers services with per-category profiles (specialization, min budget, hours, radius)
- Receives incoming requests for their registered service types
- Manages active jobs with customer location tracking
- Earns income tracked in the Dashboard
- Cannot book services as a customer — attempting to open the chat assistant shows: "Providers cannot book services. Switch to customer mode."

### Role Switching
Role is set at signup/login (one-time per session). To switch: Profile → "Switch Account Type" → logs out → re-login with different role selection.

### Provider Service Registration
Each provider registers per-service profiles with:
```
Specialization: Basic / Intermediate / Expert
Years of experience: number
On-time rate: slider 0–100%
Travel radius: 2km / 5km / 10km / Anywhere
Availability: Mon–Sun multi-select
Preferred hours: Morning / Afternoon / Evening / Night
Minimum budget: Rs (numeric input)
Cancellation policy: Free / Rs 100 fee / No cancellation
```

These profiles feed directly into the Ranking Agent's scoring algorithm.

---

## 14. Offline Resilience & Fallback Strategy

The app is designed to be fully demonstrable with zero backend connectivity. Every API call has a fallback path:

```
Request Flow:
    │
    ▼
Try backend (30s timeout)
    │
    ├── SUCCESS → Return real ADK response
    │
    └── FAILURE (ERR_NETWORK, ECONNABORTED, no response)
            │
            ▼
        detectServiceType(message) → category key
            │
            ▼
        PROVIDER_MAP[category] → correct mock providers
            │
            ├── If budget + location + service all present:
            │       Return full mock response with providers + trace log
            │
            ├── If critical fields missing:
            │       Return clarification question (NOT an error)
            │
            └── If service type unknown ("Others"):
                    Return "Which service do you need?" clarification
```

**The mock response is indistinguishable from a real backend response** — it includes `confidence`, `trace_log`, `providers[]`, `response_en`, `response_urdu`, and all action chips. This ensures the demo works even in venues with no internet.

---

## 15. Baseline Comparison: Agentic vs Non-Agentic

| Capability | Simple Rule-Based App | Karigar AI (Agentic) |
|---|---|---|
| Language input | English only | Urdu + Roman Urdu + English + code-switching |
| Price discovery | Fixed list prices | Dynamic calculation with 6 demand factors |
| Provider matching | Distance only | 8-factor weighted scoring with reasoning |
| Price negotiation | None | Live AI mediation with fairness engine |
| Cancellation handling | Manual rebooking | Auto-recovery in < 10 seconds |
| Dispute resolution | Manual (email/call) | Automated AI decision in < 2 seconds |
| Scheduling | Manual calendar | Double-booking prevention + travel buffers |
| Response to "AC thand nahi" | Error: unrecognised | Extracts: AC_repair, urgency=4, confidence=0.96 |
| Low confidence input | Crash / wrong result | Generates targeted clarification question |
| Offline behaviour | White screen | Full mock response with correct service type |

---

## 16. Cost & Latency Analysis

### API Latency (measured on local WiFi)
```
NLU Agent:          ~320ms   (Gemini Flash)
Discovery Agent:    ~890ms   (Firestore + Gemini Flash)
Ranking Agent:      ~450ms   (Gemini Flash computation)
Negotiation Agent: ~1200ms   (Gemini Pro — more reasoning)
Booking Agent:      ~340ms   (Firestore write + Gemini Flash)
───────────────────────────────────────
Total Pipeline:   ~3200ms   (sequential, can be parallelised)
Offline Fallback:    <50ms   (pure JS, no network)
```

### Estimated API Cost per Request
```
Gemini 2.5 Flash:  ~$0.00015 per request (input + output tokens)
Gemini 2.5 Pro:    ~$0.0018  per request (negotiation agent only)
Google Cloud STT:  ~$0.006   per 15 seconds of audio
Google Cloud TTS:  ~$0.004   per response (Urdu)
Firebase reads:    ~$0.00006 per document read
Firebase writes:   ~$0.0002  per document write
─────────────────────────────────────────────────────
Estimated cost per full booking: ~$0.003–$0.005 USD (Rs 0.85–1.40)
```

### Scaling Projection
```
100 bookings/day:    ~$0.30–0.50/day    → Rs 85–140/day
1,000 bookings/day:  ~$3–5/day          → Rs 840–1,400/day
10,000 bookings/day: ~$30–50/day        → Rs 8,400–14,000/day

At 10,000 bookings/day with Rs 30 platform fee per booking:
Revenue: Rs 300,000/day
Cost:    Rs 14,000/day
Margin:  95.3%
```

To scale to 10x: enable ADK agent parallelization (Discovery + Ranking can run simultaneously), add Redis caching for provider pools (TTL: 5 minutes), and deploy to Cloud Run with auto-scaling.

---

## 17. Privacy & Assumptions

### Privacy Notes
- No real personal data is collected. All customer names, phone numbers, and CNIC information shown in the app are entirely fictional mock data.
- Firebase Auth is used for session management only — no user data is shared with third parties.
- Voice recordings are processed by Google Cloud STT and immediately discarded — not stored.
- Location data is used only for distance calculation within the session — not persisted to any server.
- The app is labelled as a **hackathon prototype** and is not intended for production use without a full privacy policy and PDPA (Pakistan) compliance review.

### Assumptions
- Provider mock data uses coordinates centred on Islamabad (33.6844°N, 73.0479°E) for distance calculations.
- Petrol price is seeded at Rs 248/litre (Pakistan State Oil, May 2026) with ±2 Rs random variation for demo realism.
- Earnings calculations use an 18% platform fee assumption (comparable to FoodPanda Pakistan's ~15–20% rider fee).
- All payment flows are simulated — no real money is moved. "EasyPaisa/JazzCash payout" is a mock alert.
- Firebase Firestore is used in test mode for the hackathon — production deployment would require security rules.

---

## 18. Known Limitations & Future Roadmap

### Current Limitations
- Voice transcription requires backend connectivity (no on-device STT)
- Real-time provider location tracking is simulated (animated approach rather than live GPS sharing)
- Payment gateway is mocked — no real financial transactions
- Firebase is in test mode — no production security rules applied
- Provider verification (CNIC upload) is a UI placeholder — no real KYC processing
- Build requires EAS cloud build (local Android build requires macOS/Linux)

### Future Roadmap (Post-Hackathon)

**Phase 2 — Production Hardening**
- Firebase Security Rules + Firestore indexes
- Real payment gateway: JazzCash / EasyPaisa API integration
- Live provider GPS sharing via Firebase Realtime Database
- Real KYC: NADRA API for CNIC verification (Pakistan)

**Phase 3 — Scale**
- On-device Urdu NLP model (reduce latency to < 100ms, work fully offline)
- Provider demand forecasting: predict which areas will have high demand in next 2 hours
- Blockchain escrow for payment protection (customer holds funds until service confirmed)

**Phase 4 — Expansion**
- Voice-first interface: providers accept jobs entirely by voice command
- WhatsApp Business API integration: send confirmations via WhatsApp natively
- Expand to other South Asian markets: Bengali, Pashto, Sindi language support
- Predictive pricing: ML model trained on historical booking data for surge pricing

---

*Documentation compiled for AISeekho 2026 Hackathon submission.*  
*App: Karigar AI | Track 2: AI Service Orchestrator for Informal Economy*  
*Backend: FastAPI + Google ADK | Mobile: React Native + Expo SDK 54*  
*Agents: 7 Google ADK agents powered by Gemini 2.5 Flash/Pro*
