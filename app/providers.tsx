import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import ProviderCard from '../components/ProviderCard';

export default function ProvidersScreen() {
  const [expanded, setExpanded] = useState(false);
  const providers = [
    {
      id: '1',
      name: 'Arshad Karigar',
      role: 'AC Expert',
      rating: 4.9,
      reviews: 127,
      distance: 2.3,
      baseRate: 850,
      trustScore: 98,
      verified: true,
      avatar: 'https://via.placeholder.com/52',
      recommendationContext: 'Recommended for highest reliability and speed.',
      isTopAI: true
    },
    {
      id: '2',
      name: 'Sajid Khan',
      role: 'Master Technician',
      rating: 4.7,
      reviews: 89,
      distance: 1.5,
      baseRate: 750,
      trustScore: 87,
      verified: true,
      avatar: 'https://via.placeholder.com/52',
      recommendationContext: 'Recommended despite distance — 0% cancellations this month.',
      isTopAI: false
    },
    {
      id: '3',
      name: 'Zahid Ahmed',
      role: 'AC Specialist',
      rating: 4.2,
      reviews: 210,
      distance: 4.0,
      baseRate: 600,
      trustScore: 65,
      verified: false,
      avatar: 'https://via.placeholder.com/52',
      cancelWarning: '3 recent cancellations',
      isTopAI: false
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleWrap}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.primaryLight} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>3 بہترین ماہرین</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="filter" size={24} color={theme.colors.primaryLight} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.aiRecommendedTagRow}>
          <View style={styles.divider} />
          <Text style={styles.aiRecommendedText}>AI RECOMMENDED</Text>
          <View style={styles.divider} />
        </View>

        {providers.map((p, idx) => (
          <View key={p.id}>
            <ProviderCard provider={p as any} />
            {p.cancelWarning && (
              <View style={styles.warningTag}>
                <Ionicons name="warning" size={14} color={theme.colors.error} />
                <Text style={styles.warningText}>{p.cancelWarning}</Text>
              </View>
            )}
          </View>
        ))}

        <TouchableOpacity style={styles.aiAccordionBtn} onPress={() => setExpanded(!expanded)}>
          <Text style={styles.accordionTitle}>AI نے کیوں یہ انتخاب کیا؟</Text>
          <Ionicons name={expanded ? "chevron-up-circle" : "chevron-down-circle"} size={24} color={theme.colors.primaryLight} />
        </TouchableOpacity>

        {expanded && (
          <View style={styles.accordionContent}>
            <Text style={styles.factorDesc}>آٹھ عوامل پر مبنی رپورٹ:</Text>
            {[
              "1. ریٹنگ اور فیڈبیک - اعلیٰ",
              "2. فاصلہ - قریب ترین",
              "3. قیمت کا موازنہ - بہترین قیمت",
              "4. دستیابی - آپ کے وقت پر",
              "5. اعتماد اسکور - 98/100",
              "6. منسوخی کی شرح - 0%",
              "7. تجربہ - 5 سال+",
              "8. پس منظر کی جانچ - کلیئرڈ"
            ].map((factor, idx) => (
              <View key={idx} style={styles.factorRow}>
                <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                <Text style={styles.factorText}>{factor}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.bookBtn}>
          <Text style={styles.bookBtnText}>Book کریں</Text>
          <Ionicons name="calendar" size={20} color="#2f1400" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 64,
    backgroundColor: 'rgba(30,31,38,0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: theme.typography.urdu,
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primaryLight,
  },
  headerActions: {
    flexDirection: 'row',
  },
  iconBtn: {
    padding: 8,
  },
  content: {
    padding: theme.spacing.marginMobile,
    paddingBottom: 100,
  },
  aiRecommendedTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(13, 115, 119, 0.3)',
  },
  aiRecommendedText: {
    color: theme.colors.primaryLight,
    fontSize: 10,
    letterSpacing: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(13, 115, 119, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(13, 115, 119, 0.2)',
  },
  warningTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: -8,
    marginBottom: 16,
    marginLeft: 16,
  },
  warningText: {
    color: theme.colors.error,
    fontSize: 12,
  },
  aiAccordionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  accordionTitle: {
    fontFamily: theme.typography.urdu,
    fontSize: 18,
    color: theme.colors.textMain,
  },
  accordionContent: {
    backgroundColor: 'rgba(30,31,38,0.5)',
    padding: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  factorDesc: {
    fontFamily: theme.typography.urdu,
    color: theme.colors.textSecondary,
    marginBottom: 8,
    textAlign: 'right',
  },
  factorRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  factorText: {
    fontFamily: theme.typography.urdu,
    color: theme.colors.textMain,
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.marginMobile,
    backgroundColor: 'rgba(30,31,38,0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  bookBtn: {
    flexDirection: 'row-reverse',
    backgroundColor: theme.colors.accent,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  bookBtnText: {
    fontFamily: theme.typography.urdu,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2f1400',
  }
});
