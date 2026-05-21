import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ScrollView, Modal, TextInput, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store';
import { simulateCancel, submitDispute } from '../../services/api';

// ─── types ───────────────────────────────────────────────────────────────────
interface Booking {
  id: string;
  provider_name?: string;
  service_type?: string;
  slot_time?: string;
  location?: string;
  agreed_price?: number;
  originalPrice?: number;
  refundAmount?: number;
  status?: string;
  createdAt?: string;
  urgency?: number;
}

const DISPUTE_CATEGORIES = [
  'Price Dispute', 'No Show', 'Poor Quality', 'Late Arrival', 'Overcharge',
];

export default function BookingsScreen() {
  const router = useRouter();
  const {
    role, currentBooking, bookingHistory, theme,
    notificationsEnabled, addBooking, resolveDispute, notify,
  } = useStore();
  const isProvider = role === 'provider';

  const isDark = theme === 'dark';
  const bg     = isDark ? '#0A0A0F' : '#F8F9FA';
  const textMain = isDark ? '#fff' : '#111';
  const textSub  = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';
  const cardBg   = isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF';

  // ── dispute modal state ─────────────────────────────────────────────────
  const [disputeVisible, setDisputeVisible]     = React.useState(false);
  const [disputeTarget, setDisputeTarget]       = React.useState<Booking | null>(null);
  const [disputeText, setDisputeText]           = React.useState('');
  const [disputeCategory, setDisputeCategory]   = React.useState('');
  const [disputePhase, setDisputePhase] =
    React.useState<'form' | 'searching' | 'result'>('form');
  const [refundResult, setRefundResult]         = React.useState(0);

  // ── rating modal state ──────────────────────────────────────────────────
  const [ratingVisible, setRatingVisible] = React.useState(false);
  const [ratingTarget, setRatingTarget]   = React.useState<Booking | null>(null);
  const [stars, setStars]                 = React.useState(5);
  const [feedbackText, setFeedbackText]   = React.useState('');

  // ── deduplicated list ───────────────────────────────────────────────────
  const allBookings: Booking[] = [
    ...(currentBooking ? [currentBooking] : []),
    ...bookingHistory,
  ].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

  // ── open dispute for a specific booking ─────────────────────────────────
  const openDispute = (booking: Booking) => {
    setDisputeTarget(booking);
    setDisputeText('');
    setDisputeCategory('');
    setDisputePhase('form');
    setRefundResult(0);
    setDisputeVisible(true);
  };

  // ── submit dispute ───────────────────────────────────────────────────────
  const submitDisputeFlow = async () => {
    if (!disputeTarget) return;
    if (!disputeText.trim()) {
      Alert.alert('Required', 'Please describe what went wrong.');
      return;
    }
    setDisputePhase('searching');

    try {
      await submitDispute(
        disputeTarget.id,
        disputeText,
        disputeCategory || undefined,
      );
    } catch {
      // backend offline — proceed with local resolution anyway
    }

    // Simulate AI review delay (1.8 s)
    await new Promise(r => setTimeout(r, 1800));

    // Apply 25 % refund in store
    const refund = resolveDispute(disputeTarget.id);
    setRefundResult(refund);
    setDisputePhase('result');

    if (notificationsEnabled) {
      notify(
        'Dispute Resolved ✅',
        `Rs ${refund} refunded. Booking updated.`,
        'success',
      );
    }
  };

  // ── close dispute modal ──────────────────────────────────────────────────
  const closeDispute = () => {
    setDisputeVisible(false);
    setDisputeTarget(null);
    setDisputePhase('form');
  };

  // ── submit rating ────────────────────────────────────────────────────────
  const submitRating = () => {
    if (!ratingTarget) return;
    useStore.getState().recordProviderReviewReceived(stars);
    addBooking({ ...ratingTarget, status: 'completed' });
    setRatingVisible(false);
    Alert.alert('Thank you!', 'Your feedback helps improve our community trust score.');
  };

  // ── cancel booking ───────────────────────────────────────────────────────
  const cancelBooking = async (bookingId: string) => {
    const result = await simulateCancel(bookingId).catch(() => ({ status: 'cancelled' }));
    addBooking({
      ...(currentBooking || { id: bookingId }),
      id: bookingId,
      status: result.status || 'cancelled',
    });
    Alert.alert('Cancelled', 'Booking cancelled. Provider notified.');
  };

  // ── status badge colour ──────────────────────────────────────────────────
  const badgeStyle = (status?: string) => {
    switch (status) {
      case 'refunded':  return { bg: '#F39C1225', text: '#F39C12' };
      case 'cancelled': return { bg: '#E74C3C25', text: '#E74C3C' };
      case 'completed': return { bg: '#2ECC7125', text: '#2ECC71' };
      case 'disputed':  return { bg: '#9B59B625', text: '#9B59B6' };
      default:          return { bg: '#3498DB25', text: '#3498DB' };
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
        <Text style={[styles.headerTitle, { color: textMain }]}>
          {isProvider ? 'My Assigned Jobs' : 'My Service History'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {allBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={60} color={textSub} />
            <Text style={{ color: textMain, fontSize: 18, marginTop: 16 }}>No bookings yet</Text>
            <TouchableOpacity style={styles.bookBtn} onPress={() => router.push('/(tabs)')}>
              <Text style={styles.bookBtnTxt}>Book a Service</Text>
            </TouchableOpacity>
          </View>
        ) : (
          allBookings.map(booking => {
            const bs = badgeStyle(booking.status);
            const isRefunded = booking.status === 'refunded';
            return (
              <View key={booking.id} style={[styles.card, { backgroundColor: cardBg }]}>
                {/* Status + ID row */}
                <View style={styles.statusRow}>
                  <View style={[styles.badge, { backgroundColor: bs.bg }]}>
                    <Text style={{ color: bs.text, fontSize: 12, fontWeight: 'bold' }}>
                      {(booking.status || 'BOOKED').toUpperCase()}
                    </Text>
                  </View>
                  <Text style={{ color: textSub, fontSize: 11 }}>
                    #{booking.id?.substring(0, 10)}
                  </Text>
                </View>

                <Text style={[styles.serviceType, { color: textMain }]}>
                  {booking.service_type}
                </Text>
                <Text style={[styles.providerName, { color: textSub }]}>
                  {isProvider
                    ? `Customer: Client`
                    : `Provider: ${booking.provider_name || 'Assigned'}`}
                </Text>

                {/* Price block */}
                <View style={styles.detailsRow}>
                  <View>
                    <Text style={{ color: textSub, fontSize: 12 }}>
                      {isRefunded ? 'Amount Paid' : 'Agreed Price'}
                    </Text>

                    {isRefunded ? (
                      /* ── Refund breakdown ─────────────────────────────── */
                      <View>
                        {/* original price struck through */}
                        <Text style={{ color: textSub, fontSize: 13, textDecorationLine: 'line-through' }}>
                          Rs {booking.originalPrice ?? ((booking.agreed_price ?? 0) + (booking.refundAmount ?? 0))}
                        </Text>
                        {/* refund chip */}
                        <View style={styles.refundChip}>
                          <Ionicons name="arrow-down-circle" size={13} color="#2ECC71" />
                          <Text style={{ color: '#2ECC71', fontSize: 12, fontWeight: '700', marginLeft: 4 }}>
                            Rs {booking.refundAmount ?? 0} refunded (25%)
                          </Text>
                        </View>
                        {/* final amount */}
                        <Text style={{ color: '#F39C12', fontWeight: 'bold', fontSize: 18 }}>
                          Rs {booking.agreed_price}
                        </Text>
                      </View>
                    ) : (
                      <Text style={{ color: textMain, fontWeight: 'bold', fontSize: 18 }}>
                        Rs {booking.agreed_price}
                      </Text>
                    )}
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: textSub, fontSize: 12 }}>Slot</Text>
                    <Text style={{ color: textMain }}>{booking.slot_time || '—'}</Text>
                  </View>
                </View>

                {/* Action buttons — customer only */}
                {!isProvider && (
                  <View style={styles.actionGrid}>
                    {booking.status === 'completed' && (
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#F39C12', borderColor: '#F39C12' }]}
                        onPress={() => {
                          setRatingTarget(booking);
                          setStars(5);
                          setFeedbackText('');
                          setRatingVisible(true);
                        }}
                      >
                        <Ionicons name="star" size={13} color="#fff" />
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13, marginLeft: 4 }}>Rate</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={[styles.actionBtn, { borderColor: '#3498DB' }]}
                      onPress={() => router.push('/confirm')}
                    >
                      <Text style={{ color: '#3498DB', fontWeight: 'bold', fontSize: 13 }}>Details</Text>
                    </TouchableOpacity>

                    {booking.status !== 'cancelled' &&
                      booking.status !== 'refunded' &&
                      booking.status !== 'completed' && (
                        <TouchableOpacity
                          style={[styles.actionBtn, { borderColor: '#F39C12' }]}
                          onPress={() => cancelBooking(booking.id)}
                        >
                          <Text style={{ color: '#F39C12', fontWeight: 'bold', fontSize: 13 }}>Cancel</Text>
                        </TouchableOpacity>
                      )}

                    {booking.status !== 'refunded' &&
                      booking.status !== 'completed' &&
                      booking.status !== 'cancelled' && (
                        <TouchableOpacity
                          style={[styles.actionBtn, { borderColor: '#E74C3C' }]}
                          onPress={() => openDispute(booking)}   // ← fixed: passes booking
                        >
                          <Text style={{ color: '#E74C3C', fontWeight: 'bold', fontSize: 13 }}>Dispute</Text>
                        </TouchableOpacity>
                      )}
                  </View>
                )}

                {/* Provider actions */}
                {isProvider && booking.status !== 'cancelled' && (
                  <View style={styles.actionGrid}>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: '#0D7377', borderColor: '#0D7377' }]}
                      onPress={() => {
                        // Set this as the active job for the provider to enable tracking
                        const activeJob = {
                          id: booking.id,
                          customerName: 'Client',
                          serviceType: booking.service_type || 'Service',
                          locationLabel: booking.location || 'Islamabad',
                          budget: booking.agreed_price || 0,
                          urgency: booking.urgency || 3,
                          status: 'active' as const,
                          createdAt: new Date().toISOString()
                        };
                        useStore.getState().setProviderActiveJob(activeJob);
                        router.push('/(tabs)/track');
                      }}
                    >
                      <Text style={{ color: '#fff', fontWeight: 'bold' }}>Start Job</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { borderColor: textSub }]}
                      onPress={() => router.push('/provider-customer-chat')}
                    >
                      <Text style={{ color: textMain, fontWeight: 'bold' }}>Message</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ── Dispute Modal ──────────────────────────────────────────────────── */}
      <Modal visible={disputeVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={[styles.modalBox, { backgroundColor: isDark ? '#1a1a24' : '#fff' }]}>

            {/* PHASE: form */}
            {disputePhase === 'form' && (
              <>
                <Text style={[styles.modalTitle, { color: textMain }]}>Open Dispute</Text>
                <Text style={{ color: textSub, marginBottom: 12 }}>
                  Select the issue type and describe what happened.
                </Text>

                {/* Category chips */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {DISPUTE_CATEGORIES.map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.catChip,
                        disputeCategory === cat && { backgroundColor: '#E74C3C', borderColor: '#E74C3C' },
                      ]}
                      onPress={() => setDisputeCategory(cat === disputeCategory ? '' : cat)}
                    >
                      <Text style={{
                        color: disputeCategory === cat ? '#fff' : textSub,
                        fontSize: 12, fontWeight: '600',
                      }}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput
                  style={[styles.inputBox, { color: textMain, borderColor: textSub }]}
                  multiline
                  numberOfLines={4}
                  placeholder="What went wrong? Describe in detail..."
                  placeholderTextColor={textSub}
                  value={disputeText}
                  onChangeText={setDisputeText}
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity onPress={closeDispute} style={styles.btnCancel}>
                    <Text style={{ color: textSub, fontWeight: 'bold' }}>Later</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnSubmit} onPress={submitDisputeFlow}>
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Submit to AI</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* PHASE: searching / AI reviewing */}
            {disputePhase === 'searching' && (
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <ActivityIndicator size="large" color="#0D7377" />
                <Text style={{ color: textMain, fontWeight: '700', fontSize: 16, marginTop: 20 }}>
                  AI Agent Reviewing...
                </Text>
                <Text style={{ color: textSub, marginTop: 8, textAlign: 'center' }}>
                  Analysing booking details, provider history and your complaint
                </Text>
                {/* Fake agent steps */}
                <View style={{ marginTop: 20, alignSelf: 'stretch', gap: 8 }}>
                  {[
                    { icon: 'search', label: 'Fetching booking record' },
                    { icon: 'analytics', label: 'Checking provider cancellation rate' },
                    { icon: 'shield-checkmark', label: 'Calculating fair refund (25 %)' },
                  ].map((s, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Ionicons name={s.icon as any} size={14} color="#0D7377" />
                      <Text style={{ color: textSub, fontSize: 13 }}>{s.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* PHASE: result */}
            {disputePhase === 'result' && (
              <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                <Ionicons name="checkmark-circle" size={64} color="#2ECC71" />
                <Text style={{ color: textMain, fontWeight: '900', fontSize: 20, marginTop: 14 }}>
                  Dispute Resolved
                </Text>
                <Text style={{ color: textSub, marginTop: 6, textAlign: 'center' }}>
                  Our AI agent reviewed your case and approved a refund.
                </Text>

                {/* Refund breakdown card */}
                <View style={[styles.refundCard, { backgroundColor: isDark ? 'rgba(46,204,113,0.1)' : 'rgba(46,204,113,0.05)', borderColor: 'rgba(46,204,113,0.3)' }]}>
                  <View style={styles.refundRow}>
                    <Text style={{ color: textSub }}>Original price</Text>
                    <Text style={{ color: textMain, textDecorationLine: 'line-through' }}>
                      Rs {(disputeTarget?.agreed_price ?? 0) + refundResult}
                    </Text>
                  </View>
                  <View style={styles.refundRow}>
                    <Text style={{ color: '#2ECC71', fontWeight: '700' }}>25 % Refund</Text>
                    <Text style={{ color: '#2ECC71', fontWeight: '700' }}>− Rs {refundResult}</Text>
                  </View>
                  <View style={[styles.refundRow, { borderTopWidth: 1, borderTopColor: 'rgba(46,204,113,0.3)', paddingTop: 10, marginTop: 4 }]}>
                    <Text style={{ color: textMain, fontWeight: '700' }}>Amount charged</Text>
                    <Text style={{ color: textMain, fontWeight: '900', fontSize: 18 }}>
                      Rs {disputeTarget?.agreed_price ?? 0}
                    </Text>
                  </View>
                </View>

                <Text style={{ color: textSub, fontSize: 12, textAlign: 'center', marginTop: 10 }}>
                  Refund will reflect in your wallet within 2–3 business days.
                </Text>

                <TouchableOpacity style={[styles.btnSubmit, { marginTop: 20, paddingHorizontal: 40 }]} onPress={closeDispute}>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Rating Modal ───────────────────────────────────────────────────── */}
      <Modal visible={ratingVisible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={[styles.modalBox, { backgroundColor: isDark ? '#1a1a24' : '#fff' }]}>
            <Text style={[styles.modalTitle, { color: textMain }]}>Rate Service</Text>

            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginVertical: 20 }}>
              {[1, 2, 3, 4, 5].map(s => (
                <TouchableOpacity key={s} onPress={() => setStars(s)}>
                  <Ionicons
                    name={s <= stars ? 'star' : 'star-outline'}
                    size={32}
                    color="#F39C12"
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[styles.inputBox, { color: textMain, borderColor: textSub, height: 80 }]}
              placeholder="How was your experience?"
              placeholderTextColor={textSub}
              value={feedbackText}
              onChangeText={setFeedbackText}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setRatingVisible(false)} style={styles.btnCancel}>
                <Text style={{ color: textSub, fontWeight: 'bold' }}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnSubmit, { backgroundColor: '#2ECC71' }]}
                onPress={submitRating}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Submit Feedback</Text>
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
  header: {
    paddingTop: 60, paddingBottom: 15,
    paddingHorizontal: 16, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  emptyState: { alignItems: 'center', marginTop: 100 },
  bookBtn: {
    backgroundColor: '#0D7377',
    paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 8, marginTop: 20,
  },
  bookBtnTxt: { color: '#fff', fontWeight: 'bold' },
  card: {
    padding: 16, borderRadius: 16, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(150,150,150,0.1)',
  },
  statusRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  serviceType: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  providerName: { fontSize: 14, marginBottom: 16 },
  detailsRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16,
  },
  refundChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(46,204,113,0.12)',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, marginVertical: 4, alignSelf: 'flex-start',
  },
  actionGrid: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtn: {
    flex: 1, borderWidth: 1, padding: 10,
    borderRadius: 8, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center',
    minWidth: 80,
  },
  // modal
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', padding: 20,
  },
  modalBox: {
    borderRadius: 20, padding: 24,
    elevation: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 8,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  inputBox: {
    borderWidth: 1, borderRadius: 10,
    padding: 12, minHeight: 100,
    textAlignVertical: 'top', marginBottom: 20,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  btnCancel: { padding: 12 },
  btnSubmit: {
    backgroundColor: '#E74C3C',
    paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 10,
  },
  catChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(150,150,150,0.3)',
  },
  // refund result card
  refundCard: {
    width: '100%', marginTop: 20,
    borderRadius: 14, padding: 16, borderWidth: 1,
  },
  refundRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginBottom: 8,
  },
});
