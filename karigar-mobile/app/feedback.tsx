import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { updateProviderReview } from '../services/api';
import { scheduleLocalNotification } from '../services/pushNotifications';

const CHECKLIST_ITEMS = [
  { id: 'done', label: 'Service was completed as described' },
  { id: 'ontime', label: 'Provider arrived on time' },
  { id: 'clean', label: 'Work area was left clean' },
  { id: 'price', label: 'Final price matched the quote' },
  { id: 'issue_delay', label: 'Provider was significantly late (or no-show)', negative: true },
  { id: 'issue_quality', label: 'The work was incomplete or poor quality', negative: true },
  { id: 'issue_behavior', label: 'Provider was unprofessional or rude', negative: true },
];

export default function FeedbackScreen() {
  const router = useRouter();
  const {
    currentBooking,
    selectedProvider,
    theme,
    updateProviderTrustScore,
    recordProviderReviewReceived,
    calculateProviderScore,
    notificationsEnabled,
  } = useStore();
  const [stars, setStars] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [reviewText, setReviewText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDark = theme === 'dark';
  const bg = isDark ? '#0A0A0F' : '#F8F9FA';
  const textMain = isDark ? '#fff' : '#111';
  const textSub = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : '#fff';

  const providerName = currentBooking?.provider_name || selectedProvider?.name || 'Provider';
  const serviceType = currentBooking?.service_type || 'Service';
  const bookingId = currentBooking?.id || 'pending';
  const oldRating = selectedProvider?.rating ?? 4.5;

  // Simulate how this rating affects trust score
  const ratingImpact = stars >= 4 ? '+2 pts' : stars === 3 ? '0 pts' : '-3 pts';
  const ratingImpactColor = stars >= 4 ? '#2ECC71' : stars === 3 ? '#F39C12' : '#E74C3C';
  const newTrustScore = Math.max(
    0,
    Math.min(100, (selectedProvider?.trust_score ?? 80) + (stars >= 4 ? 2 : stars === 3 ? 0 : -3))
  );

  const handleToggle = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = async () => {
    if (stars === 0) {
      Alert.alert('Rating Required', 'Please give a star rating before submitting.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (selectedProvider?.id) {
        // Record locally first to ensure UI update
        recordProviderReviewReceived(stars);
        calculateProviderScore();
        
        try {
          const res = await updateProviderReview(
            selectedProvider.id,
            stars,
            reviewText || `Rating: ${stars}/5`
          );
          const synced =
            typeof res.new_score === 'number' ? res.new_score : newTrustScore;
          updateProviderTrustScore(selectedProvider.id, synced);
        } catch (e) {
          console.warn('review API failed (expected in offline/demo):', e);
          updateProviderTrustScore(selectedProvider.id, newTrustScore);
        }

        await scheduleLocalNotification(
          'New review received',
          `${stars}/5 stars for ${serviceType} — "${(reviewText || 'No comment').slice(0, 60)}"`,
          { enabled: notificationsEnabled }
        );
        
        setSubmitted(true);
      } else {
        // Fallback for guest bookings
        setSubmitted(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <View style={[styles.container, { backgroundColor: bg, justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Ionicons name="checkmark-circle" size={80} color="#2ECC71" />
        <Text style={{ color: textMain, fontSize: 22, fontWeight: '900', marginTop: 20, textAlign: 'center' }}>
          Feedback Submitted!
        </Text>
        <Text style={{ color: textSub, fontSize: 14, textAlign: 'center', marginTop: 10, lineHeight: 22 }}>
          Your review has been recorded. It will influence {providerName}'s future ranking.
        </Text>

        {/* Trust Score Impact Card */}
        <View style={[styles.impactCard, { backgroundColor: cardBg, marginTop: 30 }]}>
          <Text style={{ color: textMain, fontWeight: '700', fontSize: 15, marginBottom: 16 }}>
            Matching Impact
          </Text>

          <View style={styles.impactRow}>
            <Ionicons name="star" size={16} color="#F39C12" />
            <Text style={{ color: textSub, flex: 1, marginLeft: 8 }}>Your Rating</Text>
            <Text style={{ color: '#F39C12', fontWeight: '700' }}>
              {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
            </Text>
          </View>

          <View style={styles.impactRow}>
            <Ionicons name="trending-up" size={16} color={ratingImpactColor} />
            <Text style={{ color: textSub, flex: 1, marginLeft: 8 }}>Trust Score Change</Text>
            <Text style={{ color: ratingImpactColor, fontWeight: '700' }}>{ratingImpact}</Text>
          </View>

          <View style={styles.impactRow}>
            <Ionicons name="shield-checkmark" size={16} color="#0D7377" />
            <Text style={{ color: textSub, flex: 1, marginLeft: 8 }}>New Trust Score</Text>
            <Text style={{ color: '#0D7377', fontWeight: '700' }}>{newTrustScore}/100</Text>
          </View>

          <View
            style={[
              styles.infoBox,
              {
                backgroundColor: isDark ? 'rgba(46,204,113,0.1)' : 'rgba(46,204,113,0.05)',
                borderColor: 'rgba(46,204,113,0.3)',
              },
            ]}
          >
            <Ionicons name="information-circle-outline" size={14} color="#2ECC71" />
            <Text style={{ color: '#2ECC71', fontSize: 12, marginLeft: 6, flex: 1 }}>
              This rating will affect {providerName}'s position in future AI rankings
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.homeBtn} onPress={() => router.push('/(tabs)')}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={textMain} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textMain }]}>Rate Your Service</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        {/* Booking summary */}
        <View style={[styles.summaryCard, { backgroundColor: cardBg }]}>
          <View style={styles.providerRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarTxt}>{providerName.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: textMain, fontWeight: '700', fontSize: 15 }}>{providerName}</Text>
              <Text style={{ color: textSub, fontSize: 12 }}>{serviceType} • {bookingId}</Text>
            </View>
            <View
              style={[
                styles.completedBadge,
                { backgroundColor: 'rgba(46,204,113,0.15)' },
              ]}
            >
              <Text style={{ color: '#2ECC71', fontSize: 11, fontWeight: '700' }}>✓ Completed</Text>
            </View>
          </View>
        </View>

        {/* Star Rating */}
        <Text style={[styles.sectionLabel, { color: textSub }]}>YOUR RATING</Text>
        <View style={[styles.card, { backgroundColor: cardBg, alignItems: 'center', paddingVertical: 24 }]}>
          <Text style={{ color: textMain, fontWeight: '700', fontSize: 16, marginBottom: 20 }}>
            How was {providerName}?
          </Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <TouchableOpacity key={s} onPress={() => setStars(s)}>
                <Ionicons
                  name={s <= (hoveredStar || stars) ? 'star' : 'star-outline'}
                  size={44}
                  color={s <= (hoveredStar || stars) ? '#F39C12' : 'rgba(150,150,150,0.4)'}
                  style={{ marginHorizontal: 4 }}
                />
              </TouchableOpacity>
            ))}
          </View>
          {stars > 0 && (
            <Text style={{ color: textSub, marginTop: 12, fontSize: 14 }}>
              {stars === 5
                ? '🎉 Excellent! Outstanding service'
                : stars === 4
                ? '👍 Good! Better than average'
                : stars === 3
                ? '😐 Okay. Room for improvement'
                : stars === 2
                ? '😟 Poor. Several issues'
                : '❌ Very bad. Major problems'}
            </Text>
          )}
        </View>

        {/* Completion Checklist */}
        <Text style={[styles.sectionLabel, { color: textSub }]}>SERVICE CHECKLIST</Text>
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          {CHECKLIST_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.checkRow,
                {
                  borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                },
              ]}
              onPress={() => handleToggle(item.id)}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: checked[item.id] ? (item.negative ? '#E74C3C' : '#2ECC71') : 'transparent',
                    borderColor: checked[item.id] ? (item.negative ? '#E74C3C' : '#2ECC71') : 'rgba(150,150,150,0.4)',
                  },
                ]}
              >
                {checked[item.id] && (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                )}
              </View>
              <Text style={{ color: item.negative ? '#E74C3C' : textMain, flex: 1, marginLeft: 12, fontSize: 14 }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Written Review */}
        <Text style={[styles.sectionLabel, { color: textSub }]}>WRITTEN REVIEW (OPTIONAL)</Text>
        <View style={[styles.card, { backgroundColor: cardBg, padding: 14 }]}>
          <TextInput
            style={[
              styles.reviewInput,
              { color: textMain, borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' },
            ]}
            placeholder="Describe your experience..."
            placeholderTextColor={textSub}
            value={reviewText}
            onChangeText={setReviewText}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Matching Impact Preview */}
        {stars > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: textSub }]}>FUTURE MATCHING IMPACT</Text>
            <View style={[styles.card, { backgroundColor: cardBg }]}>
              <View style={styles.impactRow}>
                <Ionicons name="bar-chart-outline" size={16} color="#3498DB" />
                <Text style={{ color: textSub, flex: 1, marginLeft: 8 }}>Current Trust Score</Text>
                <Text style={{ color: textMain, fontWeight: '700' }}>
                  {selectedProvider?.trust_score ?? 80}/100
                </Text>
              </View>
              <View style={styles.impactRow}>
                <Ionicons name="trending-up" size={16} color={ratingImpactColor} />
                <Text style={{ color: textSub, flex: 1, marginLeft: 8 }}>Your Rating Impact</Text>
                <Text style={{ color: ratingImpactColor, fontWeight: '700' }}>{ratingImpact}</Text>
              </View>
              <View style={[styles.impactRow, { borderBottomWidth: 0 }]}>
                <Ionicons name="shield-checkmark" size={16} color="#0D7377" />
                <Text style={{ color: textSub, flex: 1, marginLeft: 8 }}>Projected New Score</Text>
                <Text style={{ color: '#0D7377', fontWeight: '700' }}>{newTrustScore}/100</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Submit Footer */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: isDark ? '#12121A' : '#fff',
            borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.submitBtn, { opacity: (stars === 0 || isSubmitting) ? 0.5 : 1 }]}
          onPress={handleSubmit}
          disabled={stars === 0 || isSubmitting}
        >
          <Ionicons name={isSubmitting ? "hourglass-outline" : "checkmark-circle-outline"} size={20} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 8 }}>
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Text>
        </TouchableOpacity>
      </View>
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
  summaryCard: { flexDirection: 'row', padding: 14, borderRadius: 14, marginBottom: 20 },
  providerRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0D737730',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarTxt: { color: '#0D7377', fontWeight: '800', fontSize: 18 },
  completedBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 8 },
  card: { borderRadius: 16, overflow: 'hidden', marginBottom: 20 },
  starsRow: { flexDirection: 'row', justifyContent: 'center' },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    minHeight: 90,
  },
  impactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.1)',
  },
  impactCard: { width: '100%', padding: 16, borderRadius: 16 },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  homeBtn: {
    backgroundColor: '#0D7377',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 30,
  },
  footer: {
    padding: 16,
    paddingBottom: 34,
    borderTopWidth: 1,
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  submitBtn: {
    backgroundColor: '#0D7377',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
