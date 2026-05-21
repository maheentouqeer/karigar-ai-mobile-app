import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import BookingReceipt from '../components/BookingReceipt';

export default function ConfirmScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.successSection}>
          <View style={styles.checkWrap}>
            <View style={styles.checkInner}>
              <Ionicons name="checkmark" size={40} color="#000" />
            </View>
          </View>
          <Text style={styles.successTitle}>بکنگ مکمل!</Text>
          <Text style={styles.successSub}>
            Ali AC Services — <Text style={styles.successSubHighlight}>آج شام 6 بجے</Text>
          </Text>
        </View>

        <BookingReceipt />

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="location-outline" size={20} color={theme.colors.accent} />
            <Text style={styles.actionText}>ٹریک کریں</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="chatbubble-outline" size={20} color={theme.colors.accent} />
            <Text style={styles.actionText}>بات کریں</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtnIconOnly}>
            <Ionicons name="share-outline" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.scheduleSection}>
          <Text style={styles.scheduleTitle}>شیڈول</Text>
          
          <View style={styles.timelineRow}>
            <View style={styles.timelineLine} />
            <View style={styles.timelineStep}>
              <View style={[styles.timelineDot, styles.timelineDotActive]} />
              <Text style={styles.timelineStepText}>یاددہانی</Text>
              <Text style={styles.timelineTime}>5:00 PM</Text>
            </View>
            <View style={styles.timelineStep}>
              <View style={styles.timelineDot} />
              <Text style={styles.timelineStepTextDisabled}>راستے میں</Text>
              <Text style={styles.timelineTime}>5:45 PM</Text>
            </View>
            <View style={styles.timelineStep}>
              <View style={styles.timelineDot} />
              <Text style={styles.timelineStepTextDisabled}>مرمت</Text>
              <Text style={styles.timelineTime}>6:00 PM</Text>
            </View>
            <View style={styles.timelineStep}>
              <View style={styles.timelineDot} />
              <Text style={styles.timelineStepTextDisabled}>مکمل</Text>
              <Text style={styles.timelineTime}>--:--</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.homeBtn}>
          <Text style={styles.homeBtnText}>ہوم پیج پر جائیں</Text>
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
  content: {
    padding: theme.spacing.marginMobile,
    paddingTop: 40,
    paddingBottom: 100,
  },
  successSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  checkWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  checkInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.success,
    elevation: 10,
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  successTitle: {
    fontFamily: theme.typography.urdu,
    fontSize: 32,
    color: theme.colors.textMain,
    marginBottom: 8,
  },
  successSub: {
    fontFamily: theme.typography.urdu,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  successSubHighlight: {
    color: theme.colors.textMain,
    fontWeight: 'bold',
  },
  actionsRow: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginTop: 24,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
    borderRadius: 12,
  },
  actionText: {
    fontFamily: theme.typography.urdu,
    color: theme.colors.accent,
  },
  actionBtnIconOnly: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceHigh,
    borderRadius: 12,
  },
  scheduleSection: {
    marginTop: 32,
  },
  scheduleTitle: {
    fontFamily: theme.typography.urdu,
    fontSize: 18,
    color: theme.colors.textMain,
    textAlign: 'right',
    marginBottom: 16,
  },
  timelineRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: theme.colors.surfaceHigh,
    zIndex: 0,
  },
  timelineStep: {
    alignItems: 'center',
    zIndex: 1,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceHigh,
    borderWidth: 4,
    borderColor: theme.colors.background,
    marginBottom: 8,
  },
  timelineDotActive: {
    backgroundColor: theme.colors.primary,
  },
  timelineStepText: {
    fontFamily: theme.typography.urdu,
    color: theme.colors.textMain,
    fontSize: 12,
  },
  timelineStepTextDisabled: {
    fontFamily: theme.typography.urdu,
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  timelineTime: {
    color: theme.colors.textSecondary,
    fontSize: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.marginMobile,
    backgroundColor: 'rgba(15,17,23,0.9)',
  },
  homeBtn: {
    backgroundColor: theme.colors.primaryLight,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeBtnText: {
    fontFamily: theme.typography.urdu,
    fontWeight: 'bold',
    fontSize: 18,
    color: theme.colors.onPrimary,
  }
});
