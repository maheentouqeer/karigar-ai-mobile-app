import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

interface Props {
  customerBudget: number;
  providerBaseRate: number;
  providerName: string;
}

export default function NegotiationView({ customerBudget, providerBaseRate, providerName }: Props) {
  return (
    <View style={styles.container}>
      {/* Customer Side */}
      <View style={styles.side}>
        <View style={styles.avatarWrap}>
          <Image 
            source={{ uri: 'https://via.placeholder.com/64' }} 
            style={[styles.avatar, { borderColor: 'rgba(13, 115, 119, 0.3)' }]} 
          />
        </View>
        <Text style={styles.label}>آپ کا بجٹ</Text>
        <Text style={styles.amountText}>Rs{customerBudget}</Text>
      </View>

      {/* AI Mediator */}
      <View style={styles.mediatorContainer}>
        <View style={styles.mediatorIcon}>
          <Ionicons name="hardware-chip" size={32} color="#fff" />
        </View>
        <View style={styles.connectLineLeft} />
        <View style={styles.connectLineTop} />
      </View>

      {/* Provider Side */}
      <View style={styles.side}>
        <View style={styles.avatarWrap}>
          <Image 
            source={{ uri: 'https://via.placeholder.com/64' }} 
            style={[styles.avatar, { borderColor: 'rgba(255, 183, 128, 0.3)' }]} 
          />
        </View>
        <Text style={styles.label}>{providerName}</Text>
        <Text style={[styles.amountText, { color: theme.colors.accent }]}>Rs{providerBaseRate}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 24,
  },
  side: {
    alignItems: 'center',
    flex: 1,
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    padding: 2,
    marginBottom: 8,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  label: {
    fontFamily: theme.typography.urdu,
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  amountText: {
    fontFamily: theme.typography.englishBold,
    fontSize: 20,
    color: theme.colors.textMain,
  },
  mediatorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    flex: 1,
  },
  mediatorIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: theme.colors.primaryLight,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    zIndex: 2,
  },
  connectLineLeft: {
    position: 'absolute',
    height: 1,
    width: '150%',
    backgroundColor: 'rgba(13, 115, 119, 0.4)',
    zIndex: 1,
  },
  connectLineTop: {
    position: 'absolute',
    width: 1,
    height: 48,
    top: -24,
    backgroundColor: 'rgba(13, 115, 119, 0.4)',
    zIndex: 1,
  }
});
