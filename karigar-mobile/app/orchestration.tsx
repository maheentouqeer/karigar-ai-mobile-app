import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';

const AGENTS = [
  {
    id: 'nlu',
    label: 'NLU Agent',
    desc: 'Parses Urdu/Roman Urdu/English. Returns service_type, location, urgency, budget, confidence score.',
    icon: 'language-outline',
    color: '#9B59B6',
    model: 'Gemini 2.5 Flash',
  },
  {
    id: 'discovery',
    label: 'Discovery Agent',
    desc: 'Queries Firestore + Google Maps. Finds providers matching service type within radius.',
    icon: 'search-outline',
    color: '#3498DB',
    model: 'Gemini 2.5 Flash',
  },
  {
    id: 'ranking',
    label: 'Ranking Agent',
    desc: '8-factor weighted scoring: specialization, on-time rate, rating, travel time, availability, cancellation, review recency, budget fit.',
    icon: 'podium-outline',
    color: '#F39C12',
    model: 'Gemini 2.5 Flash',
  },
  {
    id: 'negotiation',
    label: 'Negotiation Agent',
    desc: 'Bilingual price mediation. Uses urgency + trust score to find middle-ground. Unique to Karigar AI.',
    icon: 'git-compare-outline',
    color: '#0D7377',
    model: 'Gemini 2.5 PRO',
  },
  {
    id: 'booking',
    label: 'Booking Agent',
    desc: 'Firestore write, conflict check, slot reservation, receipt generation, WhatsApp-style notification.',
    icon: 'calendar-outline',
    color: '#2ECC71',
    model: 'Gemini 2.5 Flash',
  },
  {
    id: 'recovery',
    label: 'Recovery Agent',
    desc: 'Triggers on provider cancellation. Finds next-best provider in <10 seconds. Awards Rs 50 credit.',
    icon: 'refresh-outline',
    color: '#E74C3C',
    model: 'Gemini 2.5 Flash',
  },
  {
    id: 'dispute',
    label: 'Dispute Agent',
    desc: 'Evidence builder, refund calculator, blacklist checker, human escalation trigger.',
    icon: 'shield-outline',
    color: '#95A5A6',
    model: 'Gemini 2.5 Flash',
  },
];

const CONNECTIONS = [
  ['nlu', 'discovery'],
  ['discovery', 'ranking'],
  ['ranking', 'negotiation'],
  ['negotiation', 'booking'],
  ['booking', 'recovery'],
  ['recovery', 'dispute'],
  ['ranking', 'booking'],
];

export default function OrchestrationScreen() {
  const router = useRouter();
  const { traceLog, theme } = useStore();
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const pulseAnims = useRef(AGENTS.map(() => new Animated.Value(1))).current;
  const flowAnim = useRef(new Animated.Value(0)).current;

  const isDark = theme === 'dark';
  const bg = isDark ? '#0A0A0F' : '#F8F9FA';
  const textMain = isDark ? '#fff' : '#111';
  const textSub = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF';

  // Active agents from real trace
  const activeFromTrace = new Set(traceLog.map((t) => t.agent));

  useEffect(() => {
    // Pulse each agent node
    pulseAnims.forEach((anim, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 180),
          Animated.timing(anim, { toValue: 1.08, duration: 600, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    });

    Animated.loop(
      Animated.timing(flowAnim, { toValue: 1, duration: 3000, useNativeDriver: false })
    ).start();
  }, []);

  const selectedAgent = AGENTS.find((a) => a.id === activeAgent);

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={textMain} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: textMain }]}>Agent Orchestration</Text>
          <Text style={{ color: textSub, fontSize: 11 }}>7 agents • Google ADK • A2A Protocol</Text>
        </View>
        <View style={styles.swarmBadge}>
          <Ionicons name="git-network" size={13} color="#9B59B6" />
          <Text style={styles.swarmTxt}>AI Swarm</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>

        {/* Info banner */}
        <View style={[styles.infoBanner, { backgroundColor: isDark ? 'rgba(155,89,182,0.12)' : 'rgba(155,89,182,0.08)', borderColor: 'rgba(155,89,182,0.3)' }]}>
          <Ionicons name="hardware-chip-outline" size={16} color="#9B59B6" />
          <Text style={{ color: isDark ? '#D7AEFB' : '#6C3483', fontSize: 13, marginLeft: 8, flex: 1, lineHeight: 18 }}>
            All agents run on Google ADK with A2A (Agent-to-Agent) protocol. Tap any agent to see its role.
          </Text>
        </View>

        {/* Agent nodes — vertical pipeline */}
        <Text style={[styles.sectionLabel, { color: textSub }]}>AGENT PIPELINE</Text>
        {AGENTS.map((agent, idx) => {
          const isActive = activeFromTrace.has(agent.id);
          const isSelected = activeAgent === agent.id;
          const anim = pulseAnims[idx];
          const traceStep = traceLog.find((t) => t.agent === agent.id);

          return (
            <View key={agent.id}>
              <TouchableOpacity
                onPress={() => setActiveAgent(isSelected ? null : agent.id)}
                activeOpacity={0.85}
              >
                <Animated.View
                  style={[
                    styles.agentNode,
                    {
                      backgroundColor: cardBg,
                      borderColor: isSelected
                        ? agent.color
                        : isActive
                        ? agent.color + '60'
                        : 'rgba(150,150,150,0.12)',
                      borderWidth: isSelected ? 2 : 1,
                      transform: [{ scale: isActive ? anim : new Animated.Value(1) }],
                    },
                  ]}
                >
                  <View style={[styles.agentIconBg, { backgroundColor: agent.color + '20' }]}>
                    <Ionicons name={agent.icon as any} size={22} color={agent.color} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ color: textMain, fontWeight: '700', fontSize: 15 }}>{agent.label}</Text>
                      {isActive && (
                        <View style={[styles.activeBadge, { backgroundColor: agent.color + '20' }]}>
                          <View style={[styles.activeDot, { backgroundColor: agent.color }]} />
                          <Text style={{ color: agent.color, fontSize: 10, fontWeight: '700' }}>ACTIVE</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ color: textSub, fontSize: 12, marginTop: 2 }}>{agent.model}</Text>
                    {traceStep && (
                      <Text style={{ color: agent.color, fontSize: 11, marginTop: 3 }} numberOfLines={1}>
                        ✓ {traceStep.action} · {traceStep.duration_ms}ms
                      </Text>
                    )}
                  </View>
                  <Ionicons
                    name={isSelected ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={textSub}
                  />
                </Animated.View>
              </TouchableOpacity>

              {/* Expanded detail */}
              {isSelected && (
                <View style={[styles.agentDetail, { backgroundColor: agent.color + '12', borderColor: agent.color + '40' }]}>
                  <Text style={{ color: textMain, fontSize: 14, lineHeight: 20 }}>{agent.desc}</Text>
                  {agent.id === 'negotiation' && (
                    <View style={[styles.uniqueBadge, { borderColor: '#F39C12', backgroundColor: 'rgba(243,156,18,0.1)' }]}>
                      <Ionicons name="star" size={12} color="#F39C12" />
                      <Text style={{ color: '#F39C12', fontSize: 12, fontWeight: '700', marginLeft: 4 }}>
                        Unique Feature — No other app in Pakistan does this
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Arrow connector */}
              {idx < AGENTS.length - 1 && (
                <View style={styles.connector}>
                  <View style={[styles.connectorLine, { backgroundColor: AGENTS[idx].color + '40' }]} />
                  <Ionicons name="chevron-down" size={14} color={AGENTS[idx].color + '80'} />
                </View>
              )}
            </View>
          );
        })}

        {/* A2A Protocol explanation */}
        <Text style={[styles.sectionLabel, { color: textSub, marginTop: 24 }]}>A2A PROTOCOL</Text>
        <View style={[styles.a2aCard, { backgroundColor: cardBg }]}>
          {[
            { from: 'NLU', to: 'Discovery', msg: 'service_type=AC_repair, location=G-13, budget=500' },
            { from: 'Discovery', to: 'Ranking', msg: '5 providers found in 2.1km radius' },
            { from: 'Ranking', to: 'Negotiation', msg: 'Top pick: Ali AC Services, score=94' },
            { from: 'Negotiation', to: 'Booking', msg: 'agreed_price=650, slot=6PM, status=confirmed' },
            { from: 'Booking', to: 'Recovery', msg: 'booking_id=KAI-001, provider_id=ac1' },
          ].map((msg, i) => (
            <View key={i} style={[styles.a2aRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Text style={[styles.a2aAgent, { backgroundColor: '#0D737725', color: '#0D7377' }]}>{msg.from}</Text>
                <Ionicons name="arrow-forward" size={12} color={textSub} />
                <Text style={[styles.a2aAgent, { backgroundColor: '#3498DB25', color: '#3498DB' }]}>{msg.to}</Text>
              </View>
              <Text style={{ color: textSub, fontSize: 12, fontFamily: 'monospace' }}>{msg.msg}</Text>
            </View>
          ))}
        </View>

        {/* Live trace summary if available */}
        {traceLog.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: textSub, marginTop: 24 }]}>LAST RUN TRACE</Text>
            <View style={[styles.a2aCard, { backgroundColor: cardBg }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ color: textMain, fontWeight: '700' }}>Live Agent Execution</Text>
                <TouchableOpacity onPress={() => router.push('/trace')}>
                  <Text style={{ color: '#0D7377', fontWeight: '600', fontSize: 13 }}>Full Trace →</Text>
                </TouchableOpacity>
              </View>
              {traceLog.slice(0, 4).map((step, i) => (
                <View key={i} style={[styles.a2aRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[styles.a2aAgent, { backgroundColor: (AGENTS.find(a => a.id === step.agent)?.color || '#888') + '25', color: AGENTS.find(a => a.id === step.agent)?.color || '#888' }]}>{step.agent}</Text>
                    <Text style={{ color: textMain, fontSize: 13, flex: 1 }} numberOfLines={1}>{step.action}</Text>
                    <Text style={{ color: textSub, fontSize: 11 }}>{step.duration_ms}ms</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Scoring weights */}
        <Text style={[styles.sectionLabel, { color: textSub, marginTop: 24 }]}>8-FACTOR MATCHING WEIGHTS</Text>
        <View style={[styles.a2aCard, { backgroundColor: cardBg }]}>
          {[
            { label: 'Specialization Match', weight: 25, color: '#9B59B6' },
            { label: 'On-Time Rate', weight: 20, color: '#3498DB' },
            { label: 'Rating Score', weight: 15, color: '#F39C12' },
            { label: 'Travel Time Score', weight: 15, color: '#2ECC71' },
            { label: 'Availability Score', weight: 10, color: '#1ABC9C' },
            { label: 'Cancellation Penalty', weight: 10, color: '#E74C3C' },
            { label: 'Review Recency', weight: 3, color: '#95A5A6' },
            { label: 'Budget Fit Score', weight: 2, color: '#27AE60' },
          ].map((f) => (
            <View key={f.label} style={[styles.weightRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
              <Text style={{ color: textMain, fontSize: 13, width: 170 }}>{f.label}</Text>
              <View style={styles.weightBarBg}>
                <View style={[styles.weightBarFill, { width: `${f.weight * 4}%`, backgroundColor: f.color }]} />
              </View>
              <Text style={{ color: f.color, fontSize: 12, fontWeight: '700', width: 32, textAlign: 'right' }}>{f.weight}%</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 50, paddingBottom: 15, paddingHorizontal: 16, borderBottomWidth: 1, gap: 10,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: 'bold' },
  swarmBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(155,89,182,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16,
  },
  swarmTxt: { color: '#9B59B6', fontSize: 11, fontWeight: '700' },
  infoBanner: {
    flexDirection: 'row', alignItems: 'flex-start', padding: 12,
    borderRadius: 12, borderWidth: 1, marginBottom: 20,
  },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.1, marginBottom: 10 },
  agentNode: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderRadius: 14, marginBottom: 0,
  },
  agentIconBg: {
    width: 46, height: 46, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  activeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8,
  },
  activeDot: { width: 6, height: 6, borderRadius: 3 },
  agentDetail: {
    padding: 14, borderRadius: 12, marginTop: 2,
    borderWidth: 1, marginBottom: 2,
  },
  uniqueBadge: {
    flexDirection: 'row', alignItems: 'center',
    padding: 8, borderRadius: 8, borderWidth: 1, marginTop: 10,
  },
  connector: { alignItems: 'center', marginVertical: 4 },
  connectorLine: { width: 2, height: 12 },
  a2aCard: { borderRadius: 14, overflow: 'hidden', marginBottom: 4 },
  a2aRow: { padding: 12, borderBottomWidth: 1 },
  a2aAgent: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, fontSize: 11, fontWeight: '700' },
  weightRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 10, borderBottomWidth: 1, gap: 8,
  },
  weightBarBg: {
    flex: 1, height: 6, backgroundColor: 'rgba(150,150,150,0.15)',
    borderRadius: 3, overflow: 'hidden',
  },
  weightBarFill: { height: '100%', borderRadius: 3 },
});
