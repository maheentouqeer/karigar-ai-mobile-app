import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AGENTS = [
  { name: 'NLU', label: 'NLU', color: '#9B59B6' },
  { name: 'Discovery', label: 'Discover', color: '#3498DB' },
  { name: 'Ranking', label: 'Rank', color: '#F39C12' },
  { name: 'Negotiation', label: 'Negotiate', color: '#0D7377' },
  { name: 'Booking', label: 'Book', color: '#2ECC71' },
];

export default function AgentThinkingCard() {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const dotAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.ease, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 800, easing: Easing.ease, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(dotAnim, { toValue: 4, duration: 2000, easing: Easing.linear, useNativeDriver: false })
    ).start();

    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, []);

  const scale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] });
  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
      <View style={styles.header}>
        <Animated.View style={{ transform: [{ rotate: spin }], marginRight: 10 }}>
          <Ionicons name="sync" size={22} color="#0D7377" />
        </Animated.View>
        <Text style={styles.title}>AI Agents at work...</Text>
      </View>

      <View style={styles.agentsRow}>
        {AGENTS.map((agent, i) => (
          <Animated.View
            key={agent.name}
            style={[
              styles.agentDot,
              {
                backgroundColor: agent.color,
                opacity: dotAnim.interpolate({
                  inputRange: [i, i + 0.5, i + 1, 10],
                  outputRange: [0.4, 1, 0.4, 0.4],
                  extrapolate: 'clamp',
                }),
              },
            ]}
          >
            <Text style={styles.agentLabel}>{agent.label}</Text>
          </Animated.View>
        ))}
      </View>

      <View style={styles.progressBar}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: dotAnim.interpolate({
                inputRange: [0, 4],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      <Text style={styles.subText}>Finding the best professional for you...</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(13, 115, 119, 0.12)',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(13, 115, 119, 0.3)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    color: '#0D7377',
    fontSize: 15,
    fontWeight: '700',
  },
  agentsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 14,
  },
  agentDot: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  agentLabel: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0D7377',
    borderRadius: 2,
  },
  subText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    textAlign: 'center',
  },
});
