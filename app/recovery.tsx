import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

export default function RecoveryScreen() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => {
        if (prev < 4) return prev + 1;
        clearInterval(timer);
        return prev;
      });
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="menu" size={24} color={theme.colors.primaryLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Karigar AI</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="notifications-outline" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.alertBanner}>
        <Ionicons name="warning" size={20} color="#fff" />
        <Text style={styles.alertText}>⚠️ Ali AC Services نے منسوخ کر دیا</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.recoveryCard}>
          <View style={styles.recoveryHeader}>
            <Text style={styles.recoveryTitle}>🤖 Recovery Agent فعال</Text>
            <Ionicons name="hardware-chip" size={24} color={theme.colors.primaryLight} />
          </View>

          <View style={styles.loadingRow}>
            <Ionicons name="sync" size={16} color={theme.colors.primaryLight} />
            <Text style={styles.loadingText}>متبادل تلاش ہو رہا ہے...</Text>
          </View>

          <View style={styles.timeline}>
            <View style={styles.timelineLine} />
            
            {step >= 0 && (
              <View style={styles.step}>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} style={styles.stepIcon} />
                <View>
                  <Text style={styles.stepTime}>T+0s</Text>
                  <Text style={styles.stepDesc}>Provider cancellation detected</Text>
                </View>
              </View>
            )}

            {step >= 1 && (
              <View style={styles.step}>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} style={styles.stepIcon} />
                <View>
                  <Text style={styles.stepTime}>T+2s</Text>
                  <Text style={styles.stepDesc}>Rebooking agent activated</Text>
                </View>
              </View>
            )}

            {step >= 2 && (
              <View style={styles.step}>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} style={styles.stepIcon} />
                <View>
                  <Text style={styles.stepTime}>T+5s</Text>
                  <Text style={[styles.stepDesc, {color: theme.colors.primaryLight, fontWeight: 'bold'}]}>
                    Next-best match found: Tariq AC Services
                  </Text>
                </View>
              </View>
            )}

            {step >= 3 && (
              <View style={styles.step}>
                <View style={[styles.stepIcon, styles.activeIconWrap]}>
                  <Ionicons name="arrow-forward" size={14} color="#fff" />
                </View>
                <View>
                  <Text style={[styles.stepTime, {color: theme.colors.primaryLight, fontWeight: 'bold'}]}>T+8s</Text>
                  <Text style={[styles.stepDesc, {color: theme.colors.primaryLight, fontWeight: 'bold'}]}>
                    New slot confirmed: 6:30 PM
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {step >= 4 && (
          <View style={styles.newProviderCard}>
          <View style={styles.providerHeader}>
            <Image source={{uri: 'https://via.placeholder.com/48'}} style={styles.providerAvatar} />
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>Tariq AC Services</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color={theme.colors.warning} />
                <Text style={styles.ratingText}>4.7</Text>
                <Ionicons name="checkmark-circle" size={14} color={theme.colors.primaryLight} />
              </View>
            </View>
            <View style={styles.providerPriceCol}>
              <Text style={styles.priceAmount}>Rs680</Text>
              <Text style={styles.priceMeta}>Same day 6:30 PM</Text>
            </View>
          </View>

          <View style={styles.metaBox}>
            <Ionicons name="pricetag" size={16} color={theme.colors.warning} />
            <Text style={styles.metaText}>Ali کی معاوضہ چھوٹ لاگو</Text>
          </View>

          <View style={[styles.metaBox, styles.metaBoxPrimary]}>
            <Ionicons name="wallet" size={16} color={theme.colors.primaryLight} />
            <Text style={styles.metaTextPrimary}>Rs50 کریڈٹ آپ کے اکاؤنٹ میں</Text>
          </View>
        </View>
        )}

        {step >= 4 && (
          <View style={styles.actionsBox}>
            <TouchableOpacity style={styles.acceptBtn}>
              <Text style={styles.acceptBtnText}>نئی بکنگ قبول کریں</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>منسوخ کریں</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  headerTitle: {
    fontFamily: theme.typography.englishBold,
    fontSize: 20,
    color: theme.colors.primaryLight,
  },
  iconBtn: {
    padding: 8,
  },
  alertBanner: {
    backgroundColor: theme.colors.error,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertText: {
    fontFamily: theme.typography.urdu,
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  recoveryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(13, 115, 119, 0.4)',
    marginBottom: 16,
  },
  recoveryHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recoveryTitle: {
    fontFamily: theme.typography.urdu,
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primaryLight,
  },
  loadingRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(30,31,38,0.5)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  loadingText: {
    fontFamily: theme.typography.urdu,
    color: theme.colors.textMain,
    fontSize: 14,
  },
  timeline: {
    position: 'relative',
    paddingRight: 8,
  },
  timelineLine: {
    position: 'absolute',
    right: 17,
    top: 10,
    bottom: 20,
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  step: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepIcon: {
    marginLeft: 12,
    backgroundColor: theme.colors.surface,
    zIndex: 1,
  },
  activeIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTime: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    textAlign: 'right',
  },
  stepDesc: {
    color: theme.colors.textMain,
    fontSize: 14,
    textAlign: 'right',
  },
  newProviderCard: {
    backgroundColor: 'rgba(28, 31, 38, 0.6)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 24,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  providerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  providerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  providerName: {
    fontWeight: 'bold',
    color: theme.colors.textMain,
    fontSize: 16,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ratingText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  providerPriceCol: {
    alignItems: 'flex-end',
  },
  priceAmount: {
    color: theme.colors.primaryLight,
    fontSize: 18,
    fontWeight: 'bold',
  },
  priceMeta: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  metaBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(243, 156, 18, 0.1)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  metaText: {
    fontFamily: theme.typography.urdu,
    color: theme.colors.warning,
  },
  metaBoxPrimary: {
    backgroundColor: 'rgba(13, 115, 119, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(13, 115, 119, 0.4)',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  metaTextPrimary: {
    fontFamily: theme.typography.urdu,
    color: theme.colors.primaryLight,
    fontWeight: 'bold',
  },
  actionsBox: {
    gap: 12,
  },
  acceptBtn: {
    backgroundColor: theme.colors.accent,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtnText: {
    fontFamily: theme.typography.urdu,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2f1400',
  },
  cancelBtn: {
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cancelBtnText: {
    fontFamily: theme.typography.urdu,
    fontSize: 18,
    color: theme.colors.textMain,
  }
});
