# KARIGAR AI — COMPLETE REBUILD PROMPT FOR ANTIGRAVITY
# Version 2.0 — Full Agentic System
# Deadline: May 20, 2026

---

## CONTEXT

You are rebuilding Karigar AI, a React Native + Expo mobile app for Pakistan's informal
service economy. The backend (FastAPI + Google ADK at http://192.168.0.108:8000) is complete
with 7 agents. You are fixing all bugs and adding all missing features in the mobile app.

Project root: C:\Users\admin\Downloads\karigar-ai\karigar-mobile\
Backend root: C:\Users\admin\Downloads\karigar-ai\karigar-backend\

Tech stack: React Native, Expo, expo-router, Zustand, Axios, Firebase Firestore,
@expo/vector-icons (Ionicons only), AsyncStorage, expo-location, expo-notifications.
NO Tailwind. Use StyleSheet only. Dark theme default (#0A0A0F background, #0D7377 teal).

---

## CRITICAL RULE: READ BEFORE WRITING

Before touching any file, read its current content. Do not overwrite working code.
Apply surgical fixes unless told to rewrite completely.

---

## PART 1 — FIREBASE SETUP & DATA SCHEMA

### 1.1 Install dependencies
Run in karigar-mobile/:
  npx expo install firebase @react-native-async-storage/async-storage
  npx expo install expo-location expo-notifications expo-constants

### 1.2 Create services/firebase.ts
```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;
```

### 1.3 Firestore Collections Schema

**Collection: users**
Document ID: userId (UUID generated on first launch, stored in AsyncStorage)
Fields:
  name: string (default: "Guest User")
  email: string (default: "")
  phone: string (default: "")
  homeAddress: string (default: "")
  homeLatitude: number | null
  homeLongitude: number | null
  role: "customer" | "provider"
  preferredLanguage: "en" | "ur" | "roman_urdu"
  theme: "dark" | "light"
  notificationsEnabled: boolean
  createdAt: Timestamp
  lastActive: Timestamp

**Collection: bookings**
Document ID: auto (KAI-timestamp)
Fields:
  userId: string
  providerId: string
  providerName: string
  serviceType: string
  agreedPrice: number
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled" | "disputed"
  slotTime: string
  slotTimestamp: Timestamp | null
  location: string
  latitude: number | null
  longitude: number | null
  createdAt: Timestamp
  reminderSent: boolean
  providerRating: number | null
  reviewText: string | null
  checklistData: object | null

**Collection: chatSessions**
Document ID: sessionId
Fields:
  userId: string
  title: string (first message truncated to 30 chars)
  messages: array of { role, content, timestamp }
  createdAt: Timestamp
  lastUpdated: Timestamp
  serviceType: string | null

**Collection: providers** (mock data — seed 30 providers)
Document ID: providerId
Fields:
  name, category, rating, totalReviews, baseRatePkr, trustScore, verified,
  cancellationRate30d, onTimeRate, latitude, longitude, phone, available,
  specializations: string[], complexity: "basic"|"intermediate"|"complex",
  workloadCount: number, totalEarnings: number, joinedAt: Timestamp,
  recentReviews: array of { rating, text, date }

**Collection: trends** (for smart reminders)
Document ID: trend ID
Fields:
  category: string, headline: string, urduHeadline: string,
  icon: string, triggerMonth: number[], region: string, active: boolean

### 1.4 Seed Firestore with mock providers for ALL categories:
AC repair (5), plumbing (5), electrical (5), tutoring (5), beautician (5),
mechanic (5), driver (5), freelancer (5), home cleaning (5), carpenter (5),
painter (5), security guard (3), cook/chef (3), gardener (3), tailor (3)
= minimum 75 providers total

Seed trends collection with 12 entries for each month/season:
- Summer (May-Sep): AC maintenance, cooler service, cold drinks vendor
- Winter (Nov-Feb): Heater service, geyser repair
- School season (Aug-Sep): Tutoring, school supply delivery
- Rain (Jul-Aug): Plumber, roof leak repair, electrician
- Eid: Beautician, tailor, house cleaning, painter
- Rising petrol: Driver/carpooling alternatives

---

## PART 2 — STORE REBUILD (store/index.ts)

Completely rewrite store/index.ts with ALL new fields:

```typescript
import { create } from 'zustand';

interface UserProfile {
  userId: string;
  name: string;
  email: string;
  phone: string;
  homeAddress: string;
  homeLatitude: number | null;
  homeLongitude: number | null;
  role: 'customer' | 'provider';
  preferredLanguage: 'en' | 'ur' | 'roman_urdu';
  theme: 'dark' | 'light';
  notificationsEnabled: boolean;
}

interface Message {
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
}

interface ChatSession {
  sessionId: string;
  title: string;
  messages: Message[];
  createdAt: number;
  serviceType?: string;
}

interface Provider {
  id: string;
  name: string;
  rating: number;
  totalReviews: number;
  baseRatePkr: number;
  base_rate_pkr: number; // alias
  trustScore: number;
  trust_score: number; // alias
  verified: boolean;
  cancellationRate30d: number;
  cancellation_rate_30d: number; // alias
  onTimeRate: number;
  on_time_rate: number; // alias
  rankReasonUrdu?: string;
  rank_reason_urdu?: string; // alias
  score: number;
  latitude?: number;
  longitude?: number;
  phone?: string;
  available?: boolean;
  specializations?: string[];
  complexity?: string;
  workloadCount?: number;
}

interface Booking {
  id: string;
  providerId?: string;
  providerName: string;
  provider_name?: string; // alias
  serviceType: string;
  service_type?: string; // alias
  agreedPrice: number;
  agreed_price?: number; // alias
  status: string;
  slotTime: string;
  slot_time?: string; // alias
  location?: string;
  latitude?: number;
  longitude?: number;
  createdAt?: number;
  reminderSent?: boolean;
  providerRating?: number;
  reviewText?: string;
}

interface AgentResponse {
  service_type?: string;
  location?: string;
  urgency?: number;
  budget?: number;
  confidence?: number;
  needs_clarification?: boolean;
  clarification_question_urdu?: string;
  clarification_question_en?: string;
  response_en?: string;
  response_urdu?: string;
  trace_log?: TraceStep[];
  providers?: Provider[];
}

interface TraceStep {
  step?: number;
  agent: string;
  action: string;
  duration_ms?: number;
  reasoning?: string;
  tool_calls?: string[];
}

interface SmartReminder {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  action: string; // message to send to chat
  color: string;
  urgent: boolean;
}

interface StoreState {
  // User
  userProfile: UserProfile;
  setUserProfile: (profile: Partial<UserProfile>) => void;

  // Session
  sessionId: string;
  userId: string;
  newSession: () => void;

  // Chat sessions history
  chatSessions: ChatSession[];
  currentSessionId: string;
  addChatSession: (session: ChatSession) => void;
  updateChatSession: (sessionId: string, messages: Message[]) => void;
  setCurrentSessionId: (id: string) => void;

  // Messages (current session)
  messages: Message[];
  addMessage: (role: 'user' | 'ai', content: string) => void;
  clearMessages: () => void;

  // Loading
  isLoading: boolean;
  setLoading: (v: boolean) => void;

  // AI Response
  currentResponse: AgentResponse | null;
  setResponse: (r: AgentResponse) => void;

  // Providers
  providers: Provider[];
  setProviders: (p: Provider[]) => void;
  selectedProvider: Provider | null;
  setSelectedProvider: (p: Provider | null) => void;

  // Bookings
  currentBooking: Booking | null;
  bookingHistory: Booking[];
  setCurrentBooking: (b: Booking) => void;
  addToBookingHistory: (b: Booking) => void;
  updateBookingRating: (bookingId: string, rating: number, review: string) => void;
  updateProviderScore: (providerId: string, rating: number) => void;

  // Trace log
  traceLog: TraceStep[];

  // Smart reminders
  smartReminders: SmartReminder[];
  setSmartReminders: (r: SmartReminder[]) => void;

  // Location
  userLatitude: number | null;
  userLongitude: number | null;
  setUserLocation: (lat: number, lng: number) => void;

  // Petrol price
  petrolPricePerLiter: number;
  setPetrolPrice: (price: number) => void;

  // Notifications
  scheduledNotifications: string[]; // expo notification IDs
  addScheduledNotification: (id: string) => void;

  // Theme
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;

  // Demo mode
  isDemoMode: boolean;
  setDemoMode: (v: boolean) => void;

  // Provider dashboard (when role=provider)
  providerProfile: any;
  setProviderProfile: (p: any) => void;
  providerBookings: Booking[];
  setProviderBookings: (b: Booking[]) => void;

  clearSession: () => void;
}
```

Implement all methods. Key implementations:

setResponse: sets currentResponse, traceLog from r.trace_log, providers from r.providers
addMessage: appends to messages[] with timestamp: Date.now()
setCurrentBooking: sets currentBooking AND calls addToBookingHistory
updateProviderScore: finds provider in providers[] array and updates their score by:
  - rating 5: +3 to score, +0.1 to rating
  - rating 4: +1 to score
  - rating 3: 0 change
  - rating 2: -2 to score, -0.05 to rating
  - rating 1: -5 to score, -0.15 to rating
  Clamp score 0-100, rating 1-5. This is real-time local update.
userId: generate with Math.random().toString(36).slice(2) or load from AsyncStorage

---

## PART 3 — SERVICES LAYER

### 3.1 services/firebase-service.ts
Create a service that wraps all Firestore operations:

```typescript
import { db } from './firebase';
import {
  doc, setDoc, getDoc, updateDoc, collection,
  addDoc, getDocs, query, where, orderBy, limit,
  onSnapshot, Timestamp, serverTimestamp
} from 'firebase/firestore';

// User CRUD
export const saveUserProfile = async (userId: string, profile: any) => { ... }
export const loadUserProfile = async (userId: string): Promise<any | null> => { ... }
export const updateUserField = async (userId: string, field: string, value: any) => { ... }

// Booking CRUD
export const saveBooking = async (booking: any): Promise<string> => { ... }
export const getUserBookings = async (userId: string): Promise<any[]> => { ... }
export const updateBookingStatus = async (bookingId: string, status: string) => { ... }
export const updateBookingRating = async (bookingId: string, rating: number, review: string, checklist: any) => { ... }

// Chat sessions
export const saveChatSession = async (session: any): Promise<string> => { ... }
export const getUserChatSessions = async (userId: string): Promise<any[]> => { ... }
export const updateChatSessionMessages = async (sessionId: string, messages: any[]) => { ... }

// Providers
export const getProvidersByCategory = async (category: string): Promise<any[]> => { ... }
export const updateProviderRating = async (providerId: string, newRating: number, newScore: number) => { ... }

// Trends
export const getActiveTrends = async (month: number): Promise<any[]> => { ... }
```

### 3.2 services/location.ts
```typescript
import * as Location from 'expo-location';

export const requestLocationPermission = async (): Promise<boolean> => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
};

export const getCurrentLocation = async (): Promise<{ latitude: number; longitude: number } | null> => {
  try {
    const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { latitude: location.coords.latitude, longitude: location.coords.longitude };
  } catch {
    return null;
  }
};

export const watchLocation = (callback: (loc: { latitude: number; longitude: number }) => void) => {
  return Location.watchPositionAsync(
    { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
    (loc) => callback({ latitude: loc.coords.latitude, longitude: loc.coords.longitude })
  );
};

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  // Haversine formula, returns km
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const result = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    if (result[0]) {
      return `${result[0].name || ''} ${result[0].district || ''} ${result[0].city || ''}`.trim();
    }
    return 'Current Location';
  } catch {
    return 'Current Location';
  }
};
```

### 3.3 services/petrol.ts
```typescript
// Fetch Pakistan petrol price — use mock with real-data fallback
// Primary: try https://api.sheety.co or a public Pakistan fuel price endpoint
// Fallback: Pakistan State Oil standard rate ~ Rs 248/liter (update monthly)

export const PETROL_PRICE_PER_LITER = 248; // Rs — updated May 2026

export const fetchPetrolPrice = async (): Promise<number> => {
  try {
    // PSO / OGRA publish prices. Use a CORS-friendly proxy or mock.
    // For hackathon: return mock that feels real
    const basePrice = 248;
    const variation = (Math.random() - 0.5) * 4; // ±2 Rs variation
    return Math.round(basePrice + variation);
  } catch {
    return PETROL_PRICE_PER_LITER;
  }
};

export const calculateFuelCost = (distanceKm: number, petrolPricePerLiter: number): number => {
  // Average motorcycle: 35 km/liter, car: 12 km/liter
  // Assume provider uses motorcycle for short distances
  const fuelEfficiency = distanceKm < 10 ? 35 : 12; // km/liter
  const litersUsed = distanceKm / fuelEfficiency;
  return Math.round(litersUsed * petrolPricePerLiter);
};
```

### 3.4 services/notifications.ts
```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!Device.isDevice) return false;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

export const showBookingNotification = async (providerName: string, slotTime: string): Promise<string> => {
  // Immediate notification
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '✅ Booking Confirmed — Karigar AI',
      body: `${providerName} will arrive at ${slotTime}`,
      sound: true,
      data: { type: 'booking_confirmed' },
    },
    trigger: null, // immediate
  });
  return id;
};

export const scheduleBookingReminder = async (
  providerName: string,
  slotTime: string,
  reminderDate: Date
): Promise<string> => {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '⏰ Reminder — Karigar AI',
      body: `${providerName} arrives in 1 hour at ${slotTime}`,
      sound: true,
      data: { type: 'booking_reminder' },
    },
    trigger: { date: reminderDate },
  });
  return id;
};

export const showDisputeNotification = async (disputeId: string): Promise<void> => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '⚠️ Dispute Filed — Karigar AI',
      body: `Dispute ${disputeId} submitted. AI agent will review within 2 hours.`,
      sound: true,
    },
    trigger: null,
  });
};

export const showProviderEnrouteNotification = async (providerName: string, etaMinutes: number): Promise<void> => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🚗 Provider En Route — Karigar AI',
      body: `${providerName} is on the way — ETA ${etaMinutes} minutes`,
      sound: true,
    },
    trigger: null,
  });
};
```

### 3.5 services/smart-reminders.ts
```typescript
import { getActiveTrends } from './firebase-service';
import { fetchPetrolPrice } from './petrol';

// Generate smart reminders based on: month, user history, petrol price, local trends
export const generateSmartReminders = async (
  userProfile: any,
  bookingHistory: any[],
  currentMonth: number
): Promise<any[]> => {
  const reminders = [];

  // 1. Seasonal reminder based on current month
  const seasonal = getSeasonalReminder(currentMonth);
  if (seasonal) reminders.push(seasonal);

  // 2. Repeat service reminder (if user booked AC last year)
  const lastACBooking = bookingHistory.find(b =>
    b.serviceType?.toLowerCase().includes('ac') &&
    Date.now() - b.createdAt > 11 * 30 * 24 * 60 * 60 * 1000 // 11 months ago
  );
  if (lastACBooking) {
    reminders.push({
      id: 'repeat-ac',
      icon: 'snow-outline',
      title: 'Time for Annual AC Service',
      subtitle: `You last serviced your AC ${Math.floor((Date.now() - lastACBooking.createdAt) / (30 * 24 * 60 * 60 * 1000))} months ago`,
      action: 'AC annual maintenance check',
      color: '#3498DB',
      urgent: currentMonth >= 4 && currentMonth <= 6,
    });
  }

  // 3. Petrol price alert affecting travel costs
  const petrolPrice = await fetchPetrolPrice();
  if (petrolPrice > 250) {
    reminders.push({
      id: 'petrol-alert',
      icon: 'car-outline',
      title: 'Petrol at Rs ' + petrolPrice + '/L',
      subtitle: 'Distance costs are higher today. Book nearby providers.',
      action: 'show providers near me',
      color: '#E74C3C',
      urgent: true,
    });
  }

  // 4. Incomplete profile reminder
  if (!userProfile.homeAddress) {
    reminders.push({
      id: 'add-address',
      icon: 'home-outline',
      title: 'Add Your Home Address',
      subtitle: 'Get faster service discovery and accurate travel costs',
      action: 'open_profile',
      color: '#9B59B6',
      urgent: false,
    });
  }

  // 5. Fetch live trends from Firestore
  try {
    const trends = await getActiveTrends(currentMonth);
    trends.slice(0, 2).forEach(t => {
      reminders.push({
        id: t.id,
        icon: t.icon,
        title: t.headline,
        subtitle: t.urduHeadline,
        action: t.category + ' service near me',
        color: '#F39C12',
        urgent: false,
      });
    });
  } catch { /* silently skip */ }

  return reminders.slice(0, 4); // max 4 reminders
};

const getSeasonalReminder = (month: number) => {
  if ([4, 5, 6, 7, 8].includes(month)) {
    return {
      id: 'summer',
      icon: 'sunny-outline',
      title: 'Summer is Here — AC Season',
      subtitle: 'Book AC service before providers get fully booked',
      action: 'AC maintenance check, summer season',
      color: '#F39C12',
      urgent: month >= 5,
    };
  }
  if ([7, 8].includes(month)) {
    return {
      id: 'monsoon',
      icon: 'rainy-outline',
      title: 'Monsoon Season — Check for Leaks',
      subtitle: 'Plumber and electrician bookings surge in rain season',
      action: 'plumber roof leak inspection',
      color: '#3498DB',
      urgent: false,
    };
  }
  if ([11, 12, 1].includes(month)) {
    return {
      id: 'winter',
      icon: 'snow-outline',
      title: 'Winter is Coming — Geyser Ready?',
      subtitle: 'Get your geyser and heater serviced before the cold',
      action: 'geyser heater service',
      color: '#9B59B6',
      urgent: month === 11,
    };
  }
  return null;
};
```

### 3.6 Update services/api.ts
Add these new methods and fix the dynamic message bug:

```typescript
// Fix sendRequest: the mock data must match actual service type
// When network fails, generate mock based on service_type extracted from message

export const sendRequest = async (message: string, sessionId: string, userId: string) => {
  try {
    const res = await api.post('/api/request', {
      message, session_id: sessionId, user_id: userId,
    });
    return res.data;
  } catch (e) {
    const err = e as AxiosError;
    if (err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK') {
      // Detect service type from message
      const msg = message.toLowerCase();
      let serviceType = 'AC_repair';
      let mockProviders = [...]; // full list by service type
      if (msg.includes('tutor') || msg.includes('teacher') || msg.includes('padhai')) {
        serviceType = 'tutoring';
        mockProviders = TUTORING_PROVIDERS;
      } else if (msg.includes('plumb') || msg.includes('pipe') || msg.includes('pani')) {
        serviceType = 'plumbing';
        mockProviders = PLUMBING_PROVIDERS;
      } else if (msg.includes('electric') || msg.includes('bijli') || msg.includes('wiring')) {
        serviceType = 'electrical';
        mockProviders = ELECTRICAL_PROVIDERS;
      } else if (msg.includes('driver') || msg.includes('taxi') || msg.includes('car')) {
        serviceType = 'driver';
        mockProviders = DRIVER_PROVIDERS;
      }
      // ... etc for all service types

      return {
        service_type: serviceType,
        response_en: `I found ${mockProviders.length} ${serviceType.replace('_', ' ')} specialists near you.`,
        response_urdu: `${mockProviders.length} ماہرین ملے۔`,
        confidence: 0.88,
        providers: mockProviders,
        trace_log: [
          { step: 1, agent: 'nlu', action: `parsed_${serviceType}_request`, duration_ms: 320 },
          { step: 2, agent: 'discovery', action: `found_${mockProviders.length}_providers`, duration_ms: 890 },
          { step: 3, agent: 'ranking', action: 'scored_8_factors', duration_ms: 450 },
        ],
      };
    }
    throw err;
  }
};

// NEW: Save booking to backend
export const saveBooking = async (booking: any) => {
  try {
    const res = await api.post('/api/booking', booking);
    return res.data;
  } catch {
    return { id: booking.id, status: 'confirmed' };
  }
};

// NEW: Get available slots for provider
export const getProviderSlots = async (providerId: string, date: string) => {
  try {
    const res = await api.get(`/api/provider/${providerId}/slots?date=${date}`);
    return res.data;
  } catch {
    // Return mock available slots
    return {
      slots: ['9:00 AM', '11:00 AM', '2:00 PM', '4:00 PM', '6:00 PM'],
      provider_id: providerId,
      date,
    };
  }
};
```

---

## PART 4 — LOGIN & ROLE SELECTION

### 4.1 Create app/welcome.tsx (onboarding/login screen)
This shows ONCE on first launch. Use AsyncStorage key "karigar_onboarded".

Design:
- Full screen dark background with teal gradient
- Karigar AI logo text at top
- Tagline: "Pakistan ka Smart Service Platform"
- Two large role cards side by side:

  LEFT CARD — Customer:
    Icon: person-outline (large, teal)
    Title: "I need a service"
    Subtitle: "Find plumbers, tutors, mechanics and more"
    onPress: set role="customer", navigate to profile setup

  RIGHT CARD — Provider:
    Icon: briefcase-outline (large, amber)
    Title: "I offer services"
    Subtitle: "Join thousands of verified professionals"
    onPress: set role="provider", navigate to provider setup

- Below cards: "Already have an account? Sign in" link
  (for hackathon: just load profile from AsyncStorage by phone number)

### 4.2 Create app/setup-profile.tsx (first-time profile setup)
Step-by-step setup for CUSTOMER:
  Step 1: Name + phone number (required), email (optional)
  Step 2: Home address (TextInput) + "Use My Location" button
           On "Use My Location": call expo-location, reverse geocode, fill input
  Step 3: Language preference (English / اردو / Roman Urdu) — 3 big buttons
  Step 4: Notification permission request
  Done: save to Firestore, set AsyncStorage "karigar_onboarded"="true", navigate to tabs

For PROVIDER:
  Step 1: Name, phone, CNIC (last 4 digits only for verification mock)
  Step 2: Service category (multi-select chips: all 15 categories)
  Step 3: Base rate, years experience, coverage area (address)
  Step 4: Brief bio (max 200 chars)
  Done: save to Firestore, navigate to provider dashboard tabs

### 4.3 Update app/_layout.tsx
On app launch check AsyncStorage "karigar_onboarded":
  - If not set: redirect to /welcome
  - If set and role=customer: show customer tabs
  - If set and role=provider: show provider tabs

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// In RootLayout component:
const [ready, setReady] = useState(false);

useEffect(() => {
  checkOnboarding();
}, []);

const checkOnboarding = async () => {
  const onboarded = await AsyncStorage.getItem('karigar_onboarded');
  const role = await AsyncStorage.getItem('karigar_role');
  if (!onboarded) {
    router.replace('/welcome');
  } else if (role === 'provider') {
    router.replace('/(provider-tabs)');
  }
  setReady(true);
};
```

---

## PART 5 — PROVIDER DASHBOARD

### 5.1 Create app/(provider-tabs)/_layout.tsx
4 tabs for provider:
  - Dashboard (home icon)
  - Requests (notifications icon) — incoming booking requests
  - My Earnings (wallet icon)
  - Profile (person icon)

### 5.2 Create app/(provider-tabs)/dashboard.tsx
Provider home screen showing:
  - Good morning [provider name]
  - Today's stats: Active bookings, earnings today, rating
  - Availability toggle (online/offline) — large switch, teal=online, gray=offline
  - Upcoming bookings list (from Firestore)
  - Workload bar: "You have X bookings today. Recommended max: 5"
  - AI Suggestion card: "Based on demand forecasting, [service] is trending in [area] today"
  - Quick actions: "Set my hours", "View Earnings", "My Profile"

### 5.3 Create app/(provider-tabs)/requests.tsx
Incoming booking requests screen:
  - List of pending requests from Firestore
  - Each request card shows:
    - Customer name, service type, location, requested time, offered price
    - "Accept" button (green) → updates booking status in Firestore
    - "Decline" button (red) → triggers auto-recovery on customer side
    - "Counter Offer" button (teal) → opens modal to suggest alternate price/time
  - Empty state: "No new requests. You are online and ready."
  - Real-time updates: use Firestore onSnapshot listener

### 5.4 Create app/(provider-tabs)/earnings.tsx
Provider earnings screen:
  - Total lifetime earnings: Rs X
  - This month: Rs X
  - This week: Rs X
  - Bar chart (simple View-based bars, no external chart lib):
    Last 7 days earnings visualization
  - Booking history table: date, service, customer, amount, status
  - Platform fee breakdown: "Karigar AI takes 18%. You earn 82% of each booking."

### 5.5 Create app/(provider-tabs)/profile.tsx (Provider)
  - Edit name, phone, CNIC (masked)
  - Service categories (multi-select chips)
  - Base rate (editable TextInput)
  - Bio (editable)
  - Coverage area (location-based)
  - My rating: X/5 with star display
  - Trust score: X/100 with progress bar
  - Recent reviews from customers
  - Verification badge if verified=true

---

## PART 6 — CUSTOMER SCREENS — FIX ALL BUGS

### 6.1 app/(tabs)/index.tsx — HOME SCREEN COMPLETE REWRITE

Fix list:
1. Show real user name from useStore().userProfile.name
2. Smart reminders: load from generateSmartReminders() in useEffect
   Show up to 4 reminder cards in horizontal ScrollView
   Each card: icon, title, subtitle, teal "Book" button
   onPress: if action starts with 'open_': navigate. Else: handleSend(action)
3. Expand service categories from 6 to 15+:
   AC Repair, Plumbing, Electrical, Tutoring, Beautician, Mechanic,
   Driver, Home Cleaning, Carpenter, Painter, Cook/Chef, Freelancer,
   Security Guard, Gardener, Tailor, + "More" button
   Show 12 in grid (4 rows of 3), "More" button opens bottom sheet with remaining
4. Voice button: when a category is selected FIRST and then voice is pressed,
   the voice mock text must match the category:
   Store selectedCategory in state.
   If selectedCategory is set: mock voice = `I need ${selectedCategory} service, ${userProfile.homeAddress || 'near me'}`
   Else: show category selection first OR use generic "tell me what service you need"
5. When handleSend is called: include user's home address in the message context:
   const fullMessage = userProfile.homeAddress
     ? `${message}. My location: ${userProfile.homeAddress}`
     : message;
6. Location: on mount, request location permission, get current coords, reverse geocode,
   show in search bar placeholder: "Services near [area name]..."
7. "Add home address" prompt if profile incomplete:
   Show yellow banner: "Add your address for better matches" → navigate to profile

### 6.2 app/chat.tsx — MAJOR FIX

Fix list:

A. CHAT HISTORY: This screen should show CHAT LIST by default (not open chat).
   New design:
   - If no session is active (first time): show chat list view
   - If session is active: show chat messages view

   CHAT LIST VIEW:
   - Header: "Karigar Assistant" + circular "+" button (new chat)
   - List of previous chat sessions from store.chatSessions
   - Each item: service type icon, title (first message truncated), timestamp, arrow
   - onPress: load that session's messages, navigate to chat messages view
   - Empty state: AI bot icon + "Start a conversation" + big "New Chat" button

   CHAT MESSAGES VIEW:
   - Back button (goes to chat list view, not router.back())
   - Continue existing handleSend / handleSendText logic

B. FOLLOW-UP QUESTIONS:
   After AI response, check if critical info is missing:
   ```typescript
   const checkMissingInfo = (response: AgentResponse, message: string): string | null => {
     if (!response.location) return "Ap ka location kya hai? (area/sector name)";
     if (!response.budget) return "Aapka budget kya hai? (e.g. Rs 500-1000)";
     if (!response.urgency) return "Yeh kab chahiye? (abhi / kal / is hafte)";
     return null;
   };
   ```
   Show follow-up question as AI message automatically if missing info detected.
   User responds → re-send to API with accumulated context.

C. MULTILINGUAL INPUT:
   Before sending, detect language:
   - Contains Arabic script → Urdu
   - Contains only ASCII but Urdu words (nahi, chahiye, karo, bilkul) → Roman Urdu
   - Else → English
   Show small language badge next to input: "EN" / "UR" / "RU" (Roman Urdu)

D. KNOWLEDGE BASE FALLBACK:
   If response.confidence < 0.5 or response.needs_clarification = true:
   Show yellow card with clarification question.
   Also add quick-reply chips: "AC Repair" / "Plumbing" / "Tell me more"
   Quick reply chips call handleSendText() with that chip text.

E. Save session to Firestore after each AI response:
   ```typescript
   await saveChatSession({
     sessionId, userId, title: messages[0]?.content.slice(0, 30) || 'New Chat',
     messages, serviceType: currentResponse?.service_type, createdAt: Date.now()
   });
   ```

### 6.3 app/providers.tsx — SLOT SELECTION FIX

After selecting provider:
  - Show a bottom sheet modal (NOT navigation) for slot selection:

  ```
  ┌─────────────────────────────────┐
  │  Book [Provider Name]           │
  │  Rs X • Select your time slot   │
  │                                 │
  │  [Today]  [Tomorrow]  [Wed]     │  ← date tabs
  │                                 │
  │  ○ 9:00 AM   ● 11:00 AM        │
  │  ○ 2:00 PM   ○ 4:00 PM         │
  │  ○ 6:00 PM   ✗ 8:00 PM (full)  │
  │                                 │
  │  [Confirm Slot]                 │
  └─────────────────────────────────┘
  ```

  Call getProviderSlots(provider.id, selectedDate) to get available slots.
  After confirming slot: store slot in selectedProvider.confirmedSlot, then navigate to pricing.
  Double-booking prevention: slots marked "full" are grayed out and unselectable.

### 6.4 app/confirm.tsx — NOTIFICATION FIX

After booking confirmed:
  1. Call showBookingNotification(booking.providerName, booking.slotTime) — real push notification
  2. Parse slotTime to calculate 1-hour-before reminder time
  3. Call scheduleBookingReminder(providerName, slotTime, reminderDate)
  4. Store notification IDs in store.scheduledNotifications
  5. Save booking to Firestore: await saveBooking(booking)
  6. WhatsApp notification component stays (visual in-app)
  7. Show: "📱 Push notification sent" small text below WhatsApp card

### 6.5 app/(tabs)/track.tsx — LIVE GPS TRACKING

Complete rewrite of track screen:

```typescript
// Real GPS-based tracking
// Uses expo-location to watch user location
// Simulates provider movement toward user

const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
const [providerLocation, setProviderLocation] = useState<{lat: number, lng: number} | null>(null);
const [distance, setDistance] = useState<number | null>(null);
const [eta, setEta] = useState<number | null>(null);
const [trackingStatus, setTrackingStatus] = useState<'finding' | 'confirmed' | 'en_route' | 'nearby' | 'arrived'>('finding');
```

Design (replicate FoodPanda tracking style):
  - Full-screen map simulation (View with dark bg + animated dots for user/provider)
    - Cannot use actual map component without Maps API key in mobile
    - Use an animated SVG-based mini map representation instead
    - OR: use a static placeholder with animation showing movement

  The tracking card at bottom:
  ```
  ┌─────────────────────────────────────┐
  │  🚗 Ali AC Services                 │
  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━  ETA  │
  │  [●]————————————————[YOU]  12 min  │
  │                                     │
  │  Status: En Route                   │
  │  Distance: 3.2 km remaining        │
  │                                     │
  │  Petrol cost impact: Rs 24/km      │
  │  (Petrol: Rs 248/L today)          │
  │                                     │
  │  [📞 Call]  [💬 Message Provider]  │
  └─────────────────────────────────────┘
  ```

  Progress timeline at top:
  ● Confirmed → ● En Route → ● Nearby → ○ Arrived → ○ Complete

  Provider simulation:
  - Start: random location 5-10km away from user
  - Every 3 seconds: move 0.5km closer (simulated)
  - When distance < 0.3km: status = "nearby", show "Provider is almost here!"
  - When distance = 0: status = "arrived", show success animation
    - Trigger notification: showProviderEnrouteNotification()

  Call button: Alert.alert('Calling...', `Calling ${providerPhone}...`)
  Message button: navigate to a NEW app/provider-chat.tsx screen (NOT AI chat)

### 6.6 Create app/provider-chat.tsx — PROVIDER MESSAGING (Separate from AI)

This is direct messaging with provider (mock, not AI).

```
Header: [Back] [Provider Name] [Phone icon]
Chat area with message bubbles
  - Provider sends automated responses based on status:
    - "Aapki booking confirm ho gayi hai. Main kal 11 baje aa raha hoon."
    - "Main raste mein hoon, 15 minute mein pohonch jaoonga."
    - "Koi masla ho to mujhe call karein."
  - Customer can type messages (stored locally)
  - Messages look like WhatsApp (green right bubble, gray left bubble)
Input bar at bottom (same as chat.tsx)
```

### 6.7 app/(tabs)/bookings.tsx — DISPUTE FIX

Fix the dispute flow:
```typescript
// Replace Alert.alert with a proper modal
const [disputeModalVisible, setDisputeModalVisible] = useState(false);
const [disputeText, setDisputeText] = useState('');
const [disputeCategory, setDisputeCategory] = useState('');

DISPUTE MODAL:
  Title: "File a Dispute"
  Subtitle: "Our AI agent will review within 2 hours"

  Category selector (horizontal chips):
    "Price Dispute" | "No Show" | "Poor Quality" | "Late Arrival" | "Overcharge"

  TextInput:
    multiline, 4 lines
    placeholder: "Describe what happened in detail..."
    value={disputeText}
    onChangeText={setDisputeText}

  Evidence note: "You can add photos later from your gallery"

  [Submit Dispute] button:
    onPress: call submitDispute(bookingId, disputeText, disputeCategory)
    Show loading indicator
    On success: close modal + show notification + update booking status to "disputed"
    Also call showDisputeNotification(disputeId)

  [Cancel] button
```

### 6.8 app/feedback.tsx — RATING AFFECTS REAL SCORE

Fix the rating submission to actually update provider scores:

```typescript
const handleSubmit = async () => {
  if (stars === 0) return;

  // 1. Update provider score in store (immediate UI update)
  if (selectedProvider?.id) {
    updateProviderScore(selectedProvider.id, stars);
  }

  // 2. Update provider in Firestore
  if (selectedProvider?.id) {
    const newRating = Math.max(1, Math.min(5,
      (selectedProvider.rating * selectedProvider.totalReviews + stars) /
      (selectedProvider.totalReviews + 1)
    ));
    const scoreChange = stars === 5 ? 3 : stars === 4 ? 1 : stars === 3 ? 0 : stars === 2 ? -2 : -5;
    const newScore = Math.max(0, Math.min(100, (selectedProvider.trust_score || 80) + scoreChange));
    await updateProviderRating(selectedProvider.id, newRating, newScore);
  }

  // 3. Save booking rating to Firestore
  if (currentBooking?.id) {
    await updateBookingRating(currentBooking.id, stars, reviewText, checked);
  }

  // 4. Show success state with actual new score
  setSubmitted(true);
};
```

Checklist must include NEGATIVE options:
```typescript
const CHECKLIST_ITEMS = [
  { id: 'done', label: 'Service was completed as described', positive: true },
  { id: 'ontime', label: 'Provider arrived on time', positive: true },
  { id: 'clean', label: 'Work area was left clean', positive: true },
  { id: 'price', label: 'Final price matched the quote', positive: true },
  { id: 'late', label: 'Provider was late', positive: false },
  { id: 'quality', label: 'Work quality was poor', positive: false },
  { id: 'overcharge', label: 'I was charged more than quoted', positive: false },
  { id: 'rude', label: 'Provider was unprofessional', positive: false },
];
// Positive items: green checkbox. Negative items: red checkbox.
// Negative items checked → automatically deduct from score calculation
```

### 6.9 app/(tabs)/profile.tsx — EDITABLE PROFILE

Complete rewrite with real editing:

```typescript
const [isEditing, setIsEditing] = useState(false);
const [editName, setEditName] = useState(userProfile.name);
const [editEmail, setEditEmail] = useState(userProfile.email);
const [editPhone, setEditPhone] = useState(userProfile.phone);
const [editAddress, setEditAddress] = useState(userProfile.homeAddress);

// Header section:
// Avatar circle (initials, teal background)
// If isEditing:
//   TextInput for name (large, centered)
//   TextInput for email
//   TextInput for phone
//   TextInput for homeAddress + "📍 Use Location" button
// If not editing:
//   Display name, email, phone
// "Edit Profile" button → setIsEditing(true)
// "Save" button (when editing) → save to store + Firestore + setIsEditing(false)

// Home Address row (special):
// Shows current address or "Add address"
// "📍 Use Current Location" button → expo-location → reverse geocode → fill address
// Address is saved to store.userProfile.homeAddress

// Settings rows (same as before but all wired):
// Theme toggle, Language, Notifications, My Bookings, etc.
```

Save to Firestore on profile save:
```typescript
const handleSave = async () => {
  const updated = { name: editName, email: editEmail, phone: editPhone, homeAddress: editAddress };
  setUserProfile(updated);
  await saveUserProfile(userId, updated);
  setIsEditing(false);
};
```

### 6.10 app/scheduling.tsx — NEW SCREEN: Time Slot Selection
(Called from providers.tsx instead of the bottom sheet if bottom sheet is too complex)

Full screen slot selector:
  - Header: "Choose Your Slot" for [providerName]
  - Date selector: Today, Tomorrow, Day after (3 tabs)
  - Time slots grid (2 columns):
    Each slot: time label + available/unavailable status
    Available: teal border, selectable
    Unavailable: gray, crossed out
  - Provider availability note: "Last booking was at X. Travel buffer: 30 min."
  - "Confirm This Slot" button → setSlot in store → navigate to pricing

---

## PART 7 — AGENT ARCHITECTURE & A2A PROTOCOL

### 7.1 Add to store: agent communication log
```typescript
agentMessages: AgentMessage[]; // A2A communication log
interface AgentMessage {
  from: string; // agent name
  to: string;   // agent name
  message: string;
  timestamp: number;
  type: 'request' | 'response' | 'broadcast';
}
addAgentMessage: (msg: AgentMessage) => void;
```

### 7.2 Update app/trace.tsx to show A2A communication
Add a second tab in trace screen:
  Tab 1: "Agent Steps" (existing trace log)
  Tab 2: "Agent Communication" (A2A messages between agents)

Agent communication tab shows:
  Timeline of messages between agents with arrows:
  NLU → Discovery: "Service type: AC_repair, Location: G-13"
  Discovery → Ranking: "Found 8 providers, passing for scoring"
  Ranking → Negotiation: "Top provider at Rs 800, user budget Rs 500"
  Negotiation → Booking: "Agreed price: Rs 650, slot: 6PM"
  Booking → Recovery: "Booking confirmed: KAI-12345"
  (Mock this data in store, populate from trace_log)

### 7.3 Update app/trace.tsx footer
Add: "Powered by Google ADK + Gemini 2.5" badge
Show: 7 agent names in a horizontal chip row at top
Highlight active agent (based on most recent trace step)

---

## PART 8 — PRICING SCREEN — PETROL INTEGRATION

Update app/pricing.tsx:

Replace hardcoded distanceSurcharge with real calculation:
```typescript
const { petrolPricePerLiter, userLatitude, userLongitude } = useStore();
const providerLat = selectedProvider?.latitude || 33.6844;
const providerLng = selectedProvider?.longitude || 73.0479;

const distanceKm = userLatitude && userLongitude
  ? calculateDistance(userLatitude, userLongitude, providerLat, providerLng)
  : 3.5; // fallback

const fuelCost = calculateFuelCost(distanceKm, petrolPricePerLiter);

// In lines array, replace distanceSurcharge line:
{
  label: `Distance Surcharge (${distanceKm.toFixed(1)} km)`,
  amount: fuelCost,
  note: `Rs ${petrolPricePerLiter}/L petrol × ${distanceKm.toFixed(1)} km = Rs ${fuelCost}`,
}
```

Add petrol price banner:
```
📍 Petrol today: Rs {petrolPricePerLiter}/L • {distanceKm.toFixed(1)} km from provider
```

---

## PART 9 — APP INITIALIZATION (app/_layout.tsx)

On app launch sequence:
```typescript
useEffect(() => {
  initApp();
}, []);

const initApp = async () => {
  // 1. Load userId from AsyncStorage
  let uid = await AsyncStorage.getItem('karigar_user_id');
  if (!uid) {
    uid = 'user_' + Math.random().toString(36).slice(2);
    await AsyncStorage.setItem('karigar_user_id', uid);
  }

  // 2. Load user profile from Firestore
  const profile = await loadUserProfile(uid);
  if (profile) setUserProfile(profile);

  // 3. Request location permission + get location
  const hasLocation = await requestLocationPermission();
  if (hasLocation) {
    const loc = await getCurrentLocation();
    if (loc) setUserLocation(loc.latitude, loc.longitude);
  }

  // 4. Fetch petrol price
  const price = await fetchPetrolPrice();
  setPetrolPrice(price);

  // 5. Request notification permission
  await requestNotificationPermission();

  // 6. Load booking history from Firestore
  const bookings = await getUserBookings(uid);
  // add to store

  // 7. Generate smart reminders
  const month = new Date().getMonth() + 1;
  const reminders = await generateSmartReminders(profile || {}, bookings, month);
  setSmartReminders(reminders);

  // 8. Load chat history
  const sessions = await getUserChatSessions(uid);
  sessions.forEach(s => addChatSession(s));

  // 9. Check onboarding
  const onboarded = await AsyncStorage.getItem('karigar_onboarded');
  if (!onboarded) router.replace('/welcome');
};
```

---

## PART 10 — NAVIGATION UPDATES

Update app/_layout.tsx Stack.Screen list to include ALL screens:
```typescript
<Stack.Screen name="(tabs)" />
<Stack.Screen name="(provider-tabs)" />
<Stack.Screen name="welcome" options={{ gestureEnabled: false }} />
<Stack.Screen name="setup-profile" />
<Stack.Screen name="chat" />
<Stack.Screen name="provider-chat" />
<Stack.Screen name="trace" />
<Stack.Screen name="providers" />
<Stack.Screen name="scheduling" />
<Stack.Screen name="negotiation" />
<Stack.Screen name="pricing" />
<Stack.Screen name="confirm" />
<Stack.Screen name="recovery" />
<Stack.Screen name="feedback" />
```

---

## PART 11 — MOCK DATA EXPANSION (services/api.ts)

Add mock providers for all 15 categories in the FALLBACK mock data.
Each category needs minimum 3 mock providers:

Format (TypeScript constants before the sendRequest function):
```typescript
const AC_PROVIDERS = [...]; // existing 3
const PLUMBING_PROVIDERS = [
  { id: 'plum1', name: 'Hassan Plumbing', category: 'plumbing', rating: 4.6,
    base_rate_pkr: 600, trust_score: 88, verified: true,
    cancellation_rate_30d: 0.03, on_time_rate: 0.91, score: 88,
    rank_reason_urdu: 'تجربہ کار، فوری دستیاب' },
  { id: 'plum2', name: 'Usman Pipe Works', category: 'plumbing', rating: 4.3,
    base_rate_pkr: 500, trust_score: 76, verified: true,
    cancellation_rate_30d: 0.08, on_time_rate: 0.85, score: 76,
    rank_reason_urdu: 'کم قیمت، اچھی ریٹنگ' },
  { id: 'plum3', name: 'Karachi Plumbers', category: 'plumbing', rating: 4.0,
    base_rate_pkr: 450, trust_score: 62, verified: false,
    cancellation_rate_30d: 0.18, on_time_rate: 0.78, score: 62,
    rank_reason_urdu: 'سستا لیکن غیر تصدیق شدہ' },
];
const ELECTRICAL_PROVIDERS = [...]; // 3 providers
const TUTORING_PROVIDERS = [
  { id: 'tut1', name: 'Ahmad Academy', category: 'tutoring', rating: 4.9,
    base_rate_pkr: 800, trust_score: 96, verified: true,
    cancellation_rate_30d: 0.01, on_time_rate: 0.98, score: 96,
    rank_reason_urdu: 'بہترین ٹیوٹر، اعلی نتائج' },
  { id: 'tut2', name: 'Sara Home Tutor', category: 'tutoring', rating: 4.7,
    base_rate_pkr: 600, trust_score: 85, verified: true,
    cancellation_rate_30d: 0.04, on_time_rate: 0.93, score: 85,
    rank_reason_urdu: 'خواتین ٹیوٹر، O/A Level ماہر' },
  { id: 'tut3', name: 'Online Ustaad', category: 'tutoring', rating: 4.4,
    base_rate_pkr: 400, trust_score: 71, verified: false,
    cancellation_rate_30d: 0.12, on_time_rate: 0.82, score: 71,
    rank_reason_urdu: 'آن لائن آپشن دستیاب' },
];
const DRIVER_PROVIDERS = [...]; // 3 providers
const CLEANING_PROVIDERS = [...]; // 3 providers
const MECHANIC_PROVIDERS = [...]; // 3 providers
const BEAUTICIAN_PROVIDERS = [...]; // 3 providers
const CARPENTER_PROVIDERS = [...]; // 3 providers
const FREELANCER_PROVIDERS = [...]; // 3 providers

const PROVIDER_MAP: Record<string, any[]> = {
  AC_repair: AC_PROVIDERS, ac_repair: AC_PROVIDERS,
  plumbing: PLUMBING_PROVIDERS,
  electrical: ELECTRICAL_PROVIDERS,
  tutoring: TUTORING_PROVIDERS,
  driver: DRIVER_PROVIDERS,
  home_cleaning: CLEANING_PROVIDERS,
  mechanic: MECHANIC_PROVIDERS,
  beautician: BEAUTICIAN_PROVIDERS,
  carpenter: CARPENTER_PROVIDERS,
  freelancer: FREELANCER_PROVIDERS,
};

// Detect service type from message
const detectServiceType = (message: string): string => {
  const m = message.toLowerCase();
  if (m.includes('ac') || m.includes('cooling') || m.includes('thand') || m.includes('aircondition')) return 'AC_repair';
  if (m.includes('plumb') || m.includes('pipe') || m.includes('pani') || m.includes('nal')) return 'plumbing';
  if (m.includes('electr') || m.includes('bijli') || m.includes('wiring') || m.includes('current')) return 'electrical';
  if (m.includes('tutor') || m.includes('teacher') || m.includes('padhai') || m.includes('math') || m.includes('english class')) return 'tutoring';
  if (m.includes('driver') || m.includes('taxi') || m.includes('gari') || m.includes('ride')) return 'driver';
  if (m.includes('clean') || m.includes('safai') || m.includes('sweep')) return 'home_cleaning';
  if (m.includes('mechanic') || m.includes('car repair') || m.includes('engine')) return 'mechanic';
  if (m.includes('beauty') || m.includes('parlor') || m.includes('makeup') || m.includes('bridal')) return 'beautician';
  if (m.includes('carpen') || m.includes('furniture') || m.includes('door') || m.includes('wood')) return 'carpenter';
  if (m.includes('freelanc') || m.includes('logo') || m.includes('website') || m.includes('design')) return 'freelancer';
  return 'AC_repair'; // default fallback
};
```

---

## PART 12 — MULTI-AGENT SWARM LOGIC (Visual)

Add to app/trace.tsx a new "Swarm View" tab showing agents as interconnected nodes:

```
         [NLU Agent]
              |
    ┌─────────┼─────────┐
    ↓         ↓         ↓
[Discovery] [Context] [Profile]
    |         |         |
    └────┬────┘         |
         ↓              |
    [Ranking] ←─────────┘
         |
    [Negotiation]
         |
     [Booking]
         |
    [Recovery/Dispute]
```

Implement as simple SVG or absolute-positioned Views with connecting lines.
Animate the active agent with a pulsing teal glow.
Each node shows: agent name, last action, status (idle/active/done).

---

## PART 13 — FINAL CHECKS

### 13.1 Update babel.config.js (no change needed)

### 13.2 Verify package.json has all new dependencies:
Required: firebase, @react-native-async-storage/async-storage,
  expo-location, expo-notifications, expo-constants, expo-device

### 13.3 app.json permissions:
Add to expo > android > permissions:
  "ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION",
  "VIBRATE", "RECEIVE_BOOT_COMPLETED"
Add to expo > ios > infoPlist:
  NSLocationWhenInUseUsageDescription: "To find services near you"

### 13.4 TypeScript errors:
All optional chaining on currentResponse fields (?.service_type, etc.)
Provider interface must have both camelCase and snake_case aliases

### 13.5 Run after all changes:
  cd C:\Users\admin\Downloads\karigar-ai\karigar-mobile
  npm install
  npx expo start --clear

---

## EXECUTION ORDER

Build in this exact order to avoid dependency errors:
1. services/firebase.ts
2. services/firebase-service.ts
3. services/location.ts
4. services/petrol.ts
5. services/notifications.ts
6. services/smart-reminders.ts
7. services/api.ts (update with detectServiceType + all mock providers)
8. store/index.ts (complete rewrite)
9. app/welcome.tsx (new)
10. app/setup-profile.tsx (new)
11. app/provider-chat.tsx (new)
12. app/scheduling.tsx (new)
13. app/(provider-tabs)/_layout.tsx + all provider tab screens (new)
14. app/_layout.tsx (update with onboarding check + new screens)
15. app/(tabs)/index.tsx (update: real name, 15 categories, smart reminders)
16. app/chat.tsx (update: chat list + follow-up questions + session save)
17. app/providers.tsx (update: slot selection modal added)
18. app/pricing.tsx (update: petrol price integration)
19. app/confirm.tsx (update: real notifications)
20. app/(tabs)/track.tsx (rewrite: live GPS simulation)
21. app/(tabs)/bookings.tsx (update: dispute modal with text input)
22. app/(tabs)/profile.tsx (rewrite: editable + address)
23. app/feedback.tsx (update: real score updates + negative checklist)
24. app/trace.tsx (update: A2A tab + swarm view)

---

## KNOWN BUGS TO FIX (from user testing)

1. BUG: Voice button always types AC message regardless of category clicked.
   FIX: Store selectedCategory in state. Voice mock text = `I need [selectedCategory] service [at homeAddress if set]`

2. BUG: Tutoring chip → chat shows AC providers response.
   FIX: api.ts detectServiceType must correctly map tutoring → TUTORING_PROVIDERS in mock

3. BUG: "Message" button in confirm goes to AI chat.
   FIX: Router.push('/provider-chat') — separate screen for provider messaging

4. BUG: Track screen blank/countdown only.
   FIX: Complete GPS simulation with expo-location + animated movement

5. BUG: Call provider shows alert but nothing works.
   FIX: Use Linking.openURL(`tel:${providerPhone}`) — real device dialer

6. BUG: Dispute has no text input.
   FIX: Full dispute modal with category chips + multiline TextInput

7. BUG: Rating doesn't affect provider score.
   FIX: updateProviderScore in store + Firestore updateProviderRating call

8. BUG: Score shows 94 after bad review instead of decreasing.
   FIX: updateProviderScore must find provider by ID and modify score in place

9. BUG: No time slot selection before booking.
   FIX: Scheduling screen or bottom sheet after provider selection

10. BUG: No follow-up questions in chat when details missing.
    FIX: checkMissingInfo() after every AI response

11. BUG: Notifications don't fire after booking.
    FIX: expo-notifications properly configured with showBookingNotification()

12. BUG: Home page shows "Good Morning, Saad" (hardcoded).
    FIX: Use userProfile.name from store, loaded from Firestore

---

## DEMO SCRIPT (Judge-facing, 5 minutes)

Min 0:30 — Open app, show welcome screen, select "Customer", set up profile with location
Min 1:00 — Home: smart reminders show "AC Season" + "Petrol at Rs 248/L" cards
Min 1:30 — Tap "Tutoring" chip → chat opens → types correct tutoring message
Min 2:00 — AI responds with tutoring providers (not AC!) with 8-factor breakdown visible
Min 2:30 — Select provider → slot selector → choose "Tomorrow 4:00 PM"
Min 3:00 — Pricing screen: animated line-by-line with petrol distance cost + Fairness bars
Min 3:30 — Confirm: push notification fires + WhatsApp popup + "Rate Service" row visible
Min 4:00 — Track: GPS simulation of provider moving toward user
Min 4:30 — Demo Mode Scenario 2: provider cancels → 8-second recovery animation
Min 5:00 — Trace screen: 7 agents + A2A communication + swarm view

---

END OF PROMPT
