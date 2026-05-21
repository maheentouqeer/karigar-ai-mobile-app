import React from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, SafeAreaView, I18nManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import VoiceButton from '../../components/VoiceButton';

export default function HomeScreen() {
  const categories = [
    { id: '1', name: 'اے سی کی مرمت', icon: 'snow' as const },
    { id: '2', name: 'پلمبر', icon: 'water' as const },
    { id: '3', name: 'الیکٹریشن', icon: 'flash' as const },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.greetingTitle}>آپ کو کیا چاہیے؟</Text>
          <Text style={styles.greetingSub}>AI-powered home services</Text>
        </View>

        <VoiceButton />

        <View style={styles.searchSection}>
          <Text style={styles.orText}>یا ٹائپ کریں</Text>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color={theme.colors.primary} style={styles.searchIcon} />
            <TextInput 
              style={styles.searchInput}
              placeholder="Search for a service..."
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
          {categories.map((cat, idx) => (
            <TouchableOpacity key={cat.id} style={[styles.catChip, idx === 0 && styles.catChipActive]}>
              <Ionicons name={cat.icon} size={16} color={theme.colors.primary} />
              <Text style={styles.catText}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>حالیہ بکنگ</Text>
            <Text style={styles.seeAll}>See all</Text>
          </View>
          
          <View style={styles.bookingCard}>
            <View style={styles.bookingIconWrap}>
              <Ionicons name="hardware-chip" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.bookingInfo}>
              <View style={styles.bookingReqRow}>
                <Text style={styles.bookingBadge}>COMPLETED</Text>
                <Text style={styles.bookingServiceName}>Fan Repair</Text>
              </View>
              <View style={styles.bookingProviderRow}>
                <Text style={styles.providerName}>Arshad Karigar</Text>
                <View style={styles.ratingWrap}>
                  <Ionicons name="star" size={12} color={theme.colors.warning} />
                  <Text style={styles.ratingText}>4.9</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.marginMobile,
  },
  header: {
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  greetingTitle: {
    fontFamily: theme.typography.urdu,
    fontSize: 24,
    color: theme.colors.textMain,
    textAlign: 'center',
  },
  greetingSub: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    opacity: 0.8,
  },
  searchSection: {
    marginBottom: theme.spacing.xl,
  },
  orText: {
    fontFamily: theme.typography.urdu,
    textAlign: 'center',
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceHigh,
    borderRadius: theme.borderRadius.button,
    height: 48,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.textMain,
    height: '100%',
  },
  categories: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xl,
    marginHorizontal: -theme.spacing.marginMobile,
    paddingHorizontal: theme.spacing.marginMobile,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.button,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginRight: 8,
  },
  catChipActive: {
    backgroundColor: 'rgba(13, 115, 119, 0.1)',
    borderColor: 'rgba(13, 115, 119, 0.2)',
  },
  catText: {
    fontFamily: theme.typography.urdu,
    color: theme.colors.textMain,
    marginLeft: 6,
    fontSize: 12,
  },
  recentSection: {
    marginTop: theme.spacing.md,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recentTitle: {
    fontFamily: theme.typography.urdu,
    fontWeight: 'bold',
    fontSize: 18,
    color: theme.colors.textMain,
  },
  seeAll: {
    color: theme.colors.primaryLight,
    fontSize: 14,
  },
  bookingCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.card,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  bookingIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingReqRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  bookingBadge: {
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
    color: theme.colors.success,
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  bookingServiceName: {
    color: theme.colors.textMain,
    fontWeight: 'bold',
  },
  bookingProviderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  providerName: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  ratingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    color: theme.colors.warning,
    fontSize: 12,
  }
});
