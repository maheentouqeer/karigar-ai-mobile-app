import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

interface Props {
  title: string;
  time: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  codeSnippet?: string;
}

export default function TraceStep({ title, time, description, icon, color, codeSnippet }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.container}>
      <View style={[styles.timelineDot, { backgroundColor: color, shadowColor: color }]} />
      <View style={styles.line} />
      
      <TouchableOpacity 
        style={[styles.card, { borderLeftColor: color }]} 
        activeOpacity={0.8}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color }]}>{title}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.time}>{time}</Text>
            {codeSnippet && (
              <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color={theme.colors.textSecondary} />
            )}
          </View>
        </View>
        <Text style={styles.description}>{description}</Text>
        
        {expanded && codeSnippet ? (
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>{codeSnippet}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
    paddingLeft: 12,
  },
  timelineDot: {
    position: 'absolute',
    left: 8,
    top: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    zIndex: 2,
    elevation: 4,
  },
  line: {
    position: 'absolute',
    left: 13,
    top: 16,
    bottom: -32,
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  card: {
    flex: 1,
    marginLeft: 24,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  time: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  description: {
    color: theme.colors.textMain,
    fontSize: 14,
  },
  codeBlock: {
    marginTop: 8,
    backgroundColor: theme.colors.background,
    padding: 8,
    borderRadius: 6,
  },
  codeText: {
    color: '#81d4d8',
    fontFamily: 'monospace',
    fontSize: 10,
  }
});
