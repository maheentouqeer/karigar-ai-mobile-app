import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { getProviderSlots } from '../services/api';
import { scheduleLocalNotification } from '../services/pushNotifications';

type PricingLine = {
  label: string;
  amount: number;
  color: string;
  icon: string;
  note: string;
  isDiscount?: boolean;
};

export default function PricingScreen() {
  const router = useRouter();
  const { selectedProvider, currentResponse, theme, setPreferredSlot, setCurrentBooking, preferredSlot, notificationsEnabled } = useStore();
  const [revealed, setRevealed] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(preferredSlot || 'ASAP');
  const [timeSlots, setTimeSlots] = useState<string[]>(['ASAP', 'Today 4:00 PM', 'Today 6:00 PM', 'Tomorrow Morning']);
  const fadeAnims = useRef(Array.from({ length: 6 }, () => new Animated.Value(0))).current;

  useEffect(() => {
    const pid = selectedProvider?.id;
    if (!pid) return;
    const today = new Date().toISOString().slice(0, 10);
    getProviderSlots(pid, today).then((data) => {
      const slots = (data.slots || [])
        .filter((s: { available?: boolean }) => s.available !== false)
        .map((s: { time: string }) => s.time);
      if (slots.length) setTimeSlots(slots);
    });
  }, [selectedProvider?.id]);

  const isDark = theme === 'dark';
  const bg = isDark ? '#0A0A0F' : '#F8F9FA';
  const textMain = isDark ? '#fff' : '#111';
  const textSub = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : '#fff';

  const urgency = currentResponse?.urgency ?? 3;
  const budget = currentResponse?.budget ?? 500;
  const baseRate = selectedProvider?.base_rate_pkr ?? 700;
  const providerName = selectedProvider?.name ?? 'Provider';
  const serviceType = currentResponse?.service_type?.replace('_', ' ') ?? 'Service';
  const location = currentResponse?.location ?? 'Location';

  // Transparent pricing calculation — each factor explained
  const visitFee = 150;
  const distanceSurcharge = 80;
  const urgencyPremium = urgency >= 4 ? Math.round(baseRate * 0.15) : 0;
  const demandSurge = urgency === 5 ? 50 : 0;
  const loyaltyDiscount = -30;
  const total = baseRate + visitFee + distanceSurcharge + urgencyPremium + demandSurge;
  const netTotal = total + loyaltyDiscount;
  const providerEarning = Math.round(netTotal * 0.82);

  const lines: PricingLine[] = [
    {
      label: 'Base Service Rate',
      amount: baseRate,
      color: '#0D7377',
      icon: 'construct-outline',
      note: `${providerName}'s standard rate for ${serviceType}`,
    },
    {
      label: 'Visit / Call-out Fee',
      amount: visitFee,
      color: '#9B59B6',
      icon: 'car-outline',
      note: 'Fixed fee to cover provider travel',
    },
    {
      label: 'Distance Surcharge',
      amount: distanceSurcharge,
      color: '#F39C12',
      icon: 'navigate-outline',
      note: 'Est. 3.2 km from provider base to ' + location,
    },
    {
      label: 'Urgency & Surge',
      amount: urgencyPremium + demandSurge,
      color: '#E74C3C',
      icon: 'time-outline',
      note: (urgencyPremium + demandSurge) > 0
        ? `High urgency (${urgency}/5) and peak hour adjustment applied`
        : 'Scheduled in advance — standard tier pricing',
    },
  ];

  // Animate lines appearing one by one with stagger
  useEffect(() => {
    lines.forEach((_, i) => {
      setTimeout(() => {
        setRevealed(i + 1);
        Animated.timing(fadeAnims[i], {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }).start();
      }, i * 280);
    });
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={textMain} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textMain }]}>Price Breakdown</Text>
        <View style={styles.aiBadge}>
          <Ionicons name="hardware-chip-outline" size={14} color="#0D7377" />
          <Text style={styles.aiBadgeTxt}>AI Priced</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        {/* Provider summary banner */}
        <View style={[styles.providerBanner, { backgroundColor: cardBg }]}>
          <View style={styles.providerAvatar}>
            <Text style={styles.avatarTxt}>{providerName.charAt(0)}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ color: textMain, fontWeight: '700', fontSize: 15 }}>{providerName}</Text>
            <Text style={{ color: textSub, fontSize: 12 }}>{serviceType} • {location}</Text>
          </View>
          <View>
            <Text style={{ color: '#0D7377', fontWeight: '900', fontSize: 22 }}>Rs {total}</Text>
            <Text style={{ color: textSub, fontSize: 11, textAlign: 'right' }}>Final Price</Text>
          </View>
        </View>

        {/* Animated Line-by-Line Breakdown */}
        <Text style={[styles.sectionLabel, { color: textSub }]}>TRANSPARENT BREAKDOWN</Text>
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          {lines.map((line, i) =>
            i < revealed ? (
              <Animated.View
                key={i}
                style={[
                  styles.lineRow,
                  { opacity: fadeAnims[i] },
                  i < lines.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                  },
                ]}
              >
                <View style={[styles.lineIcon, { backgroundColor: line.color + '22' }]}>
                  <Ionicons name={line.icon as any} size={16} color={line.color} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: textMain, fontWeight: '600', fontSize: 14 }}>{line.label}</Text>
                  <Text style={{ color: textSub, fontSize: 11, marginTop: 2 }}>{line.note}</Text>
                </View>
                <Text
                  style={[
                    styles.lineAmt,
                    { color: line.isDiscount ? '#2ECC71' : line.amount === 0 ? textSub : textMain },
                  ]}
                >
                  {line.isDiscount ? '−' : line.amount === 0 ? '' : '+'}
                  Rs {Math.abs(line.amount)}
                </Text>
              </Animated.View>
            ) : null
          )}
        </View>


        {/* Total Card */}
        {revealed >= lines.length && (
          <View style={[styles.totalCard, { backgroundColor: '#0D7377' }]}>
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>Final Price</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, textDecorationLine: 'line-through' }}>Rs {total}</Text>
                <Text style={{ color: '#fff', fontSize: 34, fontWeight: '900' }}>Rs {netTotal}</Text>
              </View>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '700' }}>
                🎉 Loyalty Savings applied: Rs {Math.abs(loyaltyDiscount)}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
               <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', padding: 6, borderRadius: 8 }}>
                 <Ionicons name="shield-checkmark" size={16} color="#fff" />
               </View>
               <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 4 }}>Secure Escrow</Text>
            </View>
          </View>
        )}
        
        {revealed >= lines.length && (
          <>
            {/* Budget-sensitive alternative */}
            <View
              style={[
                styles.altBox,
                {
                  backgroundColor: isDark ? 'rgba(52,152,219,0.1)' : 'rgba(52,152,219,0.05)',
                  borderColor: 'rgba(52,152,219,0.3)',
                },
              ]}
            >
              <Ionicons name="bulb-outline" size={16} color="#3498DB" />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={{ color: '#3498DB', fontWeight: '700', fontSize: 13 }}>
                  Budget-Sensitive Alternative
                </Text>
                <Text style={{ color: textSub, fontSize: 12, marginTop: 3 }}>
                  Book for Tomorrow (Standard) to save Rs {urgencyPremium + demandSurge} —
                  total Rs {total - urgencyPremium - demandSurge}
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {revealed >= lines.length && (
        <>
          <Text style={[styles.sectionLabel, { color: textSub, marginTop: 8 }]}>PREFERRED TIME</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {timeSlots.map((slot) => (
              <TouchableOpacity
                key={slot}
                style={[
                  styles.slotChip,
                  selectedSlot === slot && { backgroundColor: '#0D7377', borderColor: '#0D7377' },
                ]}
                onPress={() => setSelectedSlot(slot)}
              >
                <Text style={{ color: selectedSlot === slot ? '#fff' : textSub, fontSize: 13, fontWeight: '600' }}>
                  {slot}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Footer CTA */}
      {revealed >= lines.length && (
        <View
          style={[
            styles.footer,
            {
              backgroundColor: isDark ? '#12121A' : '#fff',
              borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
            },
          ]}
        >
          <TouchableOpacity style={styles.negotiateBtn} onPress={() => router.push('/negotiation')}>
            <Ionicons name="chatbubbles-outline" size={18} color="#0D7377" />
            <Text style={{ color: '#0D7377', fontWeight: 'bold' }}>Negotiate</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={async () => {
              setPreferredSlot(selectedSlot);
              setCurrentBooking({
                id: `KAI-${Date.now()}`,
                provider_name: providerName,
                service_type: currentResponse?.service_type || serviceType,
                agreed_price: netTotal,
                status: 'confirmed',
                slot_time: selectedSlot,
              });
              await scheduleLocalNotification(
                'Provider accepted',
                `${providerName} accepted your booking for Rs ${netTotal} (${selectedSlot}).`,
                { enabled: notificationsEnabled }
              );
              router.push('/confirm');
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>
              Accept & Book — Rs {total}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: 'bold' },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(13,115,119,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  aiBadgeTxt: { color: '#0D7377', fontSize: 11, fontWeight: '700' },
  providerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 20,
  },
  providerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0D737730',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarTxt: { color: '#0D7377', fontWeight: '800', fontSize: 18 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 8 },
  card: { borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  lineRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  lineIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lineAmt: { fontSize: 14, fontWeight: '700', minWidth: 68, textAlign: 'right' },
  totalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 4,
  },
  fairRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  fairLabel: { fontSize: 13, width: 52 },
  barBg: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(150,150,150,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 4 },
  fairPct: { fontSize: 13, width: 36, textAlign: 'right' },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  altBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingBottom: 34,
    borderTopWidth: 1,
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  negotiateBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#0D7377',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtn: {
    flex: 2,
    backgroundColor: '#0D7377',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  slotChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(150,150,150,0.35)',
  },
});
