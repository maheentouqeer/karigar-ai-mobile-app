import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store';
import { scheduleLocalNotification } from '../../services/pushNotifications';
import { sendWhatsApp } from '../../services/messaging';

const GRID_ROWS = 5;
const GRID_COLS = 5;

function DashedRoute({ height }: { height: number }) {
  const segments = Math.max(3, Math.floor(height / 14));
  return (
    <View style={[styles.routeContainer, { height }]}>
      {Array.from({ length: segments }).map((_, i) => (
        <View key={i} style={styles.routeDash} />
      ))}
    </View>
  );
}

export default function TrackScreen() {
  const router = useRouter();
  const {
    currentBooking, theme, providerPhone, customerPhone,
    notificationsEnabled, role, providerActiveJob,
    selectedProvider, userName,
  } = useStore();

  const isProvider = role === 'provider';
  const [eta, setEta] = useState(12);
  const [status, setStatus] = useState('On the way');
  const [callSheetOpen, setCallSheetOpen] = useState(false);
  const enRouteNotified = React.useRef(false);

  const isDark = theme === 'dark';
  const bg = isDark ? '#0A0A0F' : '#F8F9FA';
  const textMain = isDark ? '#fff' : '#111';
  const textSub = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF';

  // Role-based labels
  const otherPersonName = isProvider
    ? (providerActiveJob?.customerName || 'Customer')
    : (currentBooking?.provider_name || selectedProvider?.name || 'Provider');

  const otherPersonRole = isProvider ? 'Customer' : 'Provider';
  const phoneNumber = isProvider ? (customerPhone || '+923001234567') : (providerPhone || '+923001234567');
  const serviceType = isProvider
    ? (providerActiveJob?.serviceType || 'Service')
    : (currentBooking?.service_type || 'Service');
  const locationLabel = isProvider
    ? (providerActiveJob?.locationLabel || 'Customer Location')
    : (currentBooking?.slot_time || 'ASAP');

  const distanceKm = Math.max(0.3, eta * 0.35).toFixed(1);
  const routeHeight = Math.min(220, Math.max(80, eta * 12 + 60));

  // Check if we have an active booking/job to track
  const hasActiveTracking = isProvider ? !!providerActiveJob : !!currentBooking;

  useEffect(() => {
    if (!hasActiveTracking) return;
    if (!enRouteNotified.current && notificationsEnabled) {
      enRouteNotified.current = true;
      scheduleLocalNotification(
        isProvider ? 'Navigating to customer' : 'Provider en route',
        isProvider
          ? `Navigate to ${otherPersonName}. ETA ~${eta} min.`
          : `${otherPersonName} is on the way. ETA ~${eta} min.`,
        { enabled: notificationsEnabled }
      );
    }
    if (eta === 0) {
      setStatus('Arrived');
      return;
    }
    const timer = setTimeout(() => setEta((e) => e - 1), 2000);
    return () => clearTimeout(timer);
  }, [eta, hasActiveTracking, notificationsEnabled]);

  if (!hasActiveTracking) {
    return (
      <View style={[styles.container, { backgroundColor: bg, justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Ionicons name="location-outline" size={64} color={textSub} />
        <Text style={{ color: textMain, fontSize: 20, fontWeight: 'bold', marginTop: 16 }}>
          {isProvider ? 'No active job to track' : 'No active booking'}
        </Text>
        <Text style={{ color: textSub, textAlign: 'center', marginTop: 8 }}>
          {isProvider
            ? 'Accept a customer request from Jobs → Pending to start tracking.'
            : 'Book a service to start tracking your provider.'}
        </Text>
        <TouchableOpacity style={styles.ctaBtn} onPress={() => router.push('/(tabs)')}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>{isProvider ? 'Go to Jobs' : 'Find a Service'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.mapMock, { backgroundColor: isDark ? '#1C1C24' : '#E8ECEF' }]}>
        {Array.from({ length: GRID_ROWS }).map((_, row) => (
          <View key={`r-${row}`} style={[styles.gridRowLine, { top: `${((row + 1) / (GRID_ROWS + 1)) * 100}%` }]} />
        ))}
        {Array.from({ length: GRID_COLS }).map((_, col) => (
          <View key={`c-${col}`} style={[styles.gridColLine, { left: `${((col + 1) / (GRID_COLS + 1)) * 100}%` }]} />
        ))}
        {Array.from({ length: GRID_ROWS }).map((_, row) =>
          Array.from({ length: GRID_COLS }).map((_, col) => (
            <Text
              key={`${row}-${col}`}
              style={[
                styles.gridLabel,
                {
                  top: `${(row / GRID_ROWS) * 100 + 2}%`,
                  left: `${(col / GRID_COLS) * 100 + 2}%`,
                  color: textSub,
                },
              ]}
            >
              {String.fromCharCode(65 + row)}
              {col + 1}
            </Text>
          ))
        )}

        {/* Your location marker */}
        <View style={[styles.homeMarker, { bottom: '18%', left: '22%' }]}>
          <Ionicons name={isProvider ? 'car' : 'home'} color="#fff" size={22} />
          <View style={styles.labelBubble}>
            <Text style={styles.labelTxt}>{isProvider ? 'You' : 'Your Home'}</Text>
          </View>
        </View>

        {/* Other person's marker */}
        <View style={[styles.providerMarkerWrap, { top: `${12 + (12 - eta) * 2}%`, right: '24%' }]}>
          <View style={[styles.providerMarker, { backgroundColor: isProvider ? '#E74C3C' : '#3498DB' }]}>
            <Ionicons name={isProvider ? 'person' : 'car'} color="#fff" size={22} />
          </View>
          <View style={[styles.labelBubble, { backgroundColor: isProvider ? '#E74C3C' : '#3498DB' }]}>
            <Text style={styles.labelTxt}>{otherPersonName}</Text>
          </View>
        </View>

        <View style={styles.routeWrap}>
          <DashedRoute height={routeHeight} />
        </View>

        <View style={styles.distancePill}>
          <Ionicons name="navigate" size={14} color="#0D7377" />
          <Text style={{ color: '#111', fontWeight: '800', marginLeft: 6 }}>{distanceKm} km away</Text>
        </View>
      </View>

      <View style={[styles.sheet, { backgroundColor: cardBg }]}>
        <Text style={[styles.etaText, { color: textMain }]}>
          {eta > 0
            ? (isProvider ? `${eta} mins to customer` : `${eta} mins away`)
            : (isProvider ? 'You have arrived' : `${otherPersonRole} has arrived`)}
        </Text>
        <Text style={[styles.statusText, { color: '#3498DB' }]}>{status}</Text>
        <Text style={{ color: textSub, textAlign: 'center', marginBottom: 12 }}>
          {serviceType.replace('_', ' ')} • {isProvider ? providerActiveJob?.locationLabel : locationLabel}
        </Text>

        <View style={[styles.providerCard, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
          <View style={[styles.avatar, { backgroundColor: isProvider ? '#E74C3C20' : '#0D737720' }]}>
            <Text style={{ color: isProvider ? '#E74C3C' : '#0D7377', fontWeight: 'bold' }}>
              {otherPersonName.charAt(0)}
            </Text>
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={[{ color: textMain, fontWeight: 'bold', fontSize: 16 }]}>{otherPersonName}</Text>
            <Text style={{ color: textSub, fontSize: 12 }}>
              {isProvider ? 'Customer' : 'Verified Professional'}
            </Text>
          </View>
        </View>

        <View style={styles.actionGrid}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#2ECC71' }]} onPress={() => setCallSheetOpen(true)}>
            <Ionicons name="call" size={20} color="#fff" />
            <Text style={styles.actionBtnTxt}>Call {otherPersonRole}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#3498DB' }]}
            onPress={() => router.push('/provider-customer-chat')}
          >
            <Ionicons name="chatbubble" size={20} color="#fff" />
            <Text style={styles.actionBtnTxt}>Message</Text>
          </TouchableOpacity>
        </View>

        {isProvider && eta === 0 && (
          <TouchableOpacity
            style={[styles.arrivedBtn]}
            onPress={() => router.push('/provider-job-active')}
          >
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '900', marginLeft: 8, fontSize: 16 }}>I've Arrived — Start Service</Text>
          </TouchableOpacity>
        )}

        {!isProvider && (
          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)' }]}
            onPress={() => router.push('/chat')}
          >
            <Ionicons name="sparkles" size={18} color="#0D7377" />
            <Text style={{ color: '#0D7377', fontWeight: '600', marginLeft: 8 }}>Ask Karigar AI Assistant</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={callSheetOpen} transparent animationType="slide" onRequestClose={() => setCallSheetOpen(false)}>
        <View style={styles.sheetBg}>
          <View style={[styles.callSheet, { backgroundColor: cardBg }]}>
            <TouchableOpacity
              style={[styles.callOpt, { borderColor: 'rgba(46,204,113,0.35)' }]}
              onPress={() => {
                setCallSheetOpen(false);
                Linking.openURL(`tel:${phoneNumber}`).catch(() => { });
              }}
            >
              <Ionicons name="call" size={18} color="#2ECC71" />
              <Text style={{ color: textMain, fontWeight: '700', marginLeft: 10 }}>Phone call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.callOpt, { borderColor: 'rgba(37,211,102,0.35)', marginTop: 10 }]}
              onPress={() => {
                setCallSheetOpen(false);
                sendWhatsApp(
                  phoneNumber.replace('+', ''),
                  isProvider
                    ? `Assalam o Alaikum! I'm your assigned provider for ${serviceType.replace('_', ' ')}. On my way!`
                    : `Assalam o Alaikum! I have a booking for ${serviceType.replace('_', ' ')}.`
                );
              }}
            >
              <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
              <Text style={{ color: textMain, fontWeight: '700', marginLeft: 10 }}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.callOpt, { borderColor: 'rgba(150,150,150,0.25)', marginTop: 10 }]}
              onPress={() => setCallSheetOpen(false)}
            >
              <Ionicons name="close" size={18} color={textSub} />
              <Text style={{ color: textSub, fontWeight: '700', marginLeft: 10 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  ctaBtn: { backgroundColor: '#0D7377', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, marginTop: 24 },
  mapMock: { flex: 1, position: 'relative', overflow: 'hidden' },
  gridRowLine: { position: 'absolute', width: '100%', height: 1, backgroundColor: 'rgba(150,150,150,0.18)' },
  gridColLine: { position: 'absolute', height: '100%', width: 1, backgroundColor: 'rgba(150,150,150,0.18)' },
  gridLabel: { position: 'absolute', fontSize: 9, fontWeight: '700', opacity: 0.55 },
  homeMarker: { position: 'absolute', alignItems: 'center' },
  providerMarkerWrap: { position: 'absolute', alignItems: 'center' },
  providerMarker: { backgroundColor: '#3498DB', padding: 8, borderRadius: 20 },
  labelBubble: { backgroundColor: '#E74C3C', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 4 },
  labelTxt: { color: '#fff', fontSize: 10, fontWeight: '800' },
  routeWrap: { position: 'absolute', left: '38%', bottom: '22%', alignItems: 'center' },
  routeContainer: { width: 6, alignItems: 'center', justifyContent: 'space-between' },
  routeDash: { width: 6, height: 8, backgroundColor: '#3498DB', borderRadius: 2, opacity: 0.85 },
  distancePill: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sheet: { padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, elevation: 10 },
  etaText: { fontSize: 24, fontWeight: '900', textAlign: 'center' },
  statusText: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginTop: 4, marginBottom: 20 },
  providerCard: { flexDirection: 'row', alignItems: 'center', paddingTop: 20, borderTopWidth: 1, marginBottom: 20 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  actionGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  actionBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  actionBtnTxt: { color: '#fff', fontWeight: 'bold' },
  arrivedBtn: { backgroundColor: '#2ECC71', padding: 16, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginBottom: 12 },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, borderWidth: 1 },
  sheetBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  callSheet: { padding: 18, borderTopLeftRadius: 22, borderTopRightRadius: 22 },
  callOpt: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1 },
});
