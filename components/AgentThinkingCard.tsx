import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

export default function AgentThinkingCard() {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.headerText}>🤖 Agent سوچ رہا ہے...</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.agentRow}>
          <View style={styles.agentTitleRow}>
            <Ionicons name="brain-outline" size={18} color={theme.colors.primaryLight} />
            <Text style={styles.agentName}>NLU Agent</Text>
          </View>
          <Text style={styles.agentStatus}>زبان سمجھ رہا ہے...</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '85%' }]} />
        </View>

        <View style={[styles.agentRow, { marginTop: 12 }]}>
          <View style={styles.agentTitleRow}>
            <Ionicons name="search" size={18} color={theme.colors.primaryLight} />
            <Text style={styles.agentName}>Discovery Agent</Text>
          </View>
          <Text style={styles.agentStatus}>قریبی ماہرین تلاش کر رہا ہے...</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '40%' }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.card,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginVertical: theme.spacing.md,
    overflow: 'hidden',
  },
  header: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerText: {
    fontFamily: theme.typography.urdu,
    color: theme.colors.primaryLight,
    fontSize: 16,
    textAlign: 'right',
  },
  body: {
    padding: theme.spacing.md,
  },
  agentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  agentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  agentName: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginLeft: 4,
    fontFamily: theme.typography.english,
  },
  agentStatus: {
    color: theme.colors.primaryLight,
    fontSize: 12,
    fontFamily: theme.typography.urdu,
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.surfaceHigh,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primaryLight,
    borderRadius: 2,
  }
});
