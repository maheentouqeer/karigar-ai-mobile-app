import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { Provider } from '../types';

interface Props {
  provider: Provider;
  onPress?: () => void;
}

export default function ProviderCard({ provider, onPress }: Props) {
  return (
    <TouchableOpacity activeOpacity={0.8} style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.profileRow}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: provider.avatar || 'https://via.placeholder.com/52' }} 
              style={styles.avatar} 
            />
            {provider.verified && (
              <View style={styles.badge}>
                <Ionicons name="checkmark-circle" size={14} color={theme.colors.textMain} />
              </View>
            )}
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.name}>{provider.name}</Text>
            <View style={styles.roleTag}>
              <Text style={styles.roleText}>{provider.role}</Text>
            </View>
          </View>
        </View>
        <View style={styles.priceCol}>
          <Text style={styles.price}>Rs{provider.baseRate}</Text>
          <Text style={styles.baseLabel}>base rate</Text>
        </View>
      </View>
      
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Ionicons name="star" size={16} color={theme.colors.warning} />
          <Text style={styles.statText}>{provider.rating} ({provider.reviews})</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="location" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.statText}>{provider.distance} km</Text>
        </View>
      </View>
      
      <View style={styles.trustRow}>
        <Text style={styles.trustLabel}>اعتماد اسکور: {provider.trustScore}/100</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${provider.trustScore}%` }]} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.card,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profileRow: {
    flexDirection: 'row',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: 'rgba(13, 115, 119, 0.2)',
  },
  badge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
  },
  infoCol: {
    justifyContent: 'center',
  },
  name: {
    color: theme.colors.textMain,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: theme.typography.english,
  },
  roleTag: {
    backgroundColor: 'rgba(13, 115, 119, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  roleText: {
    color: theme.colors.primaryLight,
    fontSize: 10,
  },
  priceCol: {
    alignItems: 'flex-end',
  },
  price: {
    color: theme.colors.primaryLight,
    fontSize: 20,
    fontWeight: 'bold',
  },
  baseLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: theme.colors.textMain,
    fontSize: 14,
  },
  trustRow: {
    marginTop: 12,
  },
  trustLabel: {
    fontFamily: theme.typography.urdu,
    color: theme.colors.textSecondary,
    fontSize: 14,
    textAlign: 'right',
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: theme.colors.surfaceHigh,
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primaryLight,
    borderRadius: 3,
  }
});
