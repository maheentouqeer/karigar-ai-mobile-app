import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

export default function BookingReceipt() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="receipt-outline" size={20} color={theme.colors.primaryLight} />
          <Text style={styles.headerTitle}>بکنگ رسید</Text>
        </View>
        <Text style={styles.dateText}>May 16, 2026</Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>سروس</Text>
            <Text style={styles.valueUrdu}>AC مرمت</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>کارگر</Text>
            <Text style={styles.value}>Ali AC Services</Text>
          </View>
        </View>
        
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>تاریخ</Text>
            <Text style={styles.valueUrdu}>آج، 16 مئی</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>وقت</Text>
            <Text style={styles.valueUrdu}>شام 6:00 بجے</Text>
          </View>
        </View>

        <View style={styles.fullWidthCol}>
          <Text style={styles.label}>مقام</Text>
          <Text style={styles.valueUrdu}>G-13/4، اسلام آباد</Text>
        </View>
      </View>

      <View style={styles.breakdownBox}>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>بنیادی قیمت</Text>
          <Text style={styles.breakdownValue}>Rs800</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>فاصلہ</Text>
          <Text style={styles.breakdownValue}>+Rs150</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabelHighlight}>AI مذاکرات چھوٹ</Text>
          <Text style={styles.breakdownValueHighlight}>-Rs300</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.breakdownRow}>
          <Text style={styles.totalLabel}>کل:</Text>
          <Text style={styles.totalValue}>Rs650</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View>
          <Text style={styles.label}>Booking ID</Text>
          <Text style={styles.value}>KAI-2026-05847</Text>
        </View>
        <View style={styles.qrPlaceholder}>
          <Ionicons name="qr-code" size={32} color="#000" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(28, 31, 38, 0.8)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingBottom: 12,
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: theme.typography.urdu,
    fontSize: 18,
    color: theme.colors.textMain,
  },
  dateText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  grid: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  col: {
    flex: 1,
  },
  fullWidthCol: {
    marginBottom: 12,
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    textAlign: 'right',
  },
  value: {
    color: theme.colors.textMain,
    fontSize: 14,
    textAlign: 'right',
    fontFamily: theme.typography.english,
  },
  valueUrdu: {
    color: theme.colors.textMain,
    fontSize: 14,
    textAlign: 'right',
    fontFamily: theme.typography.urdu,
  },
  breakdownBox: {
    backgroundColor: theme.colors.surfaceHigh,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  breakdownLabel: {
    fontFamily: theme.typography.urdu,
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  breakdownValue: {
    color: theme.colors.textMain,
    fontSize: 14,
  },
  breakdownLabelHighlight: {
    fontFamily: theme.typography.urdu,
    color: theme.colors.primaryLight,
    fontSize: 14,
  },
  breakdownValueHighlight: {
    color: theme.colors.primaryLight,
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 8,
  },
  totalLabel: {
    fontFamily: theme.typography.urdu,
    fontWeight: 'bold',
    fontSize: 18,
    color: theme.colors.textMain,
  },
  totalValue: {
    fontWeight: 'bold',
    fontSize: 18,
    color: theme.colors.textMain,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  qrPlaceholder: {
    width: 48,
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
