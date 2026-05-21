import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import WhatsAppNotification from '../components/WhatsAppNotification';
import { sendWhatsApp, sendSMS } from '../services/messaging';

import { scheduleLocalNotification } from '../services/pushNotifications';

export default function ConfirmScreen() {
  const router = useRouter();
  const {
    currentBooking, selectedProvider, theme,
    addBooking, notificationsEnabled, preferredSlot, recordServiceHistory,
    addIncomingRequest, userName,
  } = useStore();
  const [showWaToast, setShowWaToast] = useState(false);

  const isDark = theme === 'dark';
  const bg = isDark ? '#0A0A0F' : '#F8F9FA';
  const textMain = isDark ? '#fff' : '#111';
  const textSub = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF';

  if (!currentBooking && !selectedProvider) {
    return (
      <View style={[styles.container, { backgroundColor: bg, justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Ionicons name="calendar-outline" size={64} color={textSub} />
        <Text style={{ color: textMain, fontSize: 18, fontWeight: 'bold', marginTop: 16 }}>No booking to confirm</Text>
        <TouchableOpacity
          style={{ marginTop: 20, backgroundColor: '#0D7377', padding: 14, borderRadius: 12 }}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Go Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const booking = currentBooking || {
    id: `KAI-${Date.now()}`,
    provider_name: selectedProvider?.name || 'Provider',
    service_type: selectedProvider?.service_types?.[0] || 'Service',
    agreed_price: selectedProvider?.base_rate_pkr ?? 0,
    status: 'confirmed',
    slot_time: preferredSlot || 'ASAP',
  };

  useEffect(() => {
    // Persist booking to history
    if (currentBooking?.id) {
      addBooking({ ...currentBooking, slot_time: currentBooking.slot_time || preferredSlot || 'ASAP' });
      if (currentBooking.service_type) recordServiceHistory(currentBooking.service_type);
      
      // Push incoming request to provider side
      addIncomingRequest({
        id: currentBooking.id,
        service_type: currentBooking.service_type || 'Service',
        location: currentBooking.location || 'Customer Location',
        budget: currentBooking.agreed_price || 0,
        urgency: currentBooking.urgency ?? 3,
        minutes_ago: 0,
        status: 'pending',
        customerName: userName || 'Customer',
        customerId: currentBooking.id,
      });
    }
    // WhatsApp-style in-app toast
    if (notificationsEnabled) setShowWaToast(true);
    // Push notification — safe even without expo-notifications installed
    scheduleLocalNotification(
      'Booking Confirmed! ✅',
      `${booking.provider_name} has accepted your request and is on the way.`,
      { enabled: notificationsEnabled }
    );
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <WhatsAppNotification
        visible={showWaToast}
        message={`Booking confirmed! ${booking.provider_name} — ${booking.slot_time}`}
        onDismiss={() => setShowWaToast(false)}
      />

      <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
        <TouchableOpacity onPress={() => router.push('/(tabs)')} style={styles.backBtn}>
          <Ionicons name="home" size={22} color={textMain} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textMain }]}>Booking Confirmed</Text>
        <TouchableOpacity onPress={() => router.push('/trace')} style={styles.backBtn}>
          <Ionicons name="analytics-outline" size={22} color="#0D7377" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={80} color="#2ECC71" />
        </View>
        <Text style={[styles.successTxt, { color: textMain }]}>Great! Provider is assigned.</Text>

        {/* Booking Details */}
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <Text style={[styles.cardHeader, { color: textMain }]}>Booking Details</Text>
          <View style={styles.row}>
            <Text style={{ color: textSub }}>Booking ID</Text>
            <Text style={{ color: textMain, fontFamily: 'monospace' }}>{booking.id}</Text>
          </View>
          <View style={styles.row}>
            <Text style={{ color: textSub }}>Provider</Text>
            <Text style={{ color: textMain, fontWeight: 'bold' }}>{booking.provider_name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={{ color: textSub }}>Service</Text>
            <Text style={{ color: textMain }}>{booking.service_type}</Text>
          </View>
          <View style={styles.row}>
            <Text style={{ color: textSub }}>Time Slot</Text>
            <Text style={{ color: textMain }}>{booking.slot_time}</Text>
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={{ color: textSub }}>Agreed Price</Text>
            <Text style={{ color: '#0D7377', fontWeight: 'bold', fontSize: 18 }}>Rs {booking.agreed_price}</Text>
          </View>
        </View>

        {/* Notification status */}
        {notificationsEnabled && (
          <View style={[styles.notifBadge, { backgroundColor: 'rgba(46,204,113,0.12)', borderColor: 'rgba(46,204,113,0.3)' }]}>
            <Ionicons name="notifications-outline" size={14} color="#2ECC71" />
            <Text style={{ color: '#2ECC71', fontSize: 12, marginLeft: 6 }}>
              Push notification sent · Reminder 1 hr before
            </Text>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#3498DB' }]}
            onPress={() => router.push('/(tabs)/track')}
          >
            <Ionicons name="location" size={20} color="#fff" />
            <Text style={styles.actionBtnTxt}>Track Provider</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#F39C12' }]}
            onPress={() => router.push('/provider-customer-chat')}
          >
            <Ionicons name="chatbubbles" size={20} color="#fff" />
            <Text style={styles.actionBtnTxt}>Message</Text>
          </TouchableOpacity>
        </View>

        {/* SMS/WA Alternatives */}
        <View style={{ flexDirection: 'row', gap: 12, width: '100%', marginTop: 4 }}>
          <TouchableOpacity 
            style={[styles.miniBtn, { backgroundColor: '#25D366' }]} 
            onPress={() => sendWhatsApp('+923001234567', `Hi ${booking.provider_name}, this is from Karigar AI regarding my ${booking.service_type} booking.`)}
          >
            <Ionicons name="logo-whatsapp" size={16} color="#fff" />
            <Text style={styles.miniBtnTxt}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.miniBtn, { backgroundColor: '#7F8C8D' }]} 
            onPress={() => sendSMS('+923001234567', `Hi ${booking.provider_name}, my booking ${booking.id} is confirmed.`)}
          >
            <Ionicons name="chatbox-ellipses" size={16} color="#fff" />
            <Text style={styles.miniBtnTxt}>SMS</Text>
          </TouchableOpacity>
        </View>

        {/* Rate Service */}
        <TouchableOpacity
          style={[styles.rateBtn, { borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)' }]}
          onPress={() => router.push('/feedback')}
        >
          <Ionicons name="star-outline" size={18} color="#F39C12" />
          <Text style={{ color: textMain, fontWeight: '600', marginLeft: 8 }}>Rate this Service</Text>
          <Ionicons name="chevron-forward" size={16} color={textSub} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 50, paddingBottom: 15, paddingHorizontal: 16, borderBottomWidth: 1,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: 'bold' },
  content: { padding: 16, flex: 1, alignItems: 'center' },
  successIcon: { marginVertical: 24 },
  successTxt: { fontSize: 20, fontWeight: 'bold', marginBottom: 24 },
  card: { width: '100%', padding: 20, borderRadius: 16, marginBottom: 16 },
  cardHeader: { fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: 'rgba(150,150,150,0.1)',
  },
  notifBadge: {
    flexDirection: 'row', alignItems: 'center',
    width: '100%', padding: 10, borderRadius: 10, borderWidth: 1, marginBottom: 16,
  },
  actionGrid: { flexDirection: 'row', gap: 12, width: '100%', marginBottom: 12 },
  actionBtn: {
    flex: 1, padding: 16, borderRadius: 12,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
  },
  actionBtnTxt: { color: '#fff', fontWeight: 'bold' },
  rateBtn: {
    flexDirection: 'row', alignItems: 'center',
    width: '100%', padding: 16, borderRadius: 12, borderWidth: 1, marginTop: 12,
  },
  miniBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  miniBtnTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
