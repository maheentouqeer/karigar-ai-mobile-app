import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../store';
import { scheduleLocalNotification } from '../services/pushNotifications';

type Stage = 'accepted' | 'arrived' | 'started' | 'completed' | 'cancelled';

export default function ProviderJobActiveScreen() {
  const router = useRouter();
  const {
    theme,
    providerActiveJob,
    setProviderActiveJob,
    addBooking,
    recomputeProviderDashboard,
    calculateProviderScore,
    notificationsEnabled,
  } = useStore();

  const isDark = theme === 'dark';
  const bg = isDark ? '#0A0A0F' : '#F8F9FA';
  const textMain = isDark ? '#fff' : '#111';
  const textSub = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : '#fff';

  const [stage, setStage] = React.useState<Stage>('accepted');

  React.useEffect(() => {
    if (!providerActiveJob) return;
    // Keep stage in sync if job object already includes status
    if (providerActiveJob.status === 'active') setStage('accepted');
  }, [providerActiveJob]);

  if (!providerActiveJob) {
    return (
      <View style={[styles.container, { backgroundColor: bg, justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Ionicons name="briefcase-outline" size={64} color={textSub} />
        <Text style={{ color: textMain, fontWeight: '900', fontSize: 18, marginTop: 16 }}>No active job</Text>
        <TouchableOpacity style={styles.cta} onPress={() => router.replace('/(tabs)/provider-home')}>
          <Text style={{ color: '#fff', fontWeight: '900' }}>Go to Provider Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const finish = async (status: 'completed' | 'cancelled') => {
    addBooking({
      id: providerActiveJob.id,
      provider_name: 'You',
      service_type: providerActiveJob.serviceType,
      slot_time: 'ASAP',
      location: providerActiveJob.locationLabel,
      agreed_price: status === 'completed' ? providerActiveJob.budget : 0,
      status,
      createdAt: new Date().toISOString(),
    });
    if (status === 'completed') {
      await scheduleLocalNotification(
        'Service complete',
        `${providerActiveJob.serviceType.replace('_', ' ')} at ${providerActiveJob.locationLabel} marked complete.`,
        { enabled: notificationsEnabled }
      );
    } else {
      await scheduleLocalNotification(
        'Job cancelled',
        `You cancelled ${providerActiveJob.serviceType.replace('_', ' ')}.`,
        { enabled: notificationsEnabled }
      );
      await scheduleLocalNotification(
        'Customer cancelled',
        `Provider cancelled job ${providerActiveJob.id} (demo).`,
        { enabled: notificationsEnabled }
      );
    }
    setProviderActiveJob(null);
    recomputeProviderDashboard();
    calculateProviderScore();
    router.replace('/(tabs)/provider-jobs');
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={textMain} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ color: textMain, fontWeight: '900', fontSize: 16 }}>Active Job</Text>
          <Text style={{ color: textSub, fontSize: 11 }}>{providerActiveJob.serviceType.replace('_', ' ')}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/provider-customer-chat')} style={styles.iconBtn}>
          <Ionicons name="chatbubble-ellipses-outline" size={20} color="#0D7377" />
        </TouchableOpacity>
      </View>

      {/* Map mock */}
      <View style={[styles.map, { backgroundColor: isDark ? '#1C1C24' : '#E8ECEF' }]}>
        <View style={[styles.gridLine, { top: '20%' }]} />
        <View style={[styles.gridLine, { top: '50%' }]} />
        <View style={[styles.gridLine, { top: '80%' }]} />
        <View style={[styles.gridLineVertical, { left: '30%' }]} />
        <View style={[styles.gridLineVertical, { left: '70%' }]} />
        <View style={styles.providerMarker}>
          <Ionicons name="car" size={22} color="#fff" />
        </View>
        <View style={styles.customerMarker}>
          <Ionicons name="home" size={22} color="#fff" />
        </View>
        <View style={styles.routeLine} />
      </View>

      <View style={[styles.sheet, { backgroundColor: cardBg }]}>
        <Text style={{ color: textMain, fontWeight: '900', fontSize: 18 }}>
          {providerActiveJob.locationLabel}
        </Text>
        <Text style={{ color: textSub, marginTop: 4 }}>
          Rs {providerActiveJob.budget} • Urgency {providerActiveJob.urgency}/5{typeof providerActiveJob.distanceKm === 'number' ? ` • ${providerActiveJob.distanceKm.toFixed(1)} km` : ''}
        </Text>

        <View style={styles.stageRow}>
          {(['accepted', 'arrived', 'started', 'completed'] as Stage[]).map((s) => {
            const done =
              (stage === 'arrived' && s === 'accepted') ||
              (stage === 'started' && (s === 'accepted' || s === 'arrived')) ||
              (stage === 'completed' && s !== 'cancelled');
            const active = stage === s;
            const color = active ? '#0D7377' : done ? '#2ECC71' : 'rgba(150,150,150,0.35)';
            return (
              <View key={s} style={[styles.stagePill, { borderColor: color }]}>
                <Text style={{ color: active ? '#0D7377' : done ? '#2ECC71' : textSub, fontWeight: '900', fontSize: 10 }}>
                  {s.toUpperCase()}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {stage === 'accepted' && (
            <>
              <TouchableOpacity 
                style={[styles.btn, { backgroundColor: '#3498DB', flex: 1.5 }]} 
                onPress={() => {
                  Alert.alert('Navigation', `Opening Google Maps for ${providerActiveJob.locationLabel}...`);
                  setStage('arrived');
                }}
              >
                <Ionicons name="navigate" size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.btnTxt}>Navigate & Arrive</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, { backgroundColor: '#E74C3C' }]} onPress={() => {
                Alert.alert(
                  'Cancel Job?', 
                  'Cancellations decrease your trust score. Are you sure?', 
                  [
                    { text: 'Keep Job', style: 'cancel' },
                    { text: 'Cancel (-5 pts)', style: 'destructive', onPress: () => { setStage('cancelled'); finish('cancelled'); } }
                  ]
                );
              }}>
                <Text style={styles.btnTxt}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
          {stage === 'arrived' && (
            <>
              <TouchableOpacity style={[styles.btn, { backgroundColor: '#0D7377' }]} onPress={() => setStage('started')}>
                <Text style={styles.btnTxt}>Start</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, { backgroundColor: '#E74C3C' }]} onPress={() => {
                Alert.alert(
                  'Cancel After Arrival?', 
                  'This counts as a no-show delay. High penalty will apply.', 
                  [
                    { text: 'Go Back', style: 'cancel' },
                    { text: 'Cancel (-10 pts)', style: 'destructive', onPress: () => { setStage('cancelled'); finish('cancelled'); } }
                  ]
                );
              }}>
                <Text style={styles.btnTxt}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
          {stage === 'started' && (
            <>
              <TouchableOpacity style={[styles.btn, { backgroundColor: '#2ECC71' }]} onPress={() => { setStage('completed'); finish('completed'); }}>
                <Text style={styles.btnTxt}>Complete</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, { backgroundColor: '#E74C3C' }]} onPress={() => {
                 Alert.alert(
                  'Stop Job?', 
                  'Stopping an active job will trigger a dispute and a major trust score drop.', 
                  [
                    { text: 'Continue Work', style: 'cancel' },
                    { text: 'Stop Job (-20 pts)', style: 'destructive', onPress: () => { setStage('cancelled'); finish('cancelled'); } }
                  ]
                );
              }}>
                <Text style={styles.btnTxt}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: 12, paddingHorizontal: 14, borderBottomWidth: 1 },
  iconBtn: { padding: 6, width: 36, alignItems: 'center' },
  map: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  providerMarker: { position: 'absolute', top: '28%', left: '30%', backgroundColor: '#3498DB', padding: 8, borderRadius: 20 },
  customerMarker: { position: 'absolute', bottom: '22%', right: '28%', backgroundColor: '#E74C3C', padding: 8, borderRadius: 20 },
  routeLine: { position: 'absolute', width: '70%', height: 6, backgroundColor: '#0D737780', borderRadius: 3, transform: [{ rotate: '-18deg' }] },
  gridLine: { position: 'absolute', width: '100%', height: 4, backgroundColor: 'rgba(150,150,150,0.10)' },
  gridLineVertical: { position: 'absolute', height: '100%', width: 4, backgroundColor: 'rgba(150,150,150,0.10)' },
  sheet: { padding: 18, paddingBottom: 28, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderTopColor: 'rgba(150,150,150,0.10)' },
  stageRow: { flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap' },
  stagePill: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  btnTxt: { color: '#fff', fontWeight: '900' },
  cta: { backgroundColor: '#0D7377', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14, marginTop: 18 },
});

