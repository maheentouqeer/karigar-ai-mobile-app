import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useStore, normalizeServiceProfiles } from '../../store';
import { Ionicons } from '@expo/vector-icons';
import { detectLanguage, sendRequest } from '../../services/api';

const ALL_SERVICES = [
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
  { id: 'cook', label: 'Cook/Chef', icon: 'restaurant-outline', color: '#D35400' },
  { id: 'security', label: 'Security', icon: 'shield-checkmark-outline', color: '#2C3E50' },
  { id: 'gardener', label: 'Gardener', icon: 'leaf-outline', color: '#27AE60' },
  { id: 'tailor', label: 'Tailor', icon: 'cut-outline', color: '#E67E22' },
];

function rankFromScore(score: number): { label: string; color: string; icon: string } {
  if (score >= 85) return { label: 'Diamond', color: '#85C1E9', icon: 'diamond' };
  if (score >= 70) return { label: 'Gold', color: '#F1C40F', icon: 'medal' };
  return { label: 'Silver', color: '#BDC3C7', icon: 'ribbon' };
}

function TrustRing({ score, size = 72 }: { score: number; size?: number }) {
  const pct = Math.min(100, Math.max(0, score)) / 100;
  const ring = size;
  const inner = ring - 14;
  return (
    <View style={{ width: ring, height: ring, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          position: 'absolute',
          width: ring,
          height: ring,
          borderRadius: ring / 2,
          borderWidth: 6,
          borderColor: 'rgba(150,150,150,0.2)',
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: ring,
          height: ring,
          borderRadius: ring / 2,
          borderWidth: 6,
          borderColor: '#0D7377',
          borderTopColor: pct > 0.25 ? '#0D7377' : 'transparent',
          borderRightColor: pct > 0.5 ? '#0D7377' : 'transparent',
          borderBottomColor: pct > 0.75 ? '#0D7377' : 'transparent',
          borderLeftColor: pct > 0 ? '#0D7377' : 'transparent',
          transform: [{ rotate: '-45deg' }],
        }}
      />
      <View
        style={{
          width: inner,
          height: inner,
          borderRadius: inner / 2,
          backgroundColor: 'rgba(13,115,119,0.12)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontWeight: '900', fontSize: 18, color: '#0D7377' }}>{score}</Text>
      </View>
    </View>
  );
}

export default function ProviderScreen() {
  const router = useRouter();
  const {
    theme,
    userName,
    sessionId,
    userId,
    providerMinBudget,
    setProviderMinBudget,
    bookingHistory,
    providerServices,
    setProviderServices,
    providerOnline,
    setProviderOnline,
    providerDashboard,
    recomputeProviderDashboard,
    calculateProviderScore,
    providerScore,
    providerVerified,
    providerAvgRatingLocal,
    providerReviewCountLocal,
    providerServiceProfiles,
    upsertProviderServiceProfile,
  } = useStore();

  const profiles = normalizeServiceProfiles(providerServiceProfiles);
  const activeProfiles = Object.values(profiles).filter((p) => p.isActive);

  const [showServiceEditor, setShowServiceEditor] = React.useState(false);
  const [chatInput, setChatInput] = React.useState('');
  const [botReply, setBotReply] = React.useState('Dashboard assistant — rates, earnings, trust score.');
  const [assistantLoading, setAssistantLoading] = React.useState(false);

  const isDark = theme === 'dark';
  const bg = isDark ? '#0A0A0F' : '#F8F9FA';
  const textMain = isDark ? '#fff' : '#111';
  const textSub = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF';

  useEffect(() => {
    recomputeProviderDashboard();
    calculateProviderScore();
  }, [bookingHistory.length]);

  const todayJobs = bookingHistory.filter((b) => {
    const t = Date.parse(b.createdAt || '');
    return Number.isFinite(t) && Date.now() - t < 86400000;
  }).length;
  const weekJobs = bookingHistory.filter((b) => {
    const t = Date.parse(b.createdAt || '');
    return Number.isFinite(t) && Date.now() - t < 7 * 86400000;
  }).length;
  const totalJobs = bookingHistory.length;
  const trustScore = providerScore;
  const rank = rankFromScore(trustScore);

  const profileChecks = [
    providerVerified,
    activeProfiles.length >= 1,
    activeProfiles.some((p) => p.notes.length > 0),
    activeProfiles.some((p) => p.yearsExperience >= 1),
    providerMinBudget > 0,
  ];
  const profilePct = Math.round((profileChecks.filter(Boolean).length / profileChecks.length) * 100);

  const earnings7d = useMemo(() => {
    const days: number[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const sum = bookingHistory
        .filter((b) => (b.status === 'completed' || b.status === 'confirmed') && b.createdAt?.slice(0, 10) === key)
        .reduce((acc, b) => acc + Number(b.agreed_price || 0), 0);
      days.push(sum);
    }
    return days;
  }, [bookingHistory]);
  const maxBar = Math.max(1, ...earnings7d);

  const cancelled = bookingHistory.filter((b) => b.status === 'cancelled').length;
  const cancelRate = cancelled / Math.max(1, bookingHistory.length);
  const avgOnTime =
    activeProfiles.length > 0
      ? activeProfiles.reduce((a, p) => a + p.onTimeRate, 0) / activeProfiles.length
      : 85;

  const scoreBreakdown = [
    {
      key: 'rating',
      label: 'Rating (×20)',
      value: Math.min(100, providerAvgRatingLocal * 20),
      tip: `Avg customer rating ${providerAvgRatingLocal.toFixed(1)} / 5`,
    },
    {
      key: 'ontime',
      label: 'On-time (×20)',
      value: Math.min(100, (avgOnTime / 100) * 20),
      tip: `On-time rate ${Math.round(avgOnTime)}% across active services`,
    },
    {
      key: 'verified',
      label: 'Verified bonus',
      value: providerVerified ? 10 : 0,
      tip: providerVerified ? 'CNIC/OTP verified' : 'Complete OTP verification',
    },
    {
      key: 'reviews',
      label: 'Reviews (+0.1 each)',
      value: Math.min(15, providerReviewCountLocal * 0.1),
      tip: `${providerReviewCountLocal} reviews recorded`,
    },
    {
      key: 'cancel',
      label: 'Cancellation (−5×rate)',
      value: Math.max(0, 25 - cancelRate * 5 * 5),
      tip: `Cancel rate ${Math.round(cancelRate * 100)}% (penalty when >15%)`,
    },
  ];

  const toggleService = (svcId: string) => {
    const current = providerServices || [];
    if (current.includes(svcId)) {
      setProviderServices(current.filter((s) => s !== svcId));
      const p = profiles[svcId];
      if (p) upsertProviderServiceProfile({ ...p, isActive: false });
    } else {
      setProviderServices([...current, svcId]);
      upsertProviderServiceProfile(
        profiles[svcId] ? { ...profiles[svcId], isActive: true } : { serviceType: svcId, isActive: true }
      );
    }
    calculateProviderScore();
  };

  const handleProviderBot = async () => {
    const msg = chatInput.trim();
    if (!msg || assistantLoading) return;
    setAssistantLoading(true);
    setChatInput('');
    const lang = detectLanguage(msg);
    const appendContext =
      lang === 'urdu'
        ? `Provider dashboard context: score ${providerScore}, rank ${rank.label}, today Rs ${providerDashboard.todayEarningsPkr}. Roman Urdu jawab.`
        : `Provider dashboard: score ${providerScore}, ${rank.label} rank, today Rs ${providerDashboard.todayEarningsPkr}.`;
    try {
      const res = await sendRequest(msg, sessionId, userId, undefined, { appendContext });
      setBotReply(
        lang === 'urdu'
          ? res.response_urdu || res.response_en || 'Theek.'
          : res.response_en || res.response_urdu || 'OK.'
      );
    } catch {
      setBotReply(`Today Rs ${Math.round(providerDashboard.todayEarningsPkr)}. Score ${providerScore}. Stay verified & on-time.`);
    } finally {
      setAssistantLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.greeting, { color: textSub }]}>Provider Dashboard</Text>
          <TouchableOpacity
            style={[styles.statusBadge, { backgroundColor: providerOnline ? '#2ECC7120' : '#E74C3C20' }]}
            onPress={() => setProviderOnline(!providerOnline)}
          >
            <View style={[styles.statusDot, { backgroundColor: providerOnline ? '#2ECC71' : '#E74C3C' }]} />
            <Text style={[styles.statusTxt, { color: providerOnline ? '#2ECC71' : '#E74C3C' }]}>
              {providerOnline ? 'Online' : 'Offline'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <Text style={[styles.title, { color: textMain }]}>{userName || 'Provider'}</Text>
          <View style={[styles.rankBadge, { backgroundColor: rank.color + '30', borderColor: rank.color }]}>
            <Ionicons name={rank.icon as keyof typeof Ionicons.glyphMap} size={14} color={rank.color} />
            <Text style={{ color: rank.color, fontWeight: '900', marginLeft: 4, fontSize: 12 }}>{rank.label}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.heroCard, { backgroundColor: cardBg }]}>
          <TrustRing score={trustScore} />
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={{ color: textSub, fontSize: 12 }}>Trust score</Text>
            <Text style={{ color: textMain, fontWeight: '900', fontSize: 22 }}>{trustScore}/100</Text>
            <Text style={{ color: textSub, fontSize: 11, marginTop: 4 }}>Profile {profilePct}% complete</Text>
            <View style={styles.completeTrack}>
              <View style={[styles.completeFill, { width: `${profilePct}%` }]} />
            </View>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: cardBg }]}>
            <Text style={{ color: textSub, fontSize: 11 }}>Today jobs</Text>
            <Text style={{ color: '#2ECC71', fontSize: 20, fontWeight: '900' }}>{todayJobs}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: cardBg }]}>
            <Text style={{ color: textSub, fontSize: 11 }}>Week jobs</Text>
            <Text style={{ color: '#3498DB', fontSize: 20, fontWeight: '900' }}>{weekJobs}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: cardBg }]}>
            <Text style={{ color: textSub, fontSize: 11 }}>Total</Text>
            <Text style={{ color: textMain, fontSize: 20, fontWeight: '900' }}>{totalJobs}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: cardBg }]}>
            <Text style={{ color: textSub, fontSize: 11 }}>Trust</Text>
            <Text style={{ color: '#0D7377', fontSize: 20, fontWeight: '900' }}>{trustScore}</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: cardBg }]}>
            <Ionicons name="cash-outline" size={18} color="#2ECC71" />
            <Text style={{ color: textSub, fontSize: 11, marginTop: 4 }}>Today Rs</Text>
            <Text style={{ color: '#2ECC71', fontSize: 18, fontWeight: '900' }}>
              {Math.round(providerDashboard.todayEarningsPkr)}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: cardBg }]}>
            <Ionicons name="calendar-outline" size={18} color="#3498DB" />
            <Text style={{ color: textSub, fontSize: 11, marginTop: 4 }}>Week Rs</Text>
            <Text style={{ color: '#3498DB', fontSize: 18, fontWeight: '900' }}>
              {Math.round(providerDashboard.weekEarningsPkr)}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: cardBg }]}>
            <Ionicons name="wallet-outline" size={18} color="#9B59B6" />
            <Text style={{ color: textSub, fontSize: 11, marginTop: 4 }}>Month Rs</Text>
            <Text style={{ color: '#9B59B6', fontSize: 18, fontWeight: '900' }}>
              {Math.round(providerDashboard.monthEarningsPkr)}
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: textMain }]}>7-day earnings</Text>
        <View style={[styles.barCard, { backgroundColor: cardBg }]}>
          <View style={styles.barRow}>
            {earnings7d.map((amt, i) => (
              <View key={i} style={styles.barCol}>
                <View style={[styles.bar, { height: Math.max(4, (amt / maxBar) * 80), backgroundColor: '#0D7377' }]} />
                <Text style={{ color: textSub, fontSize: 9, marginTop: 4 }}>
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'][new Date(Date.now() - (6 - i) * 86400000).getDay()]}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: textMain }]}>Score breakdown</Text>
        {scoreBreakdown.map((row) => (
          <TouchableOpacity
            key={row.key}
            style={[styles.breakRow, { backgroundColor: cardBg }]}
            onPress={() => Alert.alert(row.label, row.tip)}
          >
            <Text style={{ color: textMain, fontWeight: '700', flex: 1, fontSize: 13 }}>{row.label}</Text>
            <View style={styles.breakTrack}>
              <View style={[styles.breakFill, { width: `${Math.min(100, row.value)}%` }]} />
            </View>
            <Ionicons name="information-circle-outline" size={18} color="#0D7377" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        ))}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={[styles.sectionTitle, { color: textMain, marginBottom: 0 }]}>My Services</Text>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#0D737720', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
            onPress={() => router.push('/(tabs)/provider-home')}
          >
            <Ionicons name="create-outline" size={16} color="#0D7377" />
            <Text style={{ color: '#0D7377', fontSize: 13, fontWeight: '600' }}>Full editor</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {(providerServices || []).length === 0 ? (
            <TouchableOpacity
              onPress={() => setShowServiceEditor(true)}
              style={{ padding: 16, width: '100%', borderRadius: 12, borderWidth: 1, borderColor: '#0D737740', borderStyle: 'dashed', alignItems: 'center' }}
            >
              <Text style={{ color: '#0D7377', fontWeight: '600' }}>Register services on Provider Home</Text>
            </TouchableOpacity>
          ) : (
            (providerServices || []).map((svcId: string) => {
              const svc = ALL_SERVICES.find((s) => s.id === svcId);
              if (!svc) return null;
              return (
                <View key={svcId} style={[styles.serviceTag, { backgroundColor: svc.color + '20' }]}>
                  <Ionicons name={svc.icon as keyof typeof Ionicons.glyphMap} size={14} color={svc.color} />
                  <Text style={{ color: svc.color, fontSize: 12, fontWeight: '600', marginLeft: 4 }}>{svc.label}</Text>
                </View>
              );
            })
          )}
        </View>

        <Text style={[styles.sectionTitle, { color: textMain }]}>Minimum Budget (Rs)</Text>
        <View style={[styles.rowCard, { backgroundColor: cardBg }]}>
          <Ionicons name="wallet-outline" size={20} color="#F39C12" style={{ marginRight: 8 }} />
          <TextInput
            style={{ color: textMain, fontSize: 18, fontWeight: 'bold', flex: 1 }}
            keyboardType="numeric"
            value={String(providerMinBudget)}
            onChangeText={(t) => setProviderMinBudget(parseInt(t, 10) || 0)}
          />
          <TouchableOpacity onPress={() => Alert.alert('Saved', `Min budget Rs ${providerMinBudget}`)}>
            <Ionicons name="save" size={22} color="#0D7377" />
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: textMain }]}>Provider Assistant</Text>
        <View style={[styles.botCard, { backgroundColor: cardBg }]}>
          <Text style={{ color: textMain, flex: 1, lineHeight: 20, fontSize: 13 }}>{botReply}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <TextInput
              style={[styles.botInput, { color: textMain, borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)' }]}
              placeholder="Earnings, rank, tips..."
              placeholderTextColor={textSub}
              value={chatInput}
              onChangeText={setChatInput}
              onSubmitEditing={handleProviderBot}
            />
            <TouchableOpacity style={styles.botSend} onPress={handleProviderBot} disabled={assistantLoading}>
              {assistantLoading ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="send" size={18} color="#fff" />}
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: textMain }]}>Job History</Text>
        {bookingHistory.length === 0 ? (
          <Text style={{ color: textSub, fontStyle: 'italic', marginBottom: 16 }}>No completed jobs yet.</Text>
        ) : (
          bookingHistory.slice(0, 5).map((b) => (
            <View key={b.id} style={[styles.jobCard, { backgroundColor: cardBg, marginBottom: 8 }]}>
              <Text style={{ color: textMain, fontWeight: '600' }}>{b.service_type} — Rs {b.agreed_price}</Text>
              <Text style={{ color: textSub, fontSize: 12 }}>{b.provider_name} • {b.slot_time}</Text>
            </View>
          ))
        )}
        <TouchableOpacity style={styles.historyBtn} onPress={() => router.push('/(tabs)/bookings')}>
          <Text style={{ color: '#0D7377', fontWeight: 'bold' }}>All Bookings →</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.historyBtn} onPress={() => router.push('/(tabs)/provider-home')}>
          <Text style={{ color: '#0D7377', fontWeight: 'bold' }}>Provider Home (requests) →</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showServiceEditor} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: isDark ? '#1E1E24' : '#fff' }]}>
            <TouchableOpacity onPress={() => setShowServiceEditor(false)}>
              <Ionicons name="close-circle" size={28} color={textSub} />
            </TouchableOpacity>
            <ScrollView style={{ maxHeight: 400 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
                {ALL_SERVICES.map((svc) => {
                  const isSelected = (providerServices || []).includes(svc.id);
                  return (
                    <TouchableOpacity
                      key={svc.id}
                      style={[styles.svcPickerItem, { borderColor: isSelected ? svc.color : 'transparent' }]}
                      onPress={() => toggleService(svc.id)}
                    >
                      <Text style={{ color: isSelected ? svc.color : textMain }}>{svc.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, borderBottomWidth: 1 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusTxt: { fontSize: 12, fontWeight: 'bold' },
  greeting: { fontSize: 14, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: 'bold' },
  rankBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  heroCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 16 },
  completeTrack: { height: 6, backgroundColor: 'rgba(150,150,150,0.2)', borderRadius: 3, marginTop: 8, overflow: 'hidden' },
  completeFill: { height: '100%', backgroundColor: '#2ECC71', borderRadius: 3 },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statCard: { flex: 1, padding: 12, borderRadius: 14, alignItems: 'center' },
  barCard: { padding: 16, borderRadius: 16, marginBottom: 20 },
  barRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 100 },
  barCol: { flex: 1, alignItems: 'center' },
  bar: { width: '70%', borderRadius: 4, minHeight: 4 },
  breakRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 8 },
  breakTrack: { width: 72, height: 8, backgroundColor: 'rgba(150,150,150,0.2)', borderRadius: 4, overflow: 'hidden' },
  breakFill: { height: '100%', backgroundColor: '#0D7377', borderRadius: 4 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  serviceTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  rowCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 20 },
  jobCard: { padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(52,152,219,0.3)' },
  botCard: { padding: 14, borderRadius: 14, marginBottom: 16 },
  botInput: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  botSend: { backgroundColor: '#0D7377', width: 44, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  historyBtn: { alignItems: 'center', padding: 12 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  svcPickerItem: { padding: 12, borderRadius: 12, borderWidth: 2, width: '45%' },
});
