/** Detect missing fields for follow-up questions (NLU confidence < 0.7 or incomplete request). */

const LOCATION_RE = /\b([A-Z]-?\d+(?:\/\d+)?|islamabad|rawalpindi|lahore|karachi|peshawar|faisalabad|multan|quetta|sialkot|near me|mere paas)\b/i;
const BUDGET_RE = /(?:budget|rs\.?|rupees?|₨|paisa|paisay)\s*:?\s*(\d+)/i;
const TIME_RE =
  /(?:asap|urgent|abhi|shaam|subah|dopahar|evening|morning|tomorrow|kal|aaj|baje|\d{1,2}\s*(?:am|pm)|jaldi|today|tonight)/i;
const SUBJECT_RE =
  /(?:math|english|physics|chemistry|biology|o\s*level|a\s*level|matric|inter|urdu|science|subject|maths|history|islamiat)/i;

export interface MissingFields {
  subject: boolean;
  budget: boolean;
  location: boolean;
  time: boolean;
}

export function detectMissingFields(
  message: string,
  serviceType?: string
): MissingFields {
  const isTutor =
    serviceType === 'tutoring' ||
    /tutor|teacher|padhai|ustaz|parhai/i.test(message);

  return {
    subject: isTutor && !SUBJECT_RE.test(message),
    budget: !BUDGET_RE.test(message),
    location: !LOCATION_RE.test(message),
    time: !TIME_RE.test(message),
  };
}

export function buildClarificationQuestion(
  missing: MissingFields,
  serviceLabel: string
): { en: string; urdu: string; romanUrdu: string } {
  const partsEn: string[] = [];
  const partsUrdu: string[] = [];
  const partsRoman: string[] = [];

  if (missing.subject) {
    partsEn.push('subject (e.g. O Level Math)');
    partsUrdu.push('مضمون (مثلاً O Level Math)');
    partsRoman.push('konsa subject chahiye (jaise O Level Math)');
  }
  if (missing.budget) {
    partsEn.push('budget in Rs');
    partsUrdu.push('بجٹ (روپے میں)');
    partsRoman.push('kitna budget hai (Rs mein)');
  }
  if (missing.location) {
    partsEn.push('your location (e.g. G-13, Islamabad)');
    partsUrdu.push('آپ کا علاقہ (مثلاً G-13)');
    partsRoman.push('aap kahan hain (jaise G-13)');
  }

  // Only ask for time if at least one other field is missing too
  // (time alone is not critical — we can default to ASAP)
  if (missing.time && (missing.budget || missing.location || missing.subject)) {
    partsEn.push('preferred time (e.g. today evening)');
    partsUrdu.push('وقت (مثلاً آج شام)');
    partsRoman.push('kab chahiye (jaise aaj shaam)');
  }

  if (partsEn.length === 0) {
    return {
      en: `Please share more details for ${serviceLabel}.`,
      urdu: `${serviceLabel} کے لیے مزید تفصیلات بتائیں۔`,
      romanUrdu: `${serviceLabel} ke liye thori aur detail dein.`,
    };
  }

  return {
    en: `For ${serviceLabel}, please share: ${partsEn.join(', ')}.`,
    urdu: `${serviceLabel} کے لیے براہ کرم بتائیں: ${partsUrdu.join('، ')}۔`,
    romanUrdu: `${serviceLabel} ke liye batayein: ${partsRoman.join(', ')}.`,
  };
}

/** Only trigger clarification if 2+ fields are missing (prevents over-asking) */
export function hasMissingFields(missing: MissingFields): boolean {
  const count = [missing.subject, missing.budget, missing.location, missing.time].filter(Boolean).length;
  // For tutoring: require subject + at least one more
  if (missing.subject) return true;
  // For others: require at least 2 missing to trigger (budget OR location alone = still try)
  return count >= 2;
}
