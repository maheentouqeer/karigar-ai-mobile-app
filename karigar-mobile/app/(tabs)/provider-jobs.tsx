import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../../store';

type JobTab = 'Pending' | 'Active' | 'Completed';

function fmtMoney(n: number) {
  return `Rs ${Math.round(n)}`;
}

export default function ProviderJobsScreen() {
  const router = useRouter();
  const {
    theme,
    providerActiveJob,
    setProviderActiveJob,
    addBooking,
    bookingHistory,
    providerDashboard,
    recomputeProviderDashboard,
    calculateProviderScore,
    providerIncomingRequests,
    acceptIncomingRequest,
    declineIncomingRequest,
  } = useStore();

  const isDark = theme === 'dark';
  const bg = isDark ? '#0A0A0F' : '#F8F9FA';
  const textMain = isDark ? '#fff' : '#111';
  const textSub = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : '#fff';

  const [tab, setTab] = React.useState<JobTab>('Pending');

  const pending = providerIncomingRequests;
  const completed = bookingHistory.filter((b) => b.status === 'completed');

  const onCompleteActive = () => {
    if (!providerActiveJob) return;
    addBooking({
      id: providerActiveJob.id,
      provider_name: 'You',
      service_type: providerActiveJob.serviceType,
      slot_time: 'ASAP',
      location: providerActiveJob.locationLabel,
      agreed_price: providerActiveJob.budget,
      status: 'completed',
      createdAt: new Date().toISOString(),
    });
    setProviderActiveJob(null);
    recomputeProviderDashboard();
    calculateProviderScore();
    setTab('Completed');
  };

  const onCancelActive = () => {
    if (!providerActiveJob) return;
    addBooking({
      id: `${providerActiveJob.id}-CANCEL`,
      provider_name: 'You',
      service_type: providerActiveJob.serviceType,
      slot_time: 'ASAP',
      location: providerActiveJob.locationLabel,
      agreed_price: 0,
      status: 'cancelled',
      createdAt: new Date().toISOString(),
    });
    setProviderActiveJob(null);
    recomputeProviderDashboard();
    calculateProviderScore();
    setTab('Completed');
  };

  const mockPayout = () => {
    // For demo: derive payout from store month earnings
    recomputeProviderDashboard();
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}>
        <Text style={{ color: textMain, fontSize: 22, fontWeight: '900' }}>Jobs</Text>
        <TouchableOpacity onPress={() => { mockPayout(); }} style={styles.payoutBtn}>
          <Ionicons name="cash-outline" size={18} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '900', marginLeft: 6 }}>Payout</Text>
        </TouchableOpacity>
      </View>

      {/* Sub-tabs */}
      <View style={styles.tabsRow}>
        {(['Pending', 'Active', 'Completed'] as JobTab[]).map((t) => {
          const active = t === tab;
          return (
            <TouchableOpacity
              key={t}
              style={[styles.tabPill, active && { backgroundColor: '#0D7377', borderColor: '#0D7377' }]}
              onPress={() => setTab(t)}
            >
              <Text style={{ color: active ? '#fff' : textSub, fontWeight: '900' }}>{t}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Dashboard snapshot */}
        <View style={[styles.snapshot, { backgroundColor: cardBg }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: textSub, fontWeight: '800' }}>This month</Text>
            <Text style={{ color: textMain, fontWeight: '900', fontSize: 18, marginTop: 2 }}>
              {fmtMoney(providerDashboard.monthEarningsPkr)}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: textSub, fontWeight: '800' }}>Last payout</Text>
            <Text style={{ color: '#2ECC71', fontWeight: '900', fontSize: 16, marginTop: 2 }}>
              {fmtMoney(providerDashboard.lastPayoutPkr)}
            </Text>
          </View>
        </View>

        {tab === 'Pending' && (
          <>
            {pending.map((p) => (
              <View key={p.id} style={[styles.card, { backgroundColor: cardBg }]}>
                <View style={styles.cardTop}>
                  <View style={[styles.tag, { backgroundColor: '#3498DB20' }]}>
                    <Text style={{ color: '#3498DB', fontWeight: '900' }}>{p.service_type.replace('_', ' ')}</Text>
                  </View>
                  <Text style={{ color: textSub }}>{p.minutes_ago}m ago</Text>
                </View>
                {p.customerName && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                    <Ionicons name="person-outline" size={14} color={textSub} />
                    <Text style={{ color: textMain, fontWeight: '700' }}>{p.customerName}</Text>
                  </View>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                  <Ionicons name="location-outline" size={14} color={textSub} />
                  <Text style={{ color: textMain }}>{p.location}</Text>
                </View>
                <Text style={{ color: textSub, marginTop: 6 }}>
                  {fmtMoney(p.budget)} • Urgency {p.urgency}/5
                </Text>
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}
                    onPress={() => declineIncomingRequest(p.id)}
                  >
                    <Text style={{ color: textMain, fontWeight: '900' }}>Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#0D7377' }]}
                    onPress={() => {
                      acceptIncomingRequest(p.id);
                      setTab('Active');
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '900' }}>Accept</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {pending.length === 0 && (
              <Text style={{ color: textSub, fontStyle: 'italic', textAlign: 'center', marginTop: 24 }}>
                No pending jobs. Customer bookings will appear here.
              </Text>
            )}
          </>
        )}

        {tab === 'Active' && (
          <>
            {!providerActiveJob ? (
              <View style={[styles.empty, { backgroundColor: cardBg }]}>
                <Ionicons name="briefcase-outline" size={46} color={textSub} />
                <Text style={{ color: textMain, fontWeight: '900', fontSize: 16, marginTop: 10 }}>
                  No active job
                </Text>
                <Text style={{ color: textSub, textAlign: 'center', marginTop: 6 }}>
                  Accept a request from Pending tab to start.
                </Text>
              </View>
            ) : (
              <View style={[styles.card, { backgroundColor: cardBg }]}>
                <View style={styles.cardTop}>
                  <View style={[styles.tag, { backgroundColor: '#2ECC7120' }]}>
                    <Text style={{ color: '#2ECC71', fontWeight: '900' }}>ACTIVE</Text>
                  </View>
                  <TouchableOpacity onPress={() => router.push('/provider-job-active')}>
                    <Text style={{ color: '#0D7377', fontWeight: '900' }}>Open</Text>
                  </TouchableOpacity>
                </View>
                <Text style={{ color: textMain, fontWeight: '900', fontSize: 16, marginTop: 8 }}>
                  {providerActiveJob.serviceType.replace('_', ' ')}
                </Text>
                <Text style={{ color: textSub, marginTop: 4 }}>
                  Customer: {providerActiveJob.customerName}
                </Text>
                <Text style={{ color: textSub, marginTop: 4 }}>
                  📍 {providerActiveJob.locationLabel}
                </Text>
                <Text style={{ color: textSub, marginTop: 6 }}>
                  {fmtMoney(providerActiveJob.budget)} • Urgency {providerActiveJob.urgency}/5
                </Text>
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#3498DB' }]}
                    onPress={() => router.push('/(tabs)/track')}
                  >
                    <Ionicons name="navigate" size={16} color="#fff" style={{ marginRight: 4 }} />
                    <Text style={{ color: '#fff', fontWeight: '900' }}>Start Job</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#F39C12' }]}
                    onPress={() => router.push('/provider-customer-chat')}
                  >
                    <Ionicons name="chatbubble" size={16} color="#fff" style={{ marginRight: 4 }} />
                    <Text style={{ color: '#fff', fontWeight: '900' }}>Chat</Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.actions, { marginTop: 6 }]}>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#E74C3C' }]} onPress={onCancelActive}>
                    <Text style={{ color: '#fff', fontWeight: '900' }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#2ECC71' }]} onPress={onCompleteActive}>
                    <Text style={{ color: '#fff', fontWeight: '900' }}>Complete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}

        {tab === 'Completed' && (
          <>
            {completed.length === 0 ? (
              <Text style={{ color: textSub, fontStyle: 'italic', textAlign: 'center', marginTop: 24 }}>
                No completed jobs yet.
              </Text>
            ) : (
              completed.slice(0, 20).map((b) => (
                <View key={b.id} style={[styles.card, { backgroundColor: cardBg }]}>
                  <View style={styles.cardTop}>
                    <View style={[styles.tag, { backgroundColor: '#3498DB20' }]}>
                      <Text style={{ color: '#3498DB', fontWeight: '900' }}>
                        {String(b.service_type || 'Service').replace('_', ' ')}
                      </Text>
                    </View>
                    <Text style={{ color: textSub, fontSize: 12 }}>
                      {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : ''}
                    </Text>
                  </View>
                  <Text style={{ color: textSub, marginTop: 6 }}>{b.location || ''}</Text>
                  <Text style={{ color: textMain, fontWeight: '900', marginTop: 6 }}>
                    {fmtMoney(Number(b.agreed_price || 0))}
                  </Text>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingBottom: 12, paddingHorizontal: 16, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  payoutBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0D7377', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14 },
  tabsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 14, gap: 10 },
  tabPill: { flex: 1, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(150,150,150,0.25)', paddingVertical: 10, alignItems: 'center' },
  snapshot: { borderRadius: 16, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(150,150,150,0.10)' },
  card: { borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(150,150,150,0.10)' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  empty: { borderRadius: 16, padding: 22, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(150,150,150,0.10)' },
});

