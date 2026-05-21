import axios, { AxiosError } from 'axios';
import { getApiBaseUrl } from './config';
import type { AgentResponse, Provider, TraceStep } from '../store';
import {
  buildClarificationQuestion,
  detectMissingFields,
  hasMissingFields,
} from './clarification';

const BASE = getApiBaseUrl();

export const api = axios.create({
  baseURL: BASE,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  return config;
});

// ─── Mock providers per category ────────────────────────────────────────────

const AC_PROVIDERS = [
  { id: 'ac1', name: 'Ali AC Services', category: 'AC_repair', rating: 4.8, total_reviews: 127,
    base_rate_pkr: 800, trust_score: 94, verified: true, cancellation_rate_30d: 0.02,
    on_time_rate: 0.95, rank_reason_urdu: 'سب سے کم منسوخی، فوری دستیاب', score: 94 },
  { id: 'ac2', name: 'Tariq Cooling Solutions', category: 'AC_repair', rating: 4.5, total_reviews: 89,
    base_rate_pkr: 700, trust_score: 81, verified: true, cancellation_rate_30d: 0.05,
    on_time_rate: 0.88, rank_reason_urdu: 'کم قیمت، اچھی ریٹنگ', score: 81 },
  { id: 'ac3', name: 'Hamid AC Expert', category: 'AC_repair', rating: 4.2, total_reviews: 210,
    base_rate_pkr: 600, trust_score: 65, verified: false, cancellation_rate_30d: 0.22,
    on_time_rate: 0.79, rank_reason_urdu: 'سستا لیکن منسوخی زیادہ', score: 65 },
];

const PLUMBING_PROVIDERS = [
  { id: 'plum1', name: 'Hassan Plumbing Works', category: 'plumbing', rating: 4.7, total_reviews: 98,
    base_rate_pkr: 600, trust_score: 88, verified: true, cancellation_rate_30d: 0.03,
    on_time_rate: 0.91, rank_reason_urdu: 'تجربہ کار، فوری دستیاب', score: 88 },
  { id: 'plum2', name: 'Usman Pipe Services', category: 'plumbing', rating: 4.3, total_reviews: 67,
    base_rate_pkr: 500, trust_score: 76, verified: true, cancellation_rate_30d: 0.08,
    on_time_rate: 0.85, rank_reason_urdu: 'کم قیمت، اچھی ریٹنگ', score: 76 },
  { id: 'plum3', name: 'Iqbal Drain Master', category: 'plumbing', rating: 4.0, total_reviews: 143,
    base_rate_pkr: 450, trust_score: 60, verified: false, cancellation_rate_30d: 0.19,
    on_time_rate: 0.78, rank_reason_urdu: 'سستا لیکن غیر تصدیق شدہ', score: 60 },
];

const ELECTRICAL_PROVIDERS = [
  { id: 'elec1', name: 'Bilal Electric Co.', category: 'electrical', rating: 4.9, total_reviews: 156,
    base_rate_pkr: 700, trust_score: 96, verified: true, cancellation_rate_30d: 0.01,
    on_time_rate: 0.97, rank_reason_urdu: 'سب سے بہتر الیکٹریشن، لائسنس یافتہ', score: 96 },
  { id: 'elec2', name: 'Rehman Wiring Solutions', category: 'electrical', rating: 4.4, total_reviews: 82,
    base_rate_pkr: 550, trust_score: 79, verified: true, cancellation_rate_30d: 0.06,
    on_time_rate: 0.87, rank_reason_urdu: 'معقول قیمت، اچھا تجربہ', score: 79 },
  { id: 'elec3', name: 'Sajid Power Works', category: 'electrical', rating: 4.1, total_reviews: 199,
    base_rate_pkr: 400, trust_score: 63, verified: false, cancellation_rate_30d: 0.21,
    on_time_rate: 0.76, rank_reason_urdu: 'سستا لیکن منسوخی زیادہ', score: 63 },
];

const TUTORING_PROVIDERS = [
  { id: 'tut1', name: 'Ahmad Academy Tutor', category: 'tutoring', rating: 4.9, total_reviews: 231,
    base_rate_pkr: 800, trust_score: 97, verified: true, cancellation_rate_30d: 0.01,
    on_time_rate: 0.98, rank_reason_urdu: 'بہترین ٹیوٹر، اعلیٰ نتائج', score: 97 },
  { id: 'tut2', name: 'Sara Home Tutor', category: 'tutoring', rating: 4.7, total_reviews: 118,
    base_rate_pkr: 600, trust_score: 85, verified: true, cancellation_rate_30d: 0.04,
    on_time_rate: 0.93, rank_reason_urdu: 'خاتون ٹیوٹر، O/A Level ماہر', score: 85 },
  { id: 'tut3', name: 'Online Ustaad Ji', category: 'tutoring', rating: 4.4, total_reviews: 76,
    base_rate_pkr: 400, trust_score: 71, verified: false, cancellation_rate_30d: 0.12,
    on_time_rate: 0.82, rank_reason_urdu: 'آن لائن آپشن، کم قیمت', score: 71 },
];

const BEAUTICIAN_PROVIDERS = [
  { id: 'beau1', name: 'Nadia Beauty Studio', category: 'beautician', rating: 4.8, total_reviews: 302,
    base_rate_pkr: 1200, trust_score: 92, verified: true, cancellation_rate_30d: 0.02,
    on_time_rate: 0.94, rank_reason_urdu: 'بہترین بیوٹیشن، گھر پر سروس', score: 92 },
  { id: 'beau2', name: 'Hina Makeup Artist', category: 'beautician', rating: 4.6, total_reviews: 187,
    base_rate_pkr: 900, trust_score: 83, verified: true, cancellation_rate_30d: 0.05,
    on_time_rate: 0.90, rank_reason_urdu: 'پیشہ ورانہ، شادی کا تجربہ', score: 83 },
  { id: 'beau3', name: 'Zara Parlour Services', category: 'beautician', rating: 4.2, total_reviews: 94,
    base_rate_pkr: 700, trust_score: 68, verified: false, cancellation_rate_30d: 0.16,
    on_time_rate: 0.80, rank_reason_urdu: 'کم قیمت ہوم سروس', score: 68 },
];

const MECHANIC_PROVIDERS = [
  { id: 'mech1', name: 'Kashif Auto Workshop', category: 'mechanic', rating: 4.7, total_reviews: 445,
    base_rate_pkr: 1000, trust_score: 90, verified: true, cancellation_rate_30d: 0.03,
    on_time_rate: 0.92, rank_reason_urdu: 'گاڑی مکینک، جملہ مرمت', score: 90 },
  { id: 'mech2', name: 'Tariq Mobile Mechanic', category: 'mechanic', rating: 4.4, total_reviews: 211,
    base_rate_pkr: 800, trust_score: 77, verified: true, cancellation_rate_30d: 0.07,
    on_time_rate: 0.86, rank_reason_urdu: 'گھر پر مرمت، تیز سروس', score: 77 },
  { id: 'mech3', name: 'Nasir Car Care', category: 'mechanic', rating: 4.0, total_reviews: 167,
    base_rate_pkr: 600, trust_score: 62, verified: false, cancellation_rate_30d: 0.20,
    on_time_rate: 0.77, rank_reason_urdu: 'سستا لیکن وقت پر نہیں آتا', score: 62 },
];

const DRIVER_PROVIDERS = [
  { id: 'drv1', name: 'Imran Safe Driver', category: 'driver', rating: 4.8, total_reviews: 512,
    base_rate_pkr: 500, trust_score: 93, verified: true, cancellation_rate_30d: 0.02,
    on_time_rate: 0.96, rank_reason_urdu: 'محفوظ، وقت کا پابند ڈرائیور', score: 93 },
  { id: 'drv2', name: 'Asif Daily Driver', category: 'driver', rating: 4.5, total_reviews: 289,
    base_rate_pkr: 400, trust_score: 80, verified: true, cancellation_rate_30d: 0.05,
    on_time_rate: 0.89, rank_reason_urdu: 'معقول قیمت، شہر میں تجربہ', score: 80 },
  { id: 'drv3', name: 'Liaquat Cab Services', category: 'driver', rating: 4.2, total_reviews: 178,
    base_rate_pkr: 300, trust_score: 66, verified: false, cancellation_rate_30d: 0.18,
    on_time_rate: 0.80, rank_reason_urdu: 'سستا، کبھی کبھی دیر', score: 66 },
];

const CLEANING_PROVIDERS = [
  { id: 'cln1', name: 'Clean Pro Pakistan', category: 'home_cleaning', rating: 4.7, total_reviews: 198,
    base_rate_pkr: 1500, trust_score: 89, verified: true, cancellation_rate_30d: 0.03,
    on_time_rate: 0.93, rank_reason_urdu: 'پیشہ ور صفائی ٹیم، سامان بھی', score: 89 },
  { id: 'cln2', name: 'Mehnat Cleaning Services', category: 'home_cleaning', rating: 4.4, total_reviews: 134,
    base_rate_pkr: 1000, trust_score: 76, verified: true, cancellation_rate_30d: 0.06,
    on_time_rate: 0.87, rank_reason_urdu: 'کم قیمت، اچھا کام', score: 76 },
  { id: 'cln3', name: 'Ali Bhai Safai', category: 'home_cleaning', rating: 4.0, total_reviews: 89,
    base_rate_pkr: 700, trust_score: 61, verified: false, cancellation_rate_30d: 0.22,
    on_time_rate: 0.75, rank_reason_urdu: 'سستا لیکن کوالٹی متغیر', score: 61 },
];

const CARPENTER_PROVIDERS = [
  { id: 'carp1', name: 'Master Furniture Works', category: 'carpenter', rating: 4.8, total_reviews: 267,
    base_rate_pkr: 900, trust_score: 91, verified: true, cancellation_rate_30d: 0.02,
    on_time_rate: 0.94, rank_reason_urdu: 'فرنیچر ماہر، اعلیٰ معیار', score: 91 },
  { id: 'carp2', name: 'Zahid Carpenter', category: 'carpenter', rating: 4.5, total_reviews: 143,
    base_rate_pkr: 700, trust_score: 78, verified: true, cancellation_rate_30d: 0.06,
    on_time_rate: 0.88, rank_reason_urdu: 'تجربہ کار، معقول قیمت', score: 78 },
  { id: 'carp3', name: 'Umer Wood Works', category: 'carpenter', rating: 4.1, total_reviews: 97,
    base_rate_pkr: 500, trust_score: 63, verified: false, cancellation_rate_30d: 0.19,
    on_time_rate: 0.79, rank_reason_urdu: 'سستا کام، وقت لیتا ہے', score: 63 },
];

const PAINTER_PROVIDERS = [
  { id: 'paint1', name: 'Colour King Painters', category: 'painter', rating: 4.7, total_reviews: 321,
    base_rate_pkr: 2000, trust_score: 88, verified: true, cancellation_rate_30d: 0.03,
    on_time_rate: 0.92, rank_reason_urdu: 'پیشہ ور رنگ کار، صاف کام', score: 88 },
  { id: 'paint2', name: 'Afzal Paint Services', category: 'painter', rating: 4.4, total_reviews: 188,
    base_rate_pkr: 1500, trust_score: 75, verified: true, cancellation_rate_30d: 0.07,
    on_time_rate: 0.85, rank_reason_urdu: 'معقول قیمت، تجربہ کار', score: 75 },
  { id: 'paint3', name: 'Quick Brush Painting', category: 'painter', rating: 4.0, total_reviews: 112,
    base_rate_pkr: 1000, trust_score: 60, verified: false, cancellation_rate_30d: 0.21,
    on_time_rate: 0.76, rank_reason_urdu: 'سستا رنگ کار، معیار متغیر', score: 60 },
];

const FREELANCER_PROVIDERS = [
  { id: 'free1', name: 'Hamza Digital Studio', category: 'freelancer', rating: 4.9, total_reviews: 189,
    base_rate_pkr: 3000, trust_score: 95, verified: true, cancellation_rate_30d: 0.01,
    on_time_rate: 0.97, rank_reason_urdu: 'ڈیزائن اور ویب ماہر', score: 95 },
  { id: 'free2', name: 'Sana Graphics & Web', category: 'freelancer', rating: 4.6, total_reviews: 134,
    base_rate_pkr: 2000, trust_score: 82, verified: true, cancellation_rate_30d: 0.05,
    on_time_rate: 0.90, rank_reason_urdu: 'کم قیمت، اچھا ڈیزائن', score: 82 },
  { id: 'free3', name: 'IT Solutions PK', category: 'freelancer', rating: 4.3, total_reviews: 78,
    base_rate_pkr: 1500, trust_score: 70, verified: false, cancellation_rate_30d: 0.14,
    on_time_rate: 0.83, rank_reason_urdu: 'جملہ آئی ٹی سروسز', score: 70 },
];

const COOK_PROVIDERS = [
  { id: 'cook1', name: 'Chef Rizwan Home Cook', category: 'cook', rating: 4.8, total_reviews: 156,
    base_rate_pkr: 1500, trust_score: 91, verified: true, cancellation_rate_30d: 0.02,
    on_time_rate: 0.95, rank_reason_urdu: 'ماہر باورچی، پاکستانی کھانے', score: 91 },
  { id: 'cook2', name: 'Bibi Ji Catering', category: 'cook', rating: 4.5, total_reviews: 98,
    base_rate_pkr: 1000, trust_score: 78, verified: true, cancellation_rate_30d: 0.06,
    on_time_rate: 0.88, rank_reason_urdu: 'گھریلو کھانا، عید سپیشل', score: 78 },
  { id: 'cook3', name: 'Daig Wala Catering', category: 'cook', rating: 4.1, total_reviews: 211,
    base_rate_pkr: 700, trust_score: 65, verified: false, cancellation_rate_30d: 0.18,
    on_time_rate: 0.80, rank_reason_urdu: 'سستا لیکن تقریبات کے لیے', score: 65 },
];

const SECURITY_PROVIDERS = [
  { id: 'sec1', name: 'Eagle Eye Security', category: 'security', rating: 4.7, total_reviews: 87,
    base_rate_pkr: 2500, trust_score: 89, verified: true, cancellation_rate_30d: 0.02,
    on_time_rate: 0.93, rank_reason_urdu: 'تجربہ کار گارڈ، رات کی ڈیوٹی', score: 89 },
  { id: 'sec2', name: 'Safe Guard Services', category: 'security', rating: 4.4, total_reviews: 56,
    base_rate_pkr: 2000, trust_score: 76, verified: true, cancellation_rate_30d: 0.05,
    on_time_rate: 0.87, rank_reason_urdu: 'تصدیق شدہ سیکیورٹی', score: 76 },
  { id: 'sec3', name: 'Watchman On Call', category: 'security', rating: 4.0, total_reviews: 34,
    base_rate_pkr: 1500, trust_score: 60, verified: false, cancellation_rate_30d: 0.20,
    on_time_rate: 0.78, rank_reason_urdu: 'سستا لیکن جزوقتی', score: 60 },
];

const GARDENER_PROVIDERS = [
  { id: 'grd1', name: 'Green Thumb Nursery', category: 'gardener', rating: 4.7, total_reviews: 143,
    base_rate_pkr: 800, trust_score: 87, verified: true, cancellation_rate_30d: 0.03,
    on_time_rate: 0.91, rank_reason_urdu: 'ماہر مالی، پودے بھی دستیاب', score: 87 },
  { id: 'grd2', name: 'Ali Garden Services', category: 'gardener', rating: 4.4, total_reviews: 98,
    base_rate_pkr: 600, trust_score: 75, verified: true, cancellation_rate_30d: 0.07,
    on_time_rate: 0.86, rank_reason_urdu: 'معقول قیمت، تجربہ کار', score: 75 },
  { id: 'grd3', name: 'Karim Plant Care', category: 'gardener', rating: 4.0, total_reviews: 67,
    base_rate_pkr: 400, trust_score: 60, verified: false, cancellation_rate_30d: 0.19,
    on_time_rate: 0.78, rank_reason_urdu: 'سستا باغبان', score: 60 },
];

const TAILOR_PROVIDERS = [
  { id: 'tail1', name: 'Master Tailor Saeed', category: 'tailor', rating: 4.8, total_reviews: 389,
    base_rate_pkr: 1000, trust_score: 92, verified: true, cancellation_rate_30d: 0.01,
    on_time_rate: 0.96, rank_reason_urdu: 'ماہر درزی، ڈیزائنر کپڑے', score: 92 },
  { id: 'tail2', name: 'Fatima Ladies Tailor', category: 'tailor', rating: 4.6, total_reviews: 234,
    base_rate_pkr: 700, trust_score: 82, verified: true, cancellation_rate_30d: 0.04,
    on_time_rate: 0.91, rank_reason_urdu: 'خواتین کپڑے، عید سپیشل', score: 82 },
  { id: 'tail3', name: 'Quick Stitch Tailors', category: 'tailor', rating: 4.2, total_reviews: 156,
    base_rate_pkr: 500, trust_score: 66, verified: false, cancellation_rate_30d: 0.17,
    on_time_rate: 0.81, rank_reason_urdu: 'تیز سلائی، کم قیمت', score: 66 },
];

// ─── Service type detection ─────────────────────────────────────────────────

export const detectServiceType = (message: string): string => {
  const m = message.toLowerCase();
  if (m.includes('ac') || m.includes('cooling') || m.includes('thand') || m.includes('aircondition') || m.includes('air condition') || m.includes('cooler')) return 'AC_repair';
  if (m.includes('plumb') || m.includes('pipe') || m.includes('pani') || m.includes('nal') || m.includes('toilet') || m.includes('drain') || m.includes('leak')) return 'plumbing';
  if (m.includes('electr') || m.includes('bijli') || m.includes('wiring') || m.includes('short') || m.includes('circuit') || m.includes('current') || m.includes('plug') || m.includes('light')) return 'electrical';
  if (m.includes('tutor') || m.includes('teacher') || m.includes('padhai') || m.includes('math') || m.includes('english class') || m.includes('ustaz') || m.includes('parhai') || m.includes('student')) return 'tutoring';
  if (m.includes('driver') || m.includes('taxi') || m.includes('gari') || m.includes('ride') || m.includes('car service') || m.includes('cab')) return 'driver';
  if (m.includes('clean') || m.includes('safai') || m.includes('sweep') || m.includes('maid') || m.includes('bai') || m.includes('kaam wali')) return 'home_cleaning';
  if (m.includes('mechanic') || m.includes('car repair') || m.includes('engine') || m.includes('tyre') || m.includes('gari kharab')) return 'mechanic';
  if (m.includes('beauty') || m.includes('parlor') || m.includes('makeup') || m.includes('bridal') || m.includes('mehendi') || m.includes('salon')) return 'beautician';
  if (m.includes('carpen') || m.includes('furniture') || m.includes('door') || m.includes('wood') || m.includes('almari') || m.includes('lakri')) return 'carpenter';
  if (m.includes('paint') || m.includes('rang') || m.includes('wall') || m.includes('colour')) return 'painter';
  if (m.includes('freelanc') || m.includes('logo') || m.includes('website') || m.includes('design') || m.includes('graphic') || m.includes('it')) return 'freelancer';
  if (m.includes('cook') || m.includes('chef') || m.includes('khana') || m.includes('cater') || m.includes('food') || m.includes('daig')) return 'cook';
  if (m.includes('security') || m.includes('guard') || m.includes('watchman') || m.includes('chaukidar')) return 'security';
  if (m.includes('garden') || m.includes('mali') || m.includes('plant') || m.includes('grass') || m.includes('flower')) return 'gardener';
  if (m.includes('tailor') || m.includes('darzi') || m.includes('silai') || m.includes('kapra') || m.includes('suit') || m.includes('dress')) return 'tailor';
  if (m.includes('cook') || m.includes('chef') || m.includes('khana') || m.includes('cater')) return 'cook';
  return '';
};

/** Detect if the user's message is in Roman Urdu or English */
const URDU_WORDS = /\b(mujhe|mijhay|mijhe|mujhey|chahiye|chahye|chaye|chahate|karo|koi|wala|wali|dedo|bhi|nahi|nahin|na|nai|abhi|yahan|kahan|kitna|hai|hain|ha|ho|ka|ke|ki|aur|se|mein|me|ho|raha|rahi|kar|karna|krna|milao|btao|bata|zaroorat|zarorat|kam|band|thand|garam|kaam|kharab|ghar|per|par|mera|meray|hamaray|paisay|paisey|paise|aj|aaj|sham|shyam|rat|raat|subha|subah|niklo|nikalo|hoga|honge|gya|gyi|gaya|gai|kab|taq|tak|jaldi|urgent|asap|mashwara|pucho|puchna|puchiye|bataiye|aap|ap|tujhe|khairiyat|theek|thik|thek|ji|g|boht|bohat|zyada|ziada|hogya|hogaya|hogai|shukriya|shukria|thanks|ayen|aye|kab|tab|jab|kya|kyun|kaisa|kaise|kaisee|hua|hui|huye|kia|hay)\b/i;

export const detectLanguage = (message: string): 'urdu' | 'en' => {
  const words = message.toLowerCase().split(/\s+/);
  let urduCount = 0;
  for (const w of words) {
    if (URDU_WORDS.test(w)) urduCount++;
  }
  // Enhanced detection: even 1 strong urdu keyword or 15% density triggers Roman Urdu mode
  return (urduCount >= 1 || (urduCount / Math.max(words.length, 1)) >= 0.15) ? 'urdu' : 'en';
};

/** Map API payload to store-friendly AgentResponse */
export const normalizeAgentResponse = (data: Record<string, unknown>): AgentResponse => {
  const needs = Boolean(data.needs_clarification);
  const qUrdu = (data.clarification_question_urdu as string) || (needs ? (data.response_urdu as string) : undefined);
  const qEn = (data.clarification_question_en as string) || (needs ? (data.response_en as string) : undefined);
  const serviceType = data.service_type as string | undefined;
  const rawProviders = ((data.providers as unknown[]) || []) as Provider[];
  const providers = serviceType
    ? filterProvidersForService(rawProviders, serviceType)
    : rawProviders;
  return {
    ...(data as unknown as AgentResponse),
    needs_clarification: needs,
    clarification_question_urdu: qUrdu,
    clarification_question_en: qEn,
    trace_log: (((data.trace_log as unknown[]) || []) as TraceStep[]),
    providers,
    waitlist: providers.length === 0 && !!serviceType && !needs,
  };
};

const PROVIDER_MAP: Record<string, any[]> = {
  AC_repair: AC_PROVIDERS,
  plumbing: PLUMBING_PROVIDERS,
  electrical: ELECTRICAL_PROVIDERS,
  tutoring: TUTORING_PROVIDERS,
  beautician: BEAUTICIAN_PROVIDERS,
  mechanic: MECHANIC_PROVIDERS,
  driver: DRIVER_PROVIDERS,
  home_cleaning: CLEANING_PROVIDERS,
  carpenter: CARPENTER_PROVIDERS,
  painter: PAINTER_PROVIDERS,
  freelancer: FREELANCER_PROVIDERS,
  cook: COOK_PROVIDERS,
  security: SECURITY_PROVIDERS,
  gardener: GARDENER_PROVIDERS,
  tailor: TAILOR_PROVIDERS,
};

/** Never return AC/cooling providers for tutoring requests */
export function filterProvidersForService(
  providers: Provider[],
  serviceType: string
): Provider[] {
  if (!serviceType || !providers.length) return providers;
  const st = serviceType.toLowerCase();
  if (st !== 'tutoring') return providers;

  return providers.filter((p) => {
    const svcTypes = p.service_types;
    const cat = String((p as unknown as { category?: string }).category || svcTypes?.[0] || '').toLowerCase();
    const types = Array.isArray(p.service_types)
      ? p.service_types.map((t) => t.toLowerCase())
      : [cat];
    const joined = types.join(' ');
    if (/ac|cooling|air.?condition/.test(joined)) return false;
    return /tutor|teach|education|academy|ustad/.test(joined) || cat === 'tutoring';
  });
}

const SERVICE_LABELS: Record<string, string> = {
  AC_repair: 'AC Repair', plumbing: 'Plumbing', electrical: 'Electrical',
  tutoring: 'Tutoring', beautician: 'Beautician', mechanic: 'Mechanic',
  driver: 'Driver', home_cleaning: 'Home Cleaning', carpenter: 'Carpenter',
  painter: 'Painter', freelancer: 'Freelancer', cook: 'Cook/Chef',
  security: 'Security Guard', gardener: 'Gardener', tailor: 'Tailor',
};

// ─── API functions ───────────────────────────────────────────────────────────

export const sendRequest = async (
  message: string,
  sessionId: string,
  userId: string,
  location?: { latitude: number; longitude: number },
  options?: { 
    serviceTypeHint?: string; 
    appendContext?: string;
    role?: 'customer' | 'provider';
    userContext?: {
      name: string;
      recentServices: string[];
      historyStats: { confirmed: number; cancelled: number; disputed: number };
      address: string;
    }
  }
): Promise<AgentResponse> => {
  const serviceTypeHint = options?.serviceTypeHint || detectServiceType(message);
  const fullMessage = options?.appendContext
    ? `${options.appendContext}\n${message}`
    : message;

  const role = options?.role || 'customer';

  try {
    const res = await api.post('/api/request', {
      message: fullMessage,
      session_id: sessionId,
      user_id: userId,
      service_type: serviceTypeHint || undefined,
      location: location ? `${location.latitude},${location.longitude}` : undefined,
      user_context: options?.userContext,
      role: role,
    });
    return normalizeAgentResponse(res.data);
  } catch (e) {
    const err = e as AxiosError;
    const isNetwork =
      err.code === 'ECONNABORTED' ||
      err.code === 'ERR_NETWORK' ||
      err.message === 'Network Error' ||
      !err.response;

    const serviceType = serviceTypeHint || detectServiceType(message) || 'general';
    const label = SERVICE_LABELS[serviceType] || 'service';
    const userName = options?.userContext?.name || 'there';
    const lang = detectLanguage(message);

    // ─── Provider Specific Assistant Logic ───
    if (role === 'provider') {
      let responseEn = '';
      let responseUrdu = '';

      if (message.toLowerCase().includes('earning') || message.toLowerCase().includes('tip')) {
        responseEn = `Hello ${userName}, here are some earning tips: Completing 5 jobs this week with 4.5+ rating can boost your visibility by 20%. Try staying online during peak hours (6 PM - 10 PM) for 1.5x surge pricing.`;
        responseUrdu = `${userName}, kamai barhanay ki tip: Agar aap is haftay 5 jobs 4.5+ rating se mukammal karen ge to aap ki visibility 20% barh jaye gi. Peak hours (shaam 6 se raat 10) mein online rahen taakay 1.5x surge rates mil saken.`;
      } else if (serviceType !== 'general') {
        responseEn = `For ${label} in ${locationMatches(message) || 'your area'}, the average market rate is Rs 700 - Rs 1200. Based on your 4.6 rating and expertise, I suggest charging Rs 900 for a standard job to maintain high conversion.`;
        responseUrdu = `${label} ke liye ${locationMatches(message) || 'aap ke area'} mein market rates Rs 700 se 1200 chal rahay hain. Aap ki 4.6 rating ke mutabiq mein Rs 900 suggest kerta hoon taakay aap ko zyada jobs mil saken.`;
      } else {
        responseEn = `Hello ${userName}, I'm your Provider Assistant. Ask me about market rates, earning tips, or your performance stats.`;
        responseUrdu = `Assalam-o-Alaikum ${userName}, mein aap ka Provider Assistant hoon. Mujhse market rates, kamai ki tips ya apni performance ke baray mein pochen.`;
      }

      return normalizeAgentResponse({
        confidence: 0.9,
        response_en: lang === 'urdu' ? responseUrdu : responseEn,
        response_urdu: responseUrdu,
        providers: [],
        trace_log: [{ step: 1, agent: 'provider_concierge', action: 'stats_analysis', duration_ms: 5 }],
      });
    }

    // ─── Customer Specific Assistant Logic (Offline) ───
    let providers =
      serviceType && PROVIDER_MAP[serviceType]
        ? PROVIDER_MAP[serviceType]
        : [];
    providers = filterProvidersForService(providers, serviceType) as typeof providers;

    const loc = locationMatches(message) || 'your area';
    const budget = budgetMatches(message);

    const missing = detectMissingFields(message, serviceType);
    // Be more lenient: only trigger clarification if at least 2 critical fields are missing
    if (hasMissingFields(missing)) {
      const q = buildClarificationQuestion(missing, label);
      
      const responseText = lang === 'urdu' 
        ? `${userName}, aap ke ${label} request ke liye thori aur detail chahiye: ${q.romanUrdu}`
        : `Hello ${userName}, for your ${label} request, I need a few more details: ${q.en}`;
        
      return normalizeAgentResponse({
        needs_clarification: true,
        confidence: 0.55,
        service_type: serviceType || undefined,
        clarification_question_en: q.en,
        clarification_question_urdu: lang === 'urdu' ? q.romanUrdu : q.urdu,
        response_en: responseText,
        response_urdu: responseText, // responseText already accounts for lang
        providers: [],
        trace_log: [{ step: 1, agent: 'nlu', action: 'offline_clarification_needed', duration_ms: 0 }],
      });
    }

    if (providers.length === 0) {
      return normalizeAgentResponse({
        needs_clarification: true,
        confidence: 0.5,
        response_en: 'Which service do you need? e.g. AC Repair, Plumbing, Tutoring...',
        response_urdu: 'Aap ko konsi service chahiye? Maslan: AC Repair, Plumbing ye Tutoring...',
        providers: [],
        trace_log: [{ step: 1, agent: 'coordinator', action: 'service_type_unknown', duration_ms: 0 }],
      });
    }

    const isUrgent = /urgent|abhi|jaldi|asap|emergency/i.test(message);
    const hasPeakTime = new Date().getHours() >= 18 || new Date().getHours() <= 2;
    const surgeTextEn = hasPeakTime ? " (Peak hour demand surge of +Rs 50 applied)" : "";
    const surgeTextUrdu = hasPeakTime ? " (Peak time ki wajah se Rs 50 surge charges shamil hain)" : "";

    // Greeting/Generic handling
    if (/^(hi|hello|hey|asalam|salam|hola|hi karigar|hello karigar)/i.test(message)) {
      const stats = options?.userContext?.historyStats;
      const historyStr = stats ? ` (You have ${stats.confirmed} successful bookings with us!)` : '';
      const suggestion = options?.userContext?.recentServices?.[0] 
        ? ` Looking for ${SERVICE_LABELS[options.userContext.recentServices[0]] || 'more services'} again?` 
        : " How can I help you find a professional today?";

      return normalizeAgentResponse({
        confidence: 1.0,
        response_en: lang === 'urdu' ? `Assalam-o-Alaikum ${userName}! Mein Karigar AI hoon.${historyStr}${suggestion}` : `Hello ${userName}! I'm Karigar AI.${historyStr}${suggestion}`,
        response_urdu: `Assalam-o-Alaikum ${userName}! Mein Karigar AI hoon.${historyStr}${suggestion}`,
        providers: [],
        trace_log: [{ step: 1, agent: 'concierge', action: 'greeting', duration_ms: 10 }],
      });
    }

    const responseEn = `Hello ${userName}, regarding your request for ${label}: I found ${providers.length} professional matches near ${loc}. ${providers[0].name} (Rated ${providers[0].rating}) is highly recommended for this. Final charges will be based on urgency and time slot selected.${surgeTextEn} What's your preferred time?`;
    const responseUrdu = `Assalam-o-alaikum ${userName}, aap ki ${label} request ke liye mujhe ${providers.length} matches mile hain ${loc} ke qareeb. Sab se behtar ${providers[0].name} hain. ${isUrgent ? 'Urgent request ke high charges honge.' : 'Charges urgency aur time slot pe depend karen ge.'}${surgeTextUrdu} Aap ko kis time service chahiye? (Baseline budget Rs ${budget ?? 500})`;
    
    return normalizeAgentResponse({
      service_type: serviceType,
      location: loc,
      urgency: isUrgent ? 5 : 3,
      budget: budget ?? 500,
      confidence: 0.85,
      response_en: lang === 'urdu' ? responseUrdu : responseEn,
      response_urdu: responseUrdu,
      trace_log: [
        { step: 1, agent: 'nlu', action: `offline_${serviceType}`, duration_ms: 0 },
        { step: 2, agent: 'search', action: `matched_${providers.length}_local_pros`, duration_ms: 0 },
      ],
      providers,
    });
  }
};

// Helper extractors
const locationMatches = (msg: string) => {
  const m = msg.match(/\b([A-Z]-?\d+(?:\/\d+)?)\b/i);
  return m ? m[1] : null;
};
const budgetMatches = (msg: string) => {
  const m = msg.match(/(?:budget|rs\.?|rupees?)\s*:?\s*(\d+)/i);
  return m ? parseInt(m[1], 10) : null;
};

/** @deprecated removed due to reliability issues */
export const transcribeVoice = async (uri: string): Promise<string> => {
  return "Voice features are currently unavailable.";
};

export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const res = await api.get('/health', { timeout: 8000 });
    return res.data?.status === 'ok';
  } catch {
    return false;
  }
};

export const getProviders = async () => {
  try {
    const res = await api.get('/api/providers');
    return (Array.isArray(res.data) ? res.data : []) as Provider[];
  } catch {
    return [];
  }
};

export const getProviderSlots = async (providerId: string, date: string) => {
  try {
    const res = await api.get(`/api/provider/${providerId}/slots?date=${date}`);
    return res.data;
  } catch {
    return {
      slots: [
        { time: '9:00 AM', available: true },
        { time: '11:00 AM', available: true },
        { time: '1:00 PM', available: false },
        { time: '3:00 PM', available: true },
        { time: '5:00 PM', available: true },
        { time: '7:00 PM', available: false },
      ],
    };
  }
};

export const simulateCancel = async (bookingId: string) => {
  try {
    const res = await api.post(`/api/simulate/cancel/${bookingId}`);
    return res.data;
  } catch {
    return { status: 'cancelled', new_booking: null };
  }
};

export const submitDispute = async (bookingId: string, complaint: string, category?: string) => {
  try {
    const res = await api.post(`/api/booking/${bookingId}/dispute`, {
      complaint,
      reason: complaint,
      category,
    });
    return res.data;
  } catch {
    // Simulate AI processing delay
    await new Promise(r => setTimeout(r, 1500));
    return { 
      dispute_id: `DISP-${Date.now()}`, 
      status: 'submitted', 
      message: 'Karigar AI Dispute Agent has registered your case. We will contact both parties within 2 hours.' 
    };
  }
};

export const updateProviderReview = async (providerId: string, rating: number, review: string) => {
  try {
    const res = await api.post(`/api/provider/${providerId}/review`, { rating, review });
    return res.data as { success?: boolean; new_score?: number | null; score_change?: number };
  } catch {
    const delta = rating >= 4 ? 2 : rating <= 2 ? -3 : 0;
    return { success: false, new_score: null, score_change: delta };
  }
};

export const getProviderRequests = async (providerId?: string) => {
  try {
    const q = providerId ? `?provider_id=${encodeURIComponent(providerId)}` : '';
    const res = await api.get(`/api/provider/requests${q}`);
    return res.data?.requests || res.data || [];
  } catch {
    return [
      {
        id: 'REQ-001',
        service_type: 'AC_repair',
        location: 'G-13, Street 45',
        budget: 800,
        urgency: 5,
        minutes_ago: 2,
        status: 'pending',
      },
      {
        id: 'REQ-002',
        service_type: 'plumbing',
        location: 'F-10',
        budget: 600,
        urgency: 3,
        minutes_ago: 18,
        status: 'pending',
      },
    ];
  }
};
