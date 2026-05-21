import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { getProviderSlots } from '../services/api';
import { scheduleLocalNotification } from '../services/pushNotifications';

export default function NegotiationScreen() {
  const router = useRouter();
  const { selectedProvider, currentResponse, setCurrentBooking, setPreferredSlot, theme, preferredSlot, notificationsEnabled } = useStore();
  const negotiation = currentResponse?.negotiation_result;

  const isDark = theme === 'dark';
  const bg = isDark ? '#0A0A0F' : '#F8F9FA';
  const textMain = isDark ? '#fff' : '#111';
  const textSub = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF';

  const customerBudget = currentResponse?.budget ?? 500;
  const providerRate = selectedProvider?.base_rate_pkr ?? 800;
  const providerName = selectedProvider?.name ?? 'Provider';

  const gap = providerRate - customerBudget;
  const urgency = currentResponse?.urgency ?? 3;
  // Enhanced Urgency: 0.2 (low) to 1.0 (max)
  const urgencyWeight = (urgency - 1) / 4; // 0 to 1
  const urgencyFactor = 0.2 + (urgencyWeight * 0.8);
  
  const trustScore = selectedProvider?.trust_score ?? 50;
  // Modifier shifts power to provider if high trust, and to user if low
  const trustModifier = (trustScore - 50) / 100; // -0.5 to 0.5
  
  // Combine factors, clamp between 10% and 95% of the gap
  const baseFactor = Math.max(0.1, Math.min(0.95, urgencyFactor + (trustModifier * 0.2)));

  const [selectedDay, setSelectedDay] = useState<'Urgent' | 'Today' | 'Tomorrow' | 'Later'>('Today');
  const [selectedSlot, setSelectedSlot] = useState(preferredSlot || '10:00 AM');
  const [slotOptions, setSlotOptions] = useState(['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM', '06:00 PM']);

  // Dynamic Price Engine based on urgency of slot
  const calculateAgreedPrice = () => {
    let dayModifier = 1.0;
    if (selectedDay === 'Urgent') dayModifier = 1.25; // 25% premium for urgent
    if (selectedDay === 'Today') dayModifier = 1.1;  // 10% premium for same-day
    if (selectedDay === 'Later') dayModifier = 0.95; // 5% discount for next-day+
    
    // Middle ground calculation modified by surcharge
    const baseAgreed = negotiation?.agreed_price ?? Math.round(customerBudget + (gap * baseFactor));
    
    const surge = selectedDay === 'Urgent' ? 100 : selectedDay === 'Today' ? 50 : 0;
    const loyalty = -30; // Standard loyalty discount for Karigar users
    
    return Math.round(baseAgreed * dayModifier) + surge + loyalty;
  };

  const agreedPrice = calculateAgreedPrice();

  useEffect(() => {
    const pid = selectedProvider?.id;
    if (!pid) return;
    getProviderSlots(pid, new Date().toISOString().slice(0, 10)).then((data) => {
      const slots = (data.slots || [])
        .filter((s: { available?: boolean }) => s.available !== false)
        .map((s: { time: string }) => s.time);
      if (slots.length) setSlotOptions(slots);
    });

    if (currentResponse?.urgency === 5) {
      setSelectedDay('Urgent');
    }
  }, [selectedProvider?.id]);

  const handleAccept = async () => {
    const finalSlot = `${selectedDay}: ${selectedSlot}`;
    setPreferredSlot(finalSlot);
    setCurrentBooking({
      id: `KAI-${Date.now()}`,
      provider_name: providerName,
      service_type: currentResponse?.service_type || 'Service',
      agreed_price: agreedPrice,
      status: 'confirmed',
      slot_time: finalSlot,
      urgency: selectedDay === 'Urgent' ? 5 : 3
    });
    router.push('/confirm');
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={textMain} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textMain }]}>AI Negotiation</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={[styles.subtitle, { color: textSub }]}>Discussing details with {providerName}</Text>

        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <View style={styles.row}>
            <Text style={{ color: textSub }}>Your Budget</Text>
            <Text style={{ color: textMain, fontWeight: 'bold' }}>Rs {customerBudget}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={{ color: textSub }}>Provider Rate</Text>
            <Text style={{ color: textMain, fontWeight: 'bold' }}>Rs {providerRate}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={{ color: '#2ECC71', fontWeight: '800' }}>Loyalty Discount</Text>
            <Text style={{ color: '#2ECC71', fontWeight: 'bold' }}>− Rs 30</Text>
          </View>
          {(selectedDay === 'Urgent' || selectedDay === 'Today') && (
            <>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={{ color: '#E74C3C', fontWeight: '800' }}>Demand Surge</Text>
                <Text style={{ color: '#E74C3C', fontWeight: 'bold' }}>+ Rs {selectedDay === 'Urgent' ? 100 : 50}</Text>
              </View>
            </>
          )}
        </View>

        {/* Step 1: Preferred Day */}
        <Text style={{ color: textMain, fontWeight: 'bold', marginBottom: 12 }}>1. When do you need this?</Text>
        <View style={styles.slotRow}>
          {([
            { id: 'Urgent', label: 'Urgent' },
            { id: 'Today', label: 'Today' },
            { id: 'Tomorrow', label: 'Tomorrow' },
            { id: 'Later', label: 'Next Day' }
          ] as const).map(d => (
            <TouchableOpacity 
              key={d.id} 
              style={[styles.slotChip, selectedDay === d.id && { backgroundColor: '#F39C12', borderColor: '#F39C12' }]}
              onPress={() => setSelectedDay(d.id)}
            >
              <Text style={[{ color: textSub, fontSize: 12 }, selectedDay === d.id && { color: '#fff', fontWeight: 'bold' }]}>{d.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Step 2: Specific Time */}
        <Text style={{ color: textMain, fontWeight: 'bold', marginBottom: 12 }}>2. Preferred Time</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ height: 50, marginBottom: 20 }}>
          <View style={[styles.slotRow, { marginBottom: 0 }]}>
            {slotOptions.map(slot => (
              <TouchableOpacity 
                key={slot} 
                style={[styles.slotChip, selectedSlot === slot && { backgroundColor: '#3498DB', borderColor: '#3498DB' }]}
                onPress={() => setSelectedSlot(slot)}
              >
                <Text style={[{ color: textSub, fontSize: 13 }, selectedSlot === slot && { color: '#fff', fontWeight: 'bold' }]}>{slot}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={[styles.proposedCard, { backgroundColor: '#0D737720', borderColor: '#0D7377', borderWidth: 1, marginTop: 20 }]}>
          <Text style={{ color: '#0D7377', fontWeight: 'bold', marginBottom: 4 }}>AI Adjusted Proposal</Text>
          <Text style={{ color: textMain, fontSize: 32, fontWeight: '900' }}>Rs {agreedPrice}</Text>
          <Text style={{ color: textSub, fontSize: 12, marginTop: 4, textAlign: 'center' }}>
            {selectedDay === 'Urgent' ? 'Includes +25% urgency premium & demand surge' : selectedDay === 'Later' ? 'Includes early-bird discount & loyalty reward' : 'Standard negotiation rate with loyalty discount'}
          </Text>
        </View>

        <TouchableOpacity style={[styles.acceptBtn, { marginTop: 24, marginBottom: 40 }]} onPress={handleAccept}>
          <Text style={styles.acceptBtnTxt}>Confirm Meeting (Rs {agreedPrice})</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: 15, paddingHorizontal: 16, borderBottomWidth: 1 },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  content: { padding: 16, flex: 1 },
  subtitle: { fontSize: 14, marginBottom: 20 },
  card: { padding: 16, borderRadius: 16, marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  divider: { height: 1, backgroundColor: 'rgba(150,150,150,0.2)', marginVertical: 4 },
  proposedCard: { padding: 20, borderRadius: 16, alignItems: 'center', marginVertical: 10 },
  slotRow: { flexDirection: 'row', gap: 10 },
  slotChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(150,150,150,0.3)', height: 40, justifyContent: 'center' },
  acceptBtn: { backgroundColor: '#3498DB', padding: 16, borderRadius: 12, alignItems: 'center' },
  acceptBtnTxt: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
