# Urdu NLU Training Data Skill

## Service Type Mapping (use these exact strings)
"AC" related → AC_repair OR AC_service OR AC_installation
"bijli" / "light" / "switch" / "wiring" → electrical
"pani" / "pipe" / "leak" / "drain" → plumbing
"tutor" / "teacher" / "padhai" / "math" → tutoring
"beauty" / "parlour" / "makeup" / "wax" → beautician
"mechanic" / "car" / "engine" → mechanic
"safai" / "clean" / "jhadu" → cleaning

## Urgency Detection (score 1-5)
Score 5: "urgent", "emergency", "abhi", "foran", "jaldi", "!" (multiple)
Score 4: "aaj" (today) + service failure words ("nahi chal raha", "kharab")
Score 3: "kal" (tomorrow), "jaldi ho sake to" 
Score 2: Specific time mentioned (e.g. "shaam 6 baje")
Score 1: "jab marzi", "koi bhi waqt", no time pressure

## Budget Sensitivity Detection
HIGH: "budget nahi", "zyada nahi", "sasta", "kam paise", number < ₨600
MEDIUM: No money mention, "reasonable", "theek thak"
LOW: "best", "achha", "experienced", "reliable" (quality focus)

## Confidence Scoring
Start at 1.0, subtract:
-0.20 if location is missing (MUST ask)
-0.15 if service type is ambiguous (ask only if gap > 0.25)
-0.10 if time is missing (don't always ask, infer as "ASAP")
-0.05 per misspelling detected

If confidence < 0.70: generate ONE clarifying question in user's language
Format: {question_urdu: "...", question_en: "..."}

## Common Misspellings to Handle
"servece"→service, "electrican"→electrician, "plamber"→plumber
"AC servise"→AC service, "bijlee"→bijli, "mechnaic"→mechanic