import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Switch,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import {
  useStore,
  AgentResponse,
  ProviderJob,
  ServiceProfile,
  defaultServiceProfile,
  TRAVEL_ANYWHERE_KM,
  normalizeServiceProfiles,
  type CancellationPolicyOption,
  type SpecializationLevel,
} from '../../store';
import { detectLanguage, getProviderRequests, sendRequest } from '../../services/api';
import { scheduleLocalNotification } from '../../services/pushNotifications';

const PROVIDER_DEFAULT_LOC = { lat: 33.6844, lng: 73.0479 };

type IncomingRequest = {
  id: string;
  service_type: string;
  location: string;
  budget: number;
  urgency: number;
  minutes_ago: number;
  status: string;
};

type IncomingRequestWithDistance = IncomingRequest & { distance_km?: number };

const SERVICES_15 = [
  { id: 'AC_repair', label: 'AC Repair', icon: 'snow-outline', color: '#3498DB' },
  { id: 'plumbing', label: 'Plumbing', icon: 'water-outline', color: '#34495E' },
  { id: 'electrical', label: 'Electrical', icon: 'flash-outline', color: '#E74C3C' },
  { id: 'tutoring', label: 'Tutoring', icon: 'book-outline', color: '#2ECC71' },
  { id: 'home_cleaning', label: 'Cleaning', icon: 'home-outline', color: '#16A085' },
  { id: 'driver', label: 'Driver', icon: 'car-outline', color: '#F39C12' },
  { id: 'mechanic', label: 'Mechanic', icon: 'build-outline', color: '#7F8C8D' },
  { id: 'carpenter', label: 'Carpenter', icon: 'hammer-outline', color: '#D35400' },
  { id: 'painter', label: 'Painter', icon: 'color-fill-outline', color: '#9B59B6' },
  { id: 'freelancer', label: 'Freelancer', icon: 'laptop-outline', color: '#8E44AD' },
  { id: 'cook', label: 'Cook/Chef', icon: 'restaurant-outline', color: '#C0392B' },
  { id: 'security', label: 'Security', icon: 'shield-checkmark-outline', color: '#2C3E50' },
  { id: 'gardener', label: 'Gardener', icon: 'leaf-outline', color: '#27AE60' },
  { id: 'tailor', label: 'Tailor', icon: 'cut-outline', color: '#E67E22' },
  { id: 'beautician', label: 'Beauty', icon: 'sparkles-outline', color: '#E91E63' },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const HOURS = ['Morning', 'Afternoon', 'Evening', 'Night'] as const;
const TRAVEL_CHIPS: Array<{ km: 2 | 5 | 10 | 999; label: string }> = [
  { km: 2, label: '2 km' },
  { km: 5, label: '5 km' },
  { km: 10, label: '10 km' },
  { km: 999, label: 'Anywhere' },
];
const CANCEL_OPTS: Array<{ id: CancellationPolicyOption; label: string }> = [
  { id: 'free', label: 'Free cancel' },
  { id: 'rs100', label: 'Rs 100' },
  { id: 'no_cancel', label: 'No cancel' },
];

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const s =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  return R * c;
}

function inferIslamabadCoords(locationLabel: string): { lat: number; lng: number } | null {
  const m = locationLabel.toUpperCase();
  if (m.includes('G-13')) return { lat: 33.6513, lng: 72.966 };
  if (m.includes('F-10')) return { lat: 33.6906, lng: 73.0061 };
  if (m.includes('G-9')) return { lat: 33.6889, lng: 73.0239 };
  if (m.includes('I-8')) return { lat: 33.6666, lng: 73.0603 };
  if (m.includes('E-11')) return { lat: 33.7007, lng: 73.0519 };
  return { lat: 33.6844 + (m.charCodeAt(0) % 7) * 0.008, lng: 73.0479 + (m.length % 5) * 0.006 };
}

function getTravelRadiusKm(
  profiles: Record<string, ServiceProfile>,
  serviceType?: string
): number {
  const map = normalizeServiceProfiles(profiles);
  const active = Object.values(map).filter((p) => p.isActive);
  if (!active.length) return 5;
  if (serviceType && map[serviceType]?.isActive) {
    return map[serviceType].travelRadiusKm;
  }
  return Math.max(...active.map((p) => p.travelRadiusKm));
}

function filterByTravelRadius(
  list: IncomingRequestWithDistance[],
  profiles: Record<string, ServiceProfile>,
  origin: { lat: number; lng: number }
) {
  return list.filter((r) => {
    const to = inferIslamabadCoords(r.location);
    if (!to) return true;
    const km = haversineKm(origin, to);
    const radius = getTravelRadiusKm(profiles, r.service_type);
    if (radius >= TRAVEL_ANYWHERE_KM) return true;
    return km <= radius;
  }).map((r) => {
    const to = inferIslamabadCoords(r.location);
    if (!to) return r;
    return { ...r, distance_km: haversineKm(origin, to) };
  });
}

function LiveBadge() {
  const pulse = React.useRef(new Animated.Value(1)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.35, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <View style={styles.liveRow}>
      <Animated.View style={[styles.liveDot, { transform: [{ scale: pulse }] }]} />
      <Text style={styles.liveTxt}>LIVE</Text>
    </View>
  );
}

export default function ProviderHomeScreen() {
  const router = useRouter();
  const {
    theme,
    sessionId,
    userId,
    firebaseUid,
    notificationsEnabled,
    providerOnline,
    setProviderOnline,
    providerServiceProfiles,
    upsertProviderServiceProfile,
    providerVerified,
    setProviderVerified,
    providerDashboard,
    providerScore,
    providerAvgRatingLocal,
    bookingHistory,
    recomputeProviderDashboard,
    calculateProviderScore,
    providerActiveJob,
    setProviderActiveJob,
    providerIncomingRequests,
    acceptIncomingRequest,
    declineIncomingRequest,
  } = useStore();

  const profiles = normalizeServiceProfiles(providerServiceProfiles);

  const isDark = theme === 'dark';
  const bg = isDark ? '#0A0A0F' : '#F8F9FA';
  const textMain = isDark ? '#fff' : '#111';
  const textSub = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF';

  // Persistent demo requests for demonstration videos
  const DEMO_REQUESTS: IncomingRequestWithDistance[] = [
    {
      id: 'DEMO-1',
      service_type: 'plumbing',
      location: 'G-13/1, Islamabad',
      budget: 850,
      urgency: 4,
      minutes_ago: 2,
      status: 'pending',
      customerName: 'Ahmad Ali',
      distance_km: 1.2
    } as any,
    {
      id: 'DEMO-2',
      service_type: 'electrical',
      location: 'F-10/2, Islamabad',
      budget: 1200,
      urgency: 5,
      minutes_ago: 11,
      status: 'pending',
      customerName: 'Sarah K.',
      distance_km: 2.8
    } as any
  ];

  const [requests, setRequests] = React.useState<IncomingRequestWithDistance[]>(DEMO_REQUESTS);
  const lastIds = React.useRef<string[]>([]);
  const [providerLoc, setProviderLoc] = React.useState(PROVIDER_DEFAULT_LOC);

  const [editOpen, setEditOpen] = React.useState(false);
  const [editSvc, setEditSvc] = React.useState<(typeof SERVICES_15)[number] | null>(null);
  const [draft, setDraft] = React.useState<ServiceProfile | null>(null);

  const [verifyOpen, setVerifyOpen] = React.useState(false);
  const [otp, setOtp] = React.useState('');

  const [assistantInput, setAssistantInput] = React.useState('');
  const [assistantReply, setAssistantReply] = React.useState(
    'Assalam o Alaikum! Rates, schedule, ya trust score — poochhein.'
  );
  const [assistantLoading, setAssistantLoading] = React.useState(false);

  const openEditor = (svc: (typeof SERVICES_15)[number]) => {
    setEditSvc(svc);
    const existing = profiles[svc.id];
    setDraft(existing ? { ...existing } : defaultServiceProfile(svc.id));
    setEditOpen(true);
  };

  const patchDraft = (patch: Partial<ServiceProfile>) => {
    setDraft((d) => (d ? { ...d, ...patch } : d));
  };

  const toggleDay = (day: string) => {
    if (!draft) return;
    const has = draft.availability.includes(day);
    patchDraft({
      availability: has ? draft.availability.filter((d) => d !== day) : [...draft.availability, day],
    });
  };

  const toggleHour = (h: string) => {
    if (!draft) return;
    const has = draft.preferredHours.includes(h);
    patchDraft({
      preferredHours: has ? draft.preferredHours.filter((x) => x !== h) : [...draft.preferredHours, h],
    });
  };

  const saveProfile = () => {
    if (!draft) return;
    upsertProviderServiceProfile(draft);
    setEditOpen(false);
    calculateProviderScore();
  };

  React.useEffect(() => {
    Location.requestForegroundPermissionsAsync()
      .then((p) => (p.status === 'granted' ? Location.getCurrentPositionAsync({}) : null))
      .then((loc) => {
        if (loc) setProviderLoc({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      })
      .catch(() => {});
    calculateProviderScore();
  }, []);

  const poll = React.useCallback(async () => {
    if (!providerOnline) return;
    const list = (await getProviderRequests(firebaseUid || undefined)) as unknown;
    const serverArr: IncomingRequest[] = Array.isArray(list) ? (list as IncomingRequest[]) : [];
    
    // Merge with local store requests
    const storeArr: IncomingRequest[] = providerIncomingRequests.map(r => ({
      id: r.id,
      service_type: r.service_type,
      location: r.location,
      budget: r.budget,
      urgency: r.urgency,
      minutes_ago: r.minutes_ago,
      status: r.status
    }));

    // Dedup by ID
    const merged = [...storeArr, ...serverArr].filter(
      (v, i, a) => a.findIndex(t => t.id === v.id) === i
    );

    const filtered = filterByTravelRadius(merged, profiles, providerLoc);
    
    // Always show DEMO requests for the video, even if not in radius/online
    const finalDisplay = [
      ...DEMO_REQUESTS,
      ...filtered.filter(r => !DEMO_REQUESTS.some(d => d.id === r.id))
    ];

    const ids = finalDisplay.map((r) => String(r.id));
    const newOnes = ids.filter((id) => !lastIds.current.includes(id));
    lastIds.current = ids;
    setRequests(finalDisplay);
    recomputeProviderDashboard();

    if (newOnes.length > 0) {
      const req = filtered.find((r) => String(r.id) === newOnes[0]);
      if (req) {
        scheduleLocalNotification(
          'New job request',
          `${req.service_type.replace('_', ' ')} • Rs ${req.budget} • ${req.location}`,
          { enabled: notificationsEnabled }
        );
      }
    }
  }, [
    providerOnline,
    firebaseUid,
    providerLoc,
    profiles,
    recomputeProviderDashboard,
    notificationsEnabled,
  ]);

  React.useEffect(() => {
    poll().catch(() => {});
    // When offline, we still show placeholders
    if (!providerOnline) {
      setRequests(DEMO_REQUESTS);
      return;
    }
    const t = setInterval(() => poll().catch(() => {}), 15000);
    return () => clearInterval(t);
  }, [providerOnline, poll]);

  const accept = async (req: IncomingRequestWithDistance) => {
    // Check if it's a store request
    if (providerIncomingRequests.some(r => r.id === req.id)) {
      acceptIncomingRequest(req.id);
      router.push('/(tabs)/provider-jobs');
      return;
    }

    const job: ProviderJob = {
      id: `JOB-${Date.now()}`,
      requestId: req.id,
      customerName: 'Customer',
      serviceType: req.service_type,
      locationLabel: req.location,
      budget: req.budget,
      urgency: req.urgency,
      distanceKm: typeof req.distance_km === 'number' ? req.distance_km : undefined,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    setProviderActiveJob(job);
    await scheduleLocalNotification(
      'Job accepted',
      `You accepted ${req.service_type.replace('_', ' ')} at ${req.location}.`,
      { enabled: notificationsEnabled }
    );
    router.push('/provider-job-active');
  };

  const decline = (id: string) => {
    if (providerIncomingRequests.some(r => r.id === id)) {
      declineIncomingRequest(id);
    }
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const cancelled = bookingHistory.filter((b) => b.status === 'cancelled').length;
  const totalJobs = Math.max(1, bookingHistory.length);
  const cancelRate = cancelled / totalJobs;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const jobsThisWeek = bookingHistory.filter((b) => {
    const t = Date.parse(b.createdAt || '');
    return Number.isFinite(t) && t >= weekAgo && b.status === 'completed';
  }).length;

  type Reminder = { id: string; title: string; desc: string; cta: string; onPress: () => void };
  const smartReminders: Reminder[] = [];
  if (!providerVerified) {
    smartReminders.push({
      id: 'verify',
      title: 'Verify your profile',
      desc: 'Verified providers get more jobs and higher trust.',
      cta: 'Verify',
      onPress: () => setVerifyOpen(true),
    });
  }
  if (cancelRate > 0.15) {
    smartReminders.push({
      id: 'cancel',
      title: 'High cancellation rate',
      desc: `Your 30-day cancel rate is ${Math.round(cancelRate * 100)}%. Aim under 15% to protect rank.`,
      cta: 'Tips',
      onPress: () =>
        setAssistantReply('Cancellation rate zyada hai — jobs accept sirf tab karein jab sure hon. Rs 100 policy set karein.'),
    });
  }
  if (providerOnline && jobsThisWeek === 0) {
    smartReminders.push({
      id: 'noseek',
      title: 'No jobs this week',
      desc: 'Expand travel radius or add more active services to get matched.',
      cta: 'Edit services',
      onPress: () => openEditor(SERVICES_15[0]),
    });
  }
  if (providerAvgRatingLocal < 4) {
    smartReminders.push({
      id: 'rating',
      title: 'Rating below 4.0',
      desc: `Current avg ${providerAvgRatingLocal.toFixed(1)}. Reply faster and complete on time.`,
      cta: 'Improve',
      onPress: () => router.push('/(tabs)/provider'),
    });
  }
  if (providerScore >= 70) {
    smartReminders.push({
      id: 'top',
      title: 'Top 30% in your area',
      desc: 'You are in the default top tier for matching. Keep on-time rate high.',
      cta: 'Dashboard',
      onPress: () => router.push('/(tabs)/provider'),
    });
  }

  const primaryReminder =
    smartReminders[0] ||
    (providerActiveJob
      ? {
          id: 'active',
          title: 'Active job in progress',
          desc: 'Continue tracking your active job.',
          cta: 'Open job',
          onPress: () => router.push('/provider-job-active'),
        }
      : {
          id: 'online',
          title: 'Stay online',
          desc: 'Go online to receive new requests every 15 seconds.',
          cta: 'Go online',
          onPress: () => setProviderOnline(true),
        });

  const handleAssistant = async () => {
    const msg = assistantInput.trim();
    if (!msg || assistantLoading) return;
    const lang = detectLanguage(msg);
    setAssistantLoading(true);
    setAssistantInput('');
    setAssistantReply(lang === 'urdu' ? 'Soch raha hoon...' : 'Thinking...');
    
    // Build context about the provider
    const confirmed = bookingHistory.filter(b => b.status === 'completed').length;
    const cancelled = bookingHistory.filter(b => b.status === 'cancelled').length;
    const active = providerActiveJob ? 1 : 0;
    const providerContext = `Provider Stats: ${confirmed} confirmed, ${cancelled} cancelled, ${active} active jobs. Current Score: ${providerScore}. Verified: ${providerVerified ? 'YES' : 'NO'}. Services: ${Object.keys(profiles).filter(k=>profiles[k].isActive).join(', ')}.`;

    const appendContext = lang === 'urdu'
        ? `Aap Karigar provider ke agent ho. Provider Status: ${providerContext}. User Roman Urdu mein baat kar raha hai, aap bhi Roman Urdu mein jawab dein. Choti aur helpful baat karein.`
        : `You are the Karigar provider's personal agent. Provider Status: ${providerContext}. Discuss rates, schedule, and rank tips.`;

    try {
      // Race the real request against a 2-second timeout for snappier experience
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT')), 2500)
      );

      const res = await Promise.race([
        sendRequest(msg, sessionId, userId, undefined, { 
          appendContext,
          role: 'provider',
          userContext: {
            name: typeof userName === 'string' ? userName : 'Provider',
            recentServices: Object.keys(profiles).filter(k => profiles[k].isActive),
            historyStats: { confirmed, cancelled, disputed: 0 },
            address: 'Islamabad',
          }
        }),
        timeoutPromise
      ]) as AgentResponse;
      
      const reply = lang === 'urdu'
          ? (res.response_urdu || res.response_en || 'Main ne check kiya hai, mazeed maloomat ke liye poochein.')
          : (res.response_en || res.response_urdu || 'I processed your request, feel free to ask more.');
      setAssistantReply(reply);
    } catch (e) {
      // Robust Offline Fallback for Provider Assistant
      let localReply = '';
      const lowMsg = msg.toLowerCase();
      
      if (lowMsg.includes('earning') || lowMsg.includes('tip') || lowMsg.includes('kamai')) {
        localReply = lang === 'urdu' 
          ? 'Kamai barhanay ke liye peak hours (6-10 PM) mein online rahen aur 4.5+ rating maintain karen.'
          : 'To boost earnings, stay online during peak hours (6-10 PM) and maintain a 4.5+ rating.';
      } else if (lowMsg.includes('rate') || lowMsg.includes('price') || lowMsg.includes('rupay')) {
        localReply = lang === 'urdu'
          ? 'Market mein average rates Rs 800-1500 hain. Aap ki performance ke mutabiq Rs 1000 behtar hai.'
          : 'Market rates are between Rs 800-1500. Based on your stats, Rs 1000 is a competitive rate.';
      } else {
        localReply = lang === 'urdu'
          ? `Aap ka sawal: "${msg}" - Is bare mein mazeed jannay ke liye rates ya earning tips poochein.`
          : `About "${msg}": Ask me specifically about rates, schedule, or tips to help you more.`;
      }
      setAssistantReply(localReply);
    } finally {
      setAssistantLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 60, paddingBottom: 120 }}>
        <View style={styles.headerRow}>
          <View>
            <Text style={{ color: textSub, fontWeight: '700' }}>Provider Home</Text>
            <Text style={{ color: textMain, fontSize: 24, fontWeight: '900', marginTop: 4 }}>
              {providerOnline ? "You're Online" : "You're Offline"}
            </Text>
          </View>
          <View style={[styles.onlinePill, { backgroundColor: providerOnline ? '#2ECC7120' : '#E74C3C20' }]}>
            {providerOnline && <LiveBadge />}
            <Text style={{ color: providerOnline ? '#2ECC71' : '#E74C3C', fontWeight: '900', marginRight: 10 }}>
              {providerOnline ? 'ONLINE' : 'OFFLINE'}
            </Text>
            <Switch value={providerOnline} onValueChange={setProviderOnline} />
          </View>
        </View>

        {smartReminders.slice(0, 2).map((r) => (
          <TouchableOpacity
            key={r.id}
            style={[styles.reminderCard, { backgroundColor: cardBg, marginTop: 10 }]}
            onPress={r.onPress}
          >
            <Ionicons name="bulb-outline" size={20} color="#F39C12" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ color: textMain, fontWeight: '900' }}>{r.title}</Text>
              <Text style={{ color: textSub, marginTop: 4, fontSize: 12 }}>{r.desc}</Text>
            </View>
            <View style={styles.ctaPill}>
              <Text style={{ color: '#0D7377', fontWeight: '900', fontSize: 11 }}>{r.cta}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.reminderCard, { backgroundColor: cardBg, borderColor: 'rgba(13,115,119,0.25)', marginTop: 10 }]}
          onPress={primaryReminder.onPress}
        >
          <Ionicons name="notifications-outline" size={20} color="#0D7377" />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={{ color: textMain, fontWeight: '900' }}>{primaryReminder.title}</Text>
            <Text style={{ color: textSub, marginTop: 4 }}>{primaryReminder.desc}</Text>
          </View>
          <View style={styles.ctaPill}>
            <Text style={{ color: '#0D7377', fontWeight: '900' }}>{primaryReminder.cta}</Text>
          </View>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: textMain }]}>Register services</Text>
        <View style={styles.grid}>
          {SERVICES_15.map((svc) => {
            const exists = profiles[svc.id]?.isActive;
            return (
              <TouchableOpacity key={svc.id} style={[styles.svcCard, { backgroundColor: cardBg }]} onPress={() => openEditor(svc)}>
                <View style={[styles.iconCircle, { backgroundColor: svc.color + '22' }]}>
                  <Ionicons name={svc.icon as keyof typeof Ionicons.glyphMap} size={22} color={svc.color} />
                </View>
                <Text style={{ color: textMain, fontWeight: '700', fontSize: 11, textAlign: 'center' }} numberOfLines={2}>
                  {svc.label}
                </Text>
                {exists && (
                  <View style={styles.check}>
                    <Ionicons name="checkmark-circle" size={16} color="#2ECC71" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <Text style={[styles.sectionTitle, { color: textMain, marginBottom: 0 }]}>Incoming requests</Text>
          {providerOnline && requests.length > 0 && <LiveBadge />}
        </View>
        {!providerOnline && (
          <Text style={{ color: textSub, fontStyle: 'italic', marginBottom: 10 }}>
            Go online to poll requests (filtered by travel radius from {PROVIDER_DEFAULT_LOC.lat.toFixed(2)}, {PROVIDER_DEFAULT_LOC.lng.toFixed(2)}).
          </Text>
        )}
        {providerOnline && requests.length === 0 && (
          <Text style={{ color: textSub, fontStyle: 'italic', marginBottom: 10 }}>
            No requests in your travel radius right now.
          </Text>
        )}
        {requests.map((r) => (
          <View key={r.id} style={[styles.reqCard, { backgroundColor: cardBg }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.tag, { backgroundColor: '#3498DB20' }]}>
                  <Text style={{ color: '#3498DB', fontWeight: '900', fontSize: 12 }}>
                    {String(r.service_type).replace('_', ' ')}
                  </Text>
                </View>
                {r.minutes_ago <= 5 && <LiveBadge />}
              </View>
              <Text style={{ color: textSub, fontSize: 12 }}>{r.minutes_ago}m ago</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="location-outline" size={14} color={textSub} />
              <Text style={{ color: textMain, flex: 1 }}>{r.location}</Text>
            </View>
            {(r as any).customerName && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <Ionicons name="person-outline" size={14} color={textSub} />
                <Text style={{ color: textSub, fontSize: 13 }}>{(r as any).customerName}</Text>
              </View>
            )}
            <Text style={{ color: textSub, marginTop: 6 }}>
              Rs {r.budget} • Urgency {r.urgency}/5
              {typeof r.distance_km === 'number' ? ` • ${r.distance_km.toFixed(1)} km` : ''}
            </Text>
            <View style={styles.reqActions}>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}
                onPress={() => decline(r.id)}
              >
                <Text style={{ color: textMain, fontWeight: '900' }}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, { backgroundColor: '#0D7377' }]} onPress={() => accept(r)}>
                <Text style={{ color: '#fff', fontWeight: '900' }}>Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <Text style={[styles.sectionTitle, { color: textMain, marginTop: 12 }]}>Provider assistant</Text>
        <View style={[styles.assistantCard, { backgroundColor: cardBg }]}>
          <Text style={{ color: textMain, fontSize: 13, lineHeight: 20 }}>{assistantReply}</Text>
          <View style={{ flexDirection: 'row', marginTop: 10, gap: 8 }}>
            <TextInput
              value={assistantInput}
              onChangeText={setAssistantInput}
              placeholder="Rates / schedule / trust..."
              placeholderTextColor={textSub}
              style={[styles.assistantInput, { color: textMain }]}
              editable={!assistantLoading}
            />
            <TouchableOpacity style={styles.assistantSend} onPress={handleAssistant} disabled={assistantLoading}>
              {assistantLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="send" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.statsRow, { marginTop: 6 }]}>
          <View style={[styles.statCard, { backgroundColor: cardBg }]}>
            <Ionicons name="cash-outline" size={18} color="#2ECC71" />
            <Text style={{ color: textSub, fontSize: 12, marginTop: 6 }}>Today</Text>
            <Text style={{ color: '#2ECC71', fontWeight: '900', fontSize: 18 }}>
              Rs {Math.round(providerDashboard.todayEarningsPkr)}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: cardBg }]}>
            <Ionicons name="trophy-outline" size={18} color="#9B59B6" />
            <Text style={{ color: textSub, fontSize: 12, marginTop: 6 }}>Score</Text>
            <Text style={{ color: '#9B59B6', fontWeight: '900', fontSize: 18 }}>{providerScore}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: cardBg }]}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#F39C12" />
            <Text style={{ color: textSub, fontSize: 12, marginTop: 6 }}>Verified</Text>
            <Text style={{ color: providerVerified ? '#2ECC71' : '#E74C3C', fontWeight: '900', fontSize: 18 }}>
              {providerVerified ? 'Yes' : 'No'}
            </Text>
          </View>
        </View>
      </ScrollView>

      <Modal visible={editOpen} transparent animationType="slide" onRequestClose={() => setEditOpen(false)}>
        <View style={styles.modalBg}>
          <ScrollView style={{ maxHeight: '92%' }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}>
            <View style={[styles.sheet, { backgroundColor: isDark ? '#1E1E24' : '#fff' }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: textMain, fontSize: 18, fontWeight: '900' }}>
                  {editSvc?.label || 'Service'} profile
                </Text>
                <TouchableOpacity onPress={() => setEditOpen(false)}>
                  <Ionicons name="close" size={22} color={textSub} />
                </TouchableOpacity>
              </View>

              {draft && (
                <>
                  <Text style={{ color: textSub, fontWeight: '800', marginTop: 14 }}>Specialization</Text>
                  <View style={styles.chipRow}>
                    {(['basic', 'intermediate', 'expert'] as SpecializationLevel[]).map((lvl) => (
                      <TouchableOpacity
                        key={lvl}
                        style={[styles.chip, draft.specialization === lvl && styles.chipOn]}
                        onPress={() => patchDraft({ specialization: lvl })}
                      >
                        <Text style={{ color: draft.specialization === lvl ? '#fff' : textMain, fontWeight: '700', fontSize: 12 }}>
                          {lvl}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.field}>
                    <Text style={{ color: textSub, fontWeight: '800' }}>Years experience</Text>
                    <TextInput
                      value={String(draft.yearsExperience)}
                      onChangeText={(t) => patchDraft({ yearsExperience: parseInt(t, 10) || 0 })}
                      keyboardType="numeric"
                      style={[styles.input, { color: textMain }]}
                    />
                  </View>

                  <Text style={{ color: textSub, fontWeight: '800' }}>
                    On-time rate: {draft.onTimeRate}%
                  </Text>
                  <View style={styles.sliderTrack}>
                    <View style={[styles.sliderFill, { width: `${draft.onTimeRate}%` }]} />
                  </View>
                  <View style={styles.sliderBtns}>
                    {[0, 25, 50, 75, 100].map((v) => (
                      <TouchableOpacity key={v} onPress={() => patchDraft({ onTimeRate: v })}>
                        <Text style={{ color: draft.onTimeRate === v ? '#0D7377' : textSub, fontWeight: '700', fontSize: 11 }}>
                          {v}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={{ color: textSub, fontWeight: '800', marginTop: 8 }}>Travel radius</Text>
                  <View style={styles.chipRow}>
                    {TRAVEL_CHIPS.map((c) => (
                      <TouchableOpacity
                        key={c.km}
                        style={[styles.chip, draft.travelRadiusKm === c.km && styles.chipOn]}
                        onPress={() => patchDraft({ travelRadiusKm: c.km })}
                      >
                        <Text style={{ color: draft.travelRadiusKm === c.km ? '#fff' : textMain, fontWeight: '700', fontSize: 12 }}>
                          {c.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={{ color: textSub, fontWeight: '800', marginTop: 8 }}>Availability</Text>
                  <View style={styles.chipRow}>
                    {DAYS.map((d) => (
                      <TouchableOpacity
                        key={d}
                        style={[styles.chipSmall, draft.availability.includes(d) && styles.chipOn]}
                        onPress={() => toggleDay(d)}
                      >
                        <Text style={{ color: draft.availability.includes(d) ? '#fff' : textMain, fontSize: 11, fontWeight: '700' }}>
                          {d}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={{ color: textSub, fontWeight: '800', marginTop: 8 }}>Preferred hours</Text>
                  <View style={styles.chipRow}>
                    {HOURS.map((h) => (
                      <TouchableOpacity
                        key={h}
                        style={[styles.chip, draft.preferredHours.includes(h) && styles.chipOn]}
                        onPress={() => toggleHour(h)}
                      >
                        <Text style={{ color: draft.preferredHours.includes(h) ? '#fff' : textMain, fontWeight: '700', fontSize: 12 }}>
                          {h}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.field}>
                    <Text style={{ color: textSub, fontWeight: '800' }}>Minimum budget (Rs)</Text>
                    <TextInput
                      value={String(draft.minBudgetPkr)}
                      onChangeText={(t) => patchDraft({ minBudgetPkr: parseInt(t, 10) || 0 })}
                      keyboardType="numeric"
                      style={[styles.input, { color: textMain }]}
                    />
                  </View>
                  <View style={styles.field}>
                    <Text style={{ color: textSub, fontWeight: '800' }}>Base rate (Rs)</Text>
                    <TextInput
                      value={String(draft.baseRatePkr)}
                      onChangeText={(t) => patchDraft({ baseRatePkr: parseInt(t, 10) || 0 })}
                      keyboardType="numeric"
                      style={[styles.input, { color: textMain }]}
                    />
                  </View>

                  <Text style={{ color: textSub, fontWeight: '800' }}>Cancellation policy</Text>
                  <View style={styles.chipRow}>
                    {CANCEL_OPTS.map((c) => (
                      <TouchableOpacity
                        key={c.id}
                        style={[styles.chip, draft.cancellationPolicy === c.id && styles.chipOn]}
                        onPress={() => patchDraft({ cancellationPolicy: c.id })}
                      >
                        <Text style={{ color: draft.cancellationPolicy === c.id ? '#fff' : textMain, fontWeight: '700', fontSize: 11 }}>
                          {c.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.field}>
                    <Text style={{ color: textSub, fontWeight: '800' }}>Notes</Text>
                    <TextInput
                      value={draft.notes}
                      onChangeText={(t) => patchDraft({ notes: t })}
                      placeholder="Visit fee, tools, etc."
                      placeholderTextColor={textSub}
                      style={[styles.input, { color: textMain, height: 60 }]}
                      multiline
                    />
                  </View>

                  <View style={[styles.field, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                    <Text style={{ color: textMain, fontWeight: '900' }}>Active</Text>
                    <Switch value={draft.isActive} onValueChange={(v) => patchDraft({ isActive: v })} />
                  </View>

                  <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}>
                    <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>Save profile</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={verifyOpen} transparent animationType="fade" onRequestClose={() => setVerifyOpen(false)}>
        <View style={styles.verifyBg}>
          <View style={[styles.verifyCard, { backgroundColor: isDark ? '#1E1E24' : '#fff' }]}>
            <Text style={{ color: textMain, fontSize: 18, fontWeight: '900' }}>Verify provider</Text>
            <Text style={{ color: textSub, marginTop: 6 }}>
              Demo OTP: <Text style={{ fontWeight: '900', color: textMain }}>1234</Text>
            </Text>
            <TextInput
              value={otp}
              onChangeText={setOtp}
              keyboardType="numeric"
              style={[styles.otp, { color: textMain, borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)' }]}
              placeholder="1234"
              placeholderTextColor={textSub}
              maxLength={4}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <TouchableOpacity
                style={[styles.verifyBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}
                onPress={() => setVerifyOpen(false)}
              >
                <Text style={{ color: textMain, fontWeight: '900' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.verifyBtn, { backgroundColor: '#0D7377' }]}
                onPress={() => {
                  if (otp.trim() === '1234') {
                    setProviderVerified(true);
                    setVerifyOpen(false);
                    setOtp('');
                    calculateProviderScore();
                  }
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '900' }}>Verify</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  onlinePill: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, flexDirection: 'row', alignItems: 'center' },
  liveRow: { flexDirection: 'row', alignItems: 'center', marginRight: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E74C3C', marginRight: 4 },
  liveTxt: { color: '#E74C3C', fontWeight: '900', fontSize: 10 },
  reminderCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(150,150,150,0.12)' },
  ctaPill: { backgroundColor: 'rgba(13,115,119,0.12)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '900', marginTop: 8, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  svcCard: { width: '31%', borderRadius: 16, padding: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12, position: 'relative' },
  iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  check: { position: 'absolute', top: 8, right: 8 },
  reqCard: { padding: 14, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(150,150,150,0.10)', marginBottom: 12 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, alignSelf: 'flex-start' },
  reqActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center' },
  assistantCard: { padding: 14, borderRadius: 16, marginBottom: 16 },
  assistantInput: { flex: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(150,150,150,0.12)' },
  assistantSend: { backgroundColor: '#0D7377', width: 44, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 18, paddingBottom: 28 },
  field: { marginBottom: 12 },
  input: { marginTop: 6, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: 'rgba(150,150,150,0.10)' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, marginBottom: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(150,150,150,0.12)' },
  chipSmall: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 10, backgroundColor: 'rgba(150,150,150,0.12)' },
  chipOn: { backgroundColor: '#0D7377' },
  sliderTrack: { height: 8, backgroundColor: 'rgba(150,150,150,0.2)', borderRadius: 4, marginTop: 8, overflow: 'hidden' },
  sliderFill: { height: '100%', backgroundColor: '#0D7377', borderRadius: 4 },
  sliderBtns: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  saveBtn: { backgroundColor: '#0D7377', padding: 14, borderRadius: 14, alignItems: 'center', marginTop: 6 },
  verifyBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 22 },
  verifyCard: { borderRadius: 18, padding: 18 },
  otp: { marginTop: 12, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 18, fontWeight: '900', letterSpacing: 6, textAlign: 'center' },
  verifyBtn: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center' },
});
