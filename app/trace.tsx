import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import TraceStep from '../components/TraceStep';

export default function TraceScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="menu" size={24} color={theme.colors.primaryLight} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI فیصلہ سازی</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="notifications-outline" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <View style={styles.tabRow}>
          <TouchableOpacity style={styles.tabBtn}>
            <Text style={styles.tabTextDisabled}>Customer View</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, styles.tabBtnActive]}>
            <Text style={styles.tabTextActive}>Agent Trace</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.traceSubtitle}>ہر فیصلے کی وجہ</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <TraceStep 
          title="NLU Agent"
          time="0.3s"
          description={'"Roman Urdu parsed"'}
          icon="hardware-chip"
          color={theme.colors.success}
          codeSnippet={"Input:\nAC bilkul thand nahi kar raha..."}
        />
        <TraceStep 
          title="Discovery Agent"
          time="1.2s"
          description="14 providers found via Maps API"
          icon="map"
          color={theme.colors.primaryLight}
          codeSnippet={'get_providers_nearby(location="G-13", service="AC_repair")'}
        />
        <TraceStep 
          title="Ranking Agent"
          time="0.8s"
          description="8-factor scoring complete. Winner: Ali AC Services (87/100)"
          icon="star"
          color={theme.colors.primaryLight}
        />
        <TraceStep 
          title="Negotiation Agent"
          time="2.1s"
          description="Budget gap resolved via time-slot optimization. Saved 37%."
          icon="handshake"
          color={theme.colors.warning}
        />
        <TraceStep 
          title="Booking Agent"
          time="0.1s"
          description="write_booking() - Success"
          icon="checkmark-circle"
          color={theme.colors.success}
        />
        <TraceStep 
          title="Follow-up Agent"
          time="0s"
          description="Reminder scheduled for 5:00 PM"
          icon="time"
          color={theme.colors.surfaceHigh}
        />
      </ScrollView>

      <View style={styles.footerMetrics}>
        <View style={styles.metricItem}>
          <Ionicons name="speedometer-outline" size={16} color={theme.colors.primaryLight} />
          <Text style={styles.metricText}>Time: <Text style={styles.metricBold}>2.3s</Text></Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Ionicons name="hardware-chip-outline" size={16} color={theme.colors.primaryLight} />
          <Text style={styles.metricText}>Tokens: <Text style={styles.metricBold}>~1,847</Text></Text>
        </View>
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
  },
  headerLeft: {
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
  iconBtn: {
    padding: 8,
  },
  tabContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 16,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceHigh,
    borderRadius: 8,
    padding: 4,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabBtnActive: {
    backgroundColor: theme.colors.primary,
  },
  tabTextActive: {
    color: theme.colors.onPrimary,
    fontWeight: 'bold',
  },
  tabTextDisabled: {
    color: theme.colors.textSecondary,
  },
  traceSubtitle: {
    fontFamily: theme.typography.urdu,
    color: theme.colors.primaryLight,
    textAlign: 'center',
    fontSize: 16,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  footerMetrics: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(28, 31, 38, 0.9)',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  metricBold: {
    color: theme.colors.textMain,
    fontWeight: 'bold',
  },
  metricDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
  }
});
