# Demo Scenario Runner Skill

## When Activated
When user says "run demo", "show scenario", "demo mode"

## Available Scenarios (run on command)

### Scenario 1: Normal Happy Path
Input: "AC bilkul thand nahi, urgent hai, budget 500, G-13"
Expected: NLU → Discovery → Ranking → Negotiation (budget gap) → Booking

### Scenario 2: Provider Cancels (Recovery Demo)  
Input: Trigger cancellation on booking KAI-DEMO-001
Expected: Recovery agent fires in <10s, finds replacement, notifies user

### Scenario 3: Ambiguous Input
Input: "bijli ki problem hai" (no location, no time)
Expected: NLU confidence 0.52, ask for location, then proceed

### Scenario 4: No Provider Available
Input: "plumber chahiye abhi, 2 AM, rural area"
Expected: Waitlist agent, suggest next morning, offer alternative

### Scenario 5: Dispute
Input: Trigger dispute on completed booking KAI-DEMO-002
Expected: Evidence builder, quote vs charged comparison, resolution proposal

## Demo Data
All scenarios use pre-seeded Firestore data under collection: demo_bookings