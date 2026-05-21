import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TraceStep {
  step: number;
  agent: string;
  action: string;
  duration_ms: number;
  output_summary?: string;
}

export interface Provider {
  id: string;
  name: string;
  role?: string;
  service_types?: string[];
  rating: number;
  total_reviews?: number;
  reviews?: number;
  distance?: number;
  base_rate_pkr?: number;
  baseRate?: number;
  trust_score?: number;
  trustScore?: number;
  verified: boolean;
  cancellation_rate_30d?: number;
  score?: number;
  rank_reason_urdu?: string;
  avatar?: string;
}

export interface AgentResponse {
  service_type?: string;
  location?: string;
  urgency?: number;
  budget?: number;
  confidence?: number;
  response_en?: string;
  response_urdu?: string;
  trace_log: TraceStep[];
  providers?: Provider[];
  waitlist?: boolean;
  negotiation_result?: {
    negotiation_needed: boolean;
    agreed_price?: number;
    offer_urdu?: string;
    savings?: number;
  };
  booking_id?: string;
  needs_clarification?: boolean;
  clarification_question_urdu?: string;
  clarification_question_en?: string;
}

interface Booking {
  id: string;
  provider_name?: string;
  service_type?: string;
  slot_time?: string;
  location?: string;
  agreed_price?: number;
  status?: string;
  createdAt?: string; // ISO timestamp for earnings calculations
  urgency?: number;
  originalPrice?: number;
  refundAmount?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  date: string;
  messages: Array<{role: 'user'|'ai', content: string, timestamp?: Date}>;
}

export type ProviderJobStatus = 'pending' | 'active' | 'completed' | 'cancelled';

export interface ProviderJob {
  id: string;
  requestId?: string;
  customerName: string;
  serviceType: string;
  locationLabel: string;
  budget: number;
  urgency: number;
  distanceKm?: number;
  status: ProviderJobStatus;
  createdAt: string; // ISO
}

export type SpecializationLevel = 'basic' | 'intermediate' | 'expert';
export type CancellationPolicyOption = 'free' | 'rs100' | 'no_cancel';

/** Full per-service profile (Phase 2). Persisted as Record<serviceType, ServiceProfile>. */
export interface ServiceProfile {
  serviceType: string;
  baseRatePkr: number;
  minBudgetPkr: number;
  notes: string;
  isActive: boolean;
  specialization: SpecializationLevel;
  yearsExperience: number;
  /** 0–100 */
  onTimeRate: number;
  /** km; 999 = Anywhere */
  travelRadiusKm: 2 | 5 | 10 | 999;
  availability: string[];
  preferredHours: string[];
  cancellationPolicy: CancellationPolicyOption;
}

/** @deprecated use ServiceProfile — kept as alias for imports */
export type ProviderServiceProfile = ServiceProfile;

export const TRAVEL_ANYWHERE_KM = 999 as const;

export function defaultServiceProfile(serviceType: string): ServiceProfile {
  return {
    serviceType,
    baseRatePkr: 800,
    minBudgetPkr: 600,
    notes: '',
    isActive: true,
    specialization: 'intermediate',
    yearsExperience: 2,
    onTimeRate: 90,
    travelRadiusKm: 5,
    availability: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    preferredHours: ['Morning', 'Afternoon'],
    cancellationPolicy: 'free',
  };
}

function migrateLegacyServiceRow(p: Partial<ServiceProfile> & { serviceType: string }): ServiceProfile {
  const d = defaultServiceProfile(p.serviceType);
  return {
    ...d,
    ...p,
    serviceType: p.serviceType,
    baseRatePkr: typeof p.baseRatePkr === 'number' ? p.baseRatePkr : d.baseRatePkr,
    minBudgetPkr: typeof p.minBudgetPkr === 'number' ? p.minBudgetPkr : d.minBudgetPkr,
    notes: typeof p.notes === 'string' ? p.notes : d.notes,
    isActive: typeof p.isActive === 'boolean' ? p.isActive : d.isActive,
    specialization: p.specialization ?? d.specialization,
    yearsExperience: typeof p.yearsExperience === 'number' ? p.yearsExperience : d.yearsExperience,
    onTimeRate: typeof p.onTimeRate === 'number' ? p.onTimeRate : d.onTimeRate,
    travelRadiusKm: ([2, 5, 10, 999] as const).includes(p.travelRadiusKm as 2 | 5 | 10 | 999)
      ? (p.travelRadiusKm as 2 | 5 | 10 | 999)
      : d.travelRadiusKm,
    availability: Array.isArray(p.availability) && p.availability.length ? p.availability : d.availability,
    preferredHours: Array.isArray(p.preferredHours) && p.preferredHours.length ? p.preferredHours : d.preferredHours,
    cancellationPolicy: p.cancellationPolicy ?? d.cancellationPolicy,
  };
}

/** Normalize persisted state: array (legacy) → Record */
export function normalizeServiceProfiles(input: unknown): Record<string, ServiceProfile> {
  if (!input) return {};
  if (Array.isArray(input)) {
    const rec: Record<string, ServiceProfile> = {};
    for (const row of input) {
      const st = (row as { serviceType?: string })?.serviceType;
      if (st) rec[st] = migrateLegacyServiceRow(row as ServiceProfile);
    }
    return rec;
  }
  if (typeof input === 'object') {
    const out: Record<string, ServiceProfile> = {};
    for (const [k, v] of Object.entries(input as Record<string, Partial<ServiceProfile>>)) {
      if (v && typeof v === 'object' && (v.serviceType || k)) {
        const st = v.serviceType || k;
        out[st] = migrateLegacyServiceRow({ ...v, serviceType: st });
      }
    }
    return out;
  }
  return {};
}

export interface InAppChatMessage {
  id: string;
  from: 'customer' | 'provider';
  text: string;
  createdAt: string; // ISO
}

export interface ProviderDashboard {
  todayEarningsPkr: number;
  weekEarningsPkr: number;
  monthEarningsPkr: number;
  pendingJobs: number;
  activeJobs: number;
  completedJobs: number;
  lastPayoutPkr: number;
}

interface AppState {
  sessionId: string;
  userId: string;
  messages: Array<{role: 'user'|'ai', content: string, timestamp: Date}>;
  currentResponse: AgentResponse | null;
  traceLog: TraceStep[];
  providers: Provider[];
  selectedProvider: Provider | null;
  currentBooking: Booking | null;
  isLoading: boolean;
  isDemoMode: boolean;
  demoModalVisible: boolean;
  theme: 'light' | 'dark';
  isProviderMode: boolean;
  notificationsEnabled: boolean;
  preferredSlot: string | null;
  serviceHistory: string[];
  providerMinBudget: number;
  firebaseUid: string | null;
  
  // Auth State
  isAuthenticated: boolean;
  role: 'customer' | 'provider' | null;
  
  // Chat History State
  chatSessions: ChatSession[];
  saveCurrentSession: () => void;
  loadSession: (id: string) => void;
  startNewSession: () => void;
  
  // Profile
  userName: string;
  userEmail: string;
  userAddress: string;
  
  setLoading: (v: boolean) => void;
  addMessage: (role: 'user'|'ai', content: string) => void;
  setResponse: (r: AgentResponse) => void;
  setProviders: (p: Provider[]) => void;
  setSelectedProvider: (p: Provider | null) => void;
  setCurrentBooking: (b: Booking | null) => void;
  setDemoMode: (v: boolean) => void;
  setDemoModalVisible: (v: boolean) => void;
  setTheme: (t: 'light' | 'dark') => void;
  setProviderMode: (v: boolean) => void;
  setNotificationsEnabled: (v: boolean) => void;
  setPreferredSlot: (slot: string | null) => void;
  recordServiceHistory: (serviceType: string) => void;
  setProviderMinBudget: (n: number) => void;
  
  login: (role: 'customer' | 'provider', name: string, email: string, uid?: string) => void;
  logout: () => void;
  clearSession: () => void;
  
  // Profile Setters
  setUserName: (name: string) => void;
  setUserEmail: (email: string) => void;
  setUserAddress: (address: string) => void;
  
  // Update provider score locally
  updateProviderTrustScore: (id: string, newScore: number) => void;

  bookingHistory: Booking[];
  addBooking: (b: Booking) => void;
  pendingServiceType: string | null;
  setPendingServiceType: (t: string | null) => void;
  providerServices: string[];
  setProviderServices: (services: string[]) => void;

  // ── Phase 2 additions (do not remove existing fields) ────────────────────
  providerOnline: boolean;
  providerActiveJob: ProviderJob | null;
  providerServiceProfiles: Record<string, ServiceProfile>;
  providerVerified: boolean;
  providerScore: number; // calculated
  /** Mock aggregate customer rating for this provider (1–5), updated when feedback is submitted */
  providerAvgRatingLocal: number;
  providerReviewCountLocal: number;
  providerDashboard: ProviderDashboard;
  inAppChatMessages: Record<string, InAppChatMessage[]>; // key: threadId
  customerPhone: string;
  providerPhone: string;

  setProviderOnline: (v: boolean) => void;
  setProviderActiveJob: (job: ProviderJob | null) => void;
  setProviderServiceProfiles: (profiles: Record<string, ServiceProfile> | ServiceProfile[]) => void;
  upsertProviderServiceProfile: (profile: Partial<ServiceProfile> & { serviceType: string }) => void;
  recordProviderReviewReceived: (stars: number) => void;
  setProviderVerified: (v: boolean) => void;
  setCustomerPhone: (phone: string) => void;
  setProviderPhone: (phone: string) => void;
  addInAppChatMessage: (threadId: string, msg: Omit<InAppChatMessage, 'id' | 'createdAt'> & { id?: string; createdAt?: string }) => void;
  calculateProviderScore: () => number;
  recomputeProviderDashboard: () => void;
  
  providerIncomingRequests: IncomingRequest[];
  addIncomingRequest: (req: IncomingRequest) => void;
  acceptIncomingRequest: (reqId: string) => void;
  declineIncomingRequest: (reqId: string) => void;
  
  // New: Global Notification (Replacement for unreliable Expo Notifications)
  globalNotification: { title: string; body: string; type: 'success' | 'info' | 'warning' } | null;
  notify: (title: string, body: string, type?: 'success' | 'info' | 'warning') => void;
  dismissNotification: () => void;
  
  // New: AI Dispute Resolution Helper
  resolveDispute: (bookingId: string) => number; // Returns refund amount
  
  // New: Context Helpers for AI
  getUserContext: () => {
    name: string;
    recentServices: string[];
    historyStats: { confirmed: number; cancelled: number; disputed: number };
    address: string;
    role: string;
  };
}

export type IncomingRequest = {
  id: string;
  service_type: string;
  location: string;
  budget: number;
  urgency: number;
  minutes_ago: number;
  status: string;
  customerName?: string;
  customerId?: string;
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      sessionId: `session-${Date.now()}`,
      userId: 'user-demo',
      messages: [],
      currentResponse: null,
      traceLog: [],
      providers: [],
      selectedProvider: null,
      currentBooking: null,
      isLoading: false,
      isDemoMode: false,
      demoModalVisible: false,
      theme: 'dark',
      isProviderMode: false,
      notificationsEnabled: true,
      preferredSlot: null,
      serviceHistory: [],
      providerMinBudget: 500,
      firebaseUid: null,
      isAuthenticated: false,
      role: null,
      chatSessions: [
        { id: '1', title: 'AC Repair Inquiry', date: 'Yesterday', messages: [{ role: 'ai', content: 'You requested an AC mechanic. I found 3 matches.' }] },
        { id: '2', title: 'Need a plumber', date: 'Monday', messages: [{ role: 'ai', content: 'You requested a plumber for emergency leak. I found Hassan Plumbing.' }] }
      ],
      userName: '',
      userEmail: '',
      userAddress: '',
      bookingHistory: [],
      pendingServiceType: null,
      providerServices: [],

      providerOnline: false,
      providerActiveJob: null,
      providerServiceProfiles: {},
      providerVerified: false,
      providerScore: 0,
      providerAvgRatingLocal: 4.6,
      providerReviewCountLocal: 0,
      providerDashboard: {
        todayEarningsPkr: 0,
        weekEarningsPkr: 0,
        monthEarningsPkr: 0,
        pendingJobs: 0,
        activeJobs: 0,
        completedJobs: 0,
        lastPayoutPkr: 0,
      },
      inAppChatMessages: {},
      customerPhone: '+923001234567',
      providerPhone: '+923009876543',
      providerIncomingRequests: [
        {
          id: 'REQ-DEMO-1',
          service_type: 'plumbing',
          location: 'G-13/1, Islamabad',
          budget: 850,
          urgency: 4,
          minutes_ago: 3,
          status: 'pending',
          customerName: 'Ahmad Ali'
        },
        {
          id: 'REQ-DEMO-2',
          service_type: 'electrical',
          location: 'F-10/2, Islamabad',
          budget: 1200,
          urgency: 5,
          minutes_ago: 12,
          status: 'pending',
          customerName: 'Sarah K.'
        }
      ],
      addIncomingRequest: (req) => set((s) => ({
        providerIncomingRequests: [req, ...s.providerIncomingRequests]
      })),
      acceptIncomingRequest: (reqId) => {
        const s = get();
        const req = s.providerIncomingRequests.find(r => r.id === reqId);
        if (!req) return;
        
        // 1. Mark booking as confirmed in history
        const updatedHistory = s.bookingHistory.map(b => 
          b.id === reqId ? { ...b, status: 'confirmed' } : b
        );
        
        // 2. Set as active job for provider
        const newJob: ProviderJob = {
          id: reqId,
          customerName: req.customerName || 'Customer',
          serviceType: req.service_type,
          locationLabel: req.location,
          budget: req.budget,
          urgency: req.urgency,
          status: 'active',
          createdAt: new Date().toISOString()
        };
        
        set({
          bookingHistory: updatedHistory,
          providerActiveJob: newJob,
          providerIncomingRequests: s.providerIncomingRequests.filter(r => r.id !== reqId)
        });
        
        s.notify('Job Accepted! ✅', `You've accepted the ${req.service_type} job. You can now chat and track location.`);
        s.recomputeProviderDashboard();
      },
      declineIncomingRequest: (reqId) => set((s) => ({
        providerIncomingRequests: s.providerIncomingRequests.filter(r => r.id !== reqId)
      })),
      
      globalNotification: null,
      notify: (title, body, type = 'info') => {
        set({ globalNotification: { title, body, type } });
        // Auto-dismiss after 6 seconds
        setTimeout(() => {
          if (get().globalNotification?.title === title) {
            set({ globalNotification: null });
          }
        }, 6000);
      },
      dismissNotification: () => set({ globalNotification: null }),
      
      resolveDispute: (bookingId) => {
        let refund = 0;
        set((state) => {
          let updatedScore = state.providerScore;

          const processBooking = (b: Booking) => {
            if (b.id === bookingId) {
              const originalPrice = b.originalPrice ?? b.agreed_price ?? 0;
              refund = Math.round(originalPrice * 0.25);
              updatedScore = Math.max(0, updatedScore - 15);
              return {
                ...b,
                status: 'refunded',
                originalPrice,          // keep the pre-dispute price
                refundAmount: refund,   // 25 % back
                agreed_price: originalPrice - refund,  // what customer actually paid
              };
            }
            return b;
          };

          const nextHistory = state.bookingHistory.map(processBooking);
          const nextCurrent =
            state.currentBooking
              ? (processBooking(state.currentBooking) as Booking)
              : null;

          return {
            bookingHistory: nextHistory,
            currentBooking: nextCurrent,
            providerScore: updatedScore,
          };
        });
        return refund;
      },

      setLoading: (v) => set({ isLoading: v }),
      addMessage: (role, content) => set((s) => ({
        messages: [...s.messages, {role, content, timestamp: new Date()}]
      })),
      setResponse: (r) => set({
        currentResponse: r,
        traceLog: r.trace_log || [],
        providers: r.providers || []
      }),
      setProviders: (p) => set({ providers: p }),
      setSelectedProvider: (p) => set({ selectedProvider: p }),
      setCurrentBooking: (b) => set({ currentBooking: b }),
      setDemoMode: (v) => set({ isDemoMode: v }),
      setDemoModalVisible: (v) => set({ demoModalVisible: v }),
      setTheme: (t) => set({ theme: t }),
      setProviderMode: (v) => set({ isProviderMode: v, role: v ? 'provider' : 'customer' }),
      setNotificationsEnabled: (v) => set({ notificationsEnabled: v }),
      setPreferredSlot: (slot) => set({ preferredSlot: slot }),
      recordServiceHistory: (serviceType) => set((state) => {
        const next = [serviceType, ...state.serviceHistory.filter((s) => s !== serviceType)].slice(0, 12);
        return { serviceHistory: next };
      }),
      setProviderMinBudget: (n) => set({ providerMinBudget: n }),
      login: (role, name, email, uid) => set({
        isAuthenticated: true,
        role,
        userName: name,
        userEmail: email,
        isProviderMode: role === 'provider',
        firebaseUid: uid || null,
        userId: uid || `user-${email.split('@')[0]}`,
      }),
      logout: () => {
        import('../services/firebaseAuth').then((m) => m.clearAuthSession()).catch(() => {});
        set({
          isAuthenticated: false,
          role: null,
          userName: '',
          userEmail: '',
          isProviderMode: false,
          firebaseUid: null,
        });
      },
      saveCurrentSession: () => set((state) => {
        if (state.messages.length === 0) return state;
        const exists = state.chatSessions.find(s => s.id === state.sessionId);
        if (exists) {
           return { chatSessions: state.chatSessions.map(s => s.id === state.sessionId ? { ...s, messages: state.messages } : s) };
        } else {
           const newSession = { id: state.sessionId, title: state.messages[0]?.content.substring(0, 20) + '...', date: 'Today', messages: state.messages };
           return { chatSessions: [newSession, ...state.chatSessions] };
        }
      }),
      loadSession: (id) => set((state) => {
        const session = state.chatSessions.find(s => s.id === id);
        if (session) {
          return { sessionId: id, messages: session.messages.map(m => ({ ...m, timestamp: m.timestamp ?? new Date() })), providers: [] as Provider[], currentResponse: null };
        }
        return state;
      }),
      startNewSession: () => set({
        sessionId: `KAI-SESS-${Date.now()}`,
        messages: [],
        currentResponse: null,
        providers: [],
      }),
      clearSession: () => set({
        messages: [],
        currentResponse: null,
        traceLog: [],
        providers: [],
        sessionId: `session-${Date.now()}`
      }),
      setUserName: (name) => set({ userName: name }),
      setUserEmail: (email) => set({ userEmail: email }),
      setUserAddress: (address) => set({ userAddress: address }),
      updateProviderTrustScore: (id, newScore) => set((state) => {
        const p = state.providers.map(prov => 
          prov.id === id ? { ...prov, trust_score: newScore, trustScore: newScore, score: newScore } : prov
        );
        const selected =
          state.selectedProvider?.id === id
            ? { ...state.selectedProvider, trust_score: newScore, trustScore: newScore, score: newScore }
            : state.selectedProvider;
        return { providers: p, selectedProvider: selected };
      }),
      addBooking: (b) => set((state) => ({
        currentBooking: b,
        bookingHistory: [
          { ...b, createdAt: b.createdAt || new Date().toISOString() },
          ...state.bookingHistory.filter((x) => x.id !== b.id),
        ],
      })),
      setPendingServiceType: (t) => set({ pendingServiceType: t }),
      setProviderServices: (services) => set({ providerServices: services }),

      setProviderOnline: (v) => set({ providerOnline: v }),
      setProviderActiveJob: (job) => set({ providerActiveJob: job }),
      setProviderServiceProfiles: (profiles) =>
        set({
          providerServiceProfiles: Array.isArray(profiles)
            ? normalizeServiceProfiles(profiles)
            : normalizeServiceProfiles(profiles),
        }),
      upsertProviderServiceProfile: (profile) =>
        set((state) => {
          const map = normalizeServiceProfiles(state.providerServiceProfiles);
          const prev = map[profile.serviceType];
          const merged: ServiceProfile = {
            ...defaultServiceProfile(profile.serviceType),
            ...prev,
            ...profile,
            serviceType: profile.serviceType,
          };
          return { providerServiceProfiles: { ...map, [profile.serviceType]: merged } };
        }),
      recordProviderReviewReceived: (stars) =>
        set((state) => {
          const n = Math.max(0, state.providerReviewCountLocal);
          const nextN = n + 1;
          const nextAvg =
            n === 0 ? stars : (state.providerAvgRatingLocal * n + stars) / nextN;
          return { providerReviewCountLocal: nextN, providerAvgRatingLocal: nextAvg };
        }),
      setProviderVerified: (v) => set({ providerVerified: v }),
      setCustomerPhone: (phone) => set({ customerPhone: phone }),
      setProviderPhone: (phone) => set({ providerPhone: phone }),
      addInAppChatMessage: (threadId, msg) => set((state) => {
        const now = new Date().toISOString();
        const nextMsg: InAppChatMessage = {
          id: msg.id || `MSG-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          createdAt: msg.createdAt || now,
          from: msg.from,
          text: msg.text,
        };
        const existing = state.inAppChatMessages[threadId] || [];
        return {
          inAppChatMessages: {
            ...state.inAppChatMessages,
            [threadId]: [...existing, nextMsg],
          },
        };
      }),
      calculateProviderScore: () => {
        const s = get();
        const profiles = Object.values(normalizeServiceProfiles(s.providerServiceProfiles)).filter((p) => p.isActive);
        const completed = s.bookingHistory.filter((b) => b.status === 'completed').length;
        const cancelled = s.bookingHistory.filter((b) => b.status === 'cancelled').length;
        const total = Math.max(1, s.bookingHistory.length);
        const cancelRate = cancelled / total;

        const avgRating = Math.min(5, Math.max(0, s.providerAvgRatingLocal ?? 4.5));
        const onTimePct =
          profiles.length > 0
            ? profiles.reduce((acc, p) => acc + (typeof p.onTimeRate === 'number' ? p.onTimeRate : 85), 0) /
              profiles.length
            : 85;
        const verifiedBonus = s.providerVerified ? 10 : 0;
        const reviewCount = Math.max(
          completed,
          s.providerReviewCountLocal ?? 0,
          profiles.length * 2
        );

        // Spec formula (components; clamped 0–100):
        // rating*20 + onTimeRate*20 + verifiedBonus + reviewCount*0.1 - cancellationPenalty*5
        // onTimeRate in UI is 0–100 → scale to match weight of rating arm (max ~20): use (onTimePct/100)*20
        const cancellationPenalty = cancelRate;
        const specRaw =
          avgRating * 20 +
          (onTimePct / 100) * 20 +
          verifiedBonus +
          reviewCount * 0.1 -
          cancellationPenalty * 5;

        // Legacy blend (keeps stability when few bookings): completion + coverage
        const completionRate = completed / total;
        const completionScore = Math.round(completionRate * 35);
        const serviceCoverage = Math.min(
          18,
          (profiles.length || s.providerServices.length || 0) * 3
        );
        const legacy = 28 + (s.providerVerified ? 10 : 0) + completionScore + serviceCoverage;

        const blended = Math.round(specRaw * 0.65 + legacy * 0.35);
        const score = Math.max(0, Math.min(100, blended));
        set({ providerScore: score });
        return score;
      },
      recomputeProviderDashboard: () => {
        const s = get();
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        const oneWeek = 7 * oneDay;
        const month = 30 * oneDay;

        const earnings = s.bookingHistory
          .filter((b) => (b.status === 'completed' || b.status === 'confirmed') && typeof b.agreed_price === 'number')
          .map((b) => ({
            createdAtMs: Date.parse(b.createdAt || new Date().toISOString()),
            amount: Number(b.agreed_price || 0),
          }))
          .filter((x) => Number.isFinite(x.createdAtMs));

        const sumInWindow = (ms: number) =>
          earnings
            .filter((e) => now - e.createdAtMs <= ms)
            .reduce((acc, e) => acc + e.amount, 0);

        const todayEarningsPkr = sumInWindow(oneDay);
        const weekEarningsPkr = sumInWindow(oneWeek);
        const monthEarningsPkr = sumInWindow(month);

        const completedJobs = s.bookingHistory.filter((b) => b.status === 'completed').length;
        const activeJobs = s.providerActiveJob ? 1 : 0;
        const pendingJobs = Math.max(0, s.providerDashboard.pendingJobs);
        const lastPayoutPkr = Math.round(monthEarningsPkr * 0.45);

        set({
          providerDashboard: {
            todayEarningsPkr,
            weekEarningsPkr,
            monthEarningsPkr,
            pendingJobs,
            activeJobs,
            completedJobs,
            lastPayoutPkr,
          },
        });
      },
      getUserContext: () => {
        const s = get();
        const confirmed = s.bookingHistory.filter(b => b.status === 'completed' || b.status === 'confirmed').length;
        const cancelled = s.bookingHistory.filter(b => b.status === 'cancelled').length;
        const disputed = s.bookingHistory.filter(b => b.status === 'disputed').length;
        
        return {
          name: s.userName || 'Guest',
          recentServices: s.serviceHistory.slice(0, 5),
          historyStats: { confirmed, cancelled, disputed },
          address: s.userAddress,
          role: s.role || 'customer'
        };
      },
    }),
    {
      name: 'karigar-store',
      version: 2,
      migrate: (persisted: unknown, version: number) => {
        const p = persisted as Record<string, unknown> | null;
        if (!p || typeof p !== 'object') return persisted;
        if (version < 2 && Array.isArray((p as { providerServiceProfiles?: unknown }).providerServiceProfiles)) {
          (p as { providerServiceProfiles: Record<string, ServiceProfile> }).providerServiceProfiles =
            normalizeServiceProfiles((p as { providerServiceProfiles: unknown[] }).providerServiceProfiles);
        }
        return persisted;
      },
      storage: createJSONStorage(() => AsyncStorage),
      merge: (persisted, current) => {
        const p = persisted as Partial<AppState> | undefined;
        if (!p) return current;
        return {
          ...current,
          ...p,
          providerServiceProfiles: normalizeServiceProfiles(p.providerServiceProfiles),
        };
      },
      partialize: (state) => ({
        messages: state.messages,
        userName: state.userName,
        userEmail: state.userEmail,
        userAddress: state.userAddress,
        theme: state.theme,
        sessionId: state.sessionId,
        isProviderMode: state.isProviderMode,
        isAuthenticated: state.isAuthenticated,
        role: state.role,
        chatSessions: state.chatSessions,
        bookingHistory: state.bookingHistory,
        currentBooking: state.currentBooking,
        notificationsEnabled: state.notificationsEnabled,
        serviceHistory: state.serviceHistory,
        providerMinBudget: state.providerMinBudget,
        firebaseUid: state.firebaseUid,
        preferredSlot: state.preferredSlot,
        providerServices: state.providerServices,

        // Phase 2 persisted fields
        providerOnline: state.providerOnline,
        providerActiveJob: state.providerActiveJob,
        providerServiceProfiles: normalizeServiceProfiles(state.providerServiceProfiles),
        providerVerified: state.providerVerified,
        providerScore: state.providerScore,
        providerAvgRatingLocal: state.providerAvgRatingLocal,
        providerReviewCountLocal: state.providerReviewCountLocal,
        providerDashboard: state.providerDashboard,
        inAppChatMessages: state.inAppChatMessages,
        customerPhone: state.customerPhone,
        providerPhone: state.providerPhone,
      }),
    }
  )
);
