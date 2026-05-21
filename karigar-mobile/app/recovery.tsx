import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, ScrollView, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';

const STEPS = [
  { time: 'T+0s', desc: 'Provider cancellation detected', delay: 0 },
  { time: 'T+2s', desc: 'Recovery Agent activated', delay: 1500 },
  { time: 'T+5s', desc: 'Next-best provider found: Tariq AC Services', delay: 3000 },
  { time: 'T+8s', desc: 'New slot confirmed: 6:30 PM', delay: 4500 },
];

export default function RecoveryScreen() {
  const router = useRouter();
  const { currentResponse } = useStore();
  const [visibleSteps, setVisibleSteps] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    STEPS.forEach((s, i) => {
      const t = setTimeout(() => setVisibleSteps(i + 1), s.delay);
      timerRefs.current.push(t);
    });
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => {
      timerRefs.current.forEach(clearTimeout);
      anim.stop();
    };
  }, []);

  const done = visibleSteps >= STEPS.length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Red Alert Banner */}
      <View style={styles.alertBanner}>
        <Ionicons name="warning" size={20} color="#fff" />
        <Text style={styles.alertText}>⚠️ فراہم کنندہ نے منسوخ کر دیا</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Recovery Agent Card */}
        <Animated.View style={[styles.recoveryCard, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="hardware-chip" size={24} color="#0D7377" />
            <Text style={styles.cardTitle}>🤖 Recovery Agent فعال</Text>
          </View>
          <Text style={styles.cardSub}>متبادل تلاش ہو رہا ہے...</Text>

          {/* Timeline */}
          <View style={styles.timeline}>
            {STEPS.slice(0, visibleSteps).map((s, i) => (
              <View key={i} style={styles.step}>
                <View style={[styles.stepDot, i === visibleSteps - 1 && !done && styles.stepDotActive]}>
                  {done || i < visibleSteps - 1 ? (
                    <Ionicons name="checkmark" size={12} color="#000" />
                  ) : (
                    <Ionicons name="arrow-forward" size={10} color="#fff" />
                  )}
                </View>
                <View>
                  <Text style={styles.stepTime}>{s.time}</Text>
                  <Text style={[styles.stepDesc, i === 2 && styles.stepDescHighlight]}>
                    {s.desc}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* New Provider Card */}
        {done && (
          <View style={styles.providerCard}>
            <View style={styles.providerHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>TA</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.providerName}>Tariq AC Services</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color="#F39C12" />
                  <Text style={styles.rating}>4.7</Text>
                  <Ionicons name="checkmark-circle" size={14} color="#0D7377" />
                  <Text style={styles.verified}>Verified</Text>
                </View>
              </View>
              <View>
                <Text style={styles.price}>Rs 680</Text>
                <Text style={styles.priceTime}>6:30 PM</Text>
              </View>
            </View>

            {/* Compensation */}
            <View style={styles.metaBox}>
              <Ionicons name="wallet" size={16} color="#2ECC71" />
              <Text style={styles.metaText}>Rs 50 کریڈٹ آپ کے اکاؤنٹ میں</Text>
            </View>

            <View style={[styles.metaBox, { borderColor: 'rgba(231,76,60,0.3)', backgroundColor: 'rgba(231,76,60,0.1)' }]}>
              <Ionicons name="trending-down" size={16} color="#E74C3C" />
              <Text style={[styles.metaText, { color: '#E74C3C' }]}>
                Ali کا Trust Score: 4.8 → 4.4
              </Text>
            </View>

            {/* Actions */}
            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={() => router.push('/confirm')}
            >
              <Text style={styles.acceptText}>نئی بکنگ قبول کریں</Text>
              <Ionicons name="checkmark-circle" size={20} color="#000" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
              <Text style={styles.cancelText}>منسوخ کریں</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  alertBanner: {
    backgroundColor: '#E74C3C', flexDirection: 'row', alignItems: 'center',
    padding: 14, paddingHorizontal: 20, gap: 10,
  },
  alertText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  scroll: { padding: 16, paddingBottom: 40 },
  recoveryCard: {
    backgroundColor: '#1A1A2E', borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(13,115,119,0.4)',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  cardTitle: { color: '#0D7377', fontSize: 17, fontWeight: '700' },
  cardSub: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 16 },
  timeline: { gap: 14 },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepDot: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: '#2ECC71',
    justifyContent: 'center', alignItems: 'center',
  },
  stepDotActive: { backgroundColor: '#0D7377', borderWidth: 2, borderColor: 'rgba(13,115,119,0.4)' },
  stepTime: { color: 'rgba(255,255,255,0.4)', fontSize: 11 },
  stepDesc: { color: '#fff', fontSize: 13 },
  stepDescHighlight: { color: '#0D7377', fontWeight: '700' },
  providerCard: {
    backgroundColor: '#1A1A2E', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  providerHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  avatar: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: '#0D7377',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  providerName: { color: '#fff', fontWeight: '700', fontSize: 16 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  rating: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  verified: { color: '#0D7377', fontSize: 12 },
  price: { color: '#0D7377', fontWeight: '700', fontSize: 18, textAlign: 'right' },
  priceTime: { color: 'rgba(255,255,255,0.4)', fontSize: 12, textAlign: 'right' },
  metaBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(46,204,113,0.1)', borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: 'rgba(46,204,113,0.3)', marginBottom: 8,
  },
  metaText: { color: '#2ECC71', fontWeight: '600', fontSize: 13 },
  acceptBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#F4A261', borderRadius: 12, padding: 16, marginTop: 16, marginBottom: 10,
  },
  acceptText: { color: '#000', fontWeight: '700', fontSize: 16 },
  cancelBtn: {
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 12,
    padding: 14, alignItems: 'center',
  },
  cancelText: { color: 'rgba(255,255,255,0.6)', fontSize: 15 },
});
