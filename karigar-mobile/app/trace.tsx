import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';

const AGENT_COLORS: any = {
  nlu: '#9B59B6',
  discovery: '#3498DB',
  ranking: '#F39C12',
  negotiation: '#0D7377',
  booking: '#2ECC71',
  recovery: '#E74C3C',
  coordinator: '#95A5A6'
};

export default function TraceScreen() {
  const router = useRouter();
  const { traceLog, theme } = useStore();
  const [expanded, setExpanded] = useState<number | null>(null);

  const isDark = theme === 'dark';
  const bg = isDark ? '#0A0A0F' : '#F8F9FA';
  const textMain = isDark ? '#fff' : '#111';
  const textSub = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF';

  const uniqueAgents = [...new Set(traceLog.map(t => t.agent))];
  const totalMs = traceLog.reduce((acc, curr) => acc + (curr.duration_ms || 0), 0);

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={textMain} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textMain }]}>Live Agent Trace</Text>
        <TouchableOpacity
          style={[styles.orchBtn, { backgroundColor: 'rgba(155,89,182,0.15)' }]}
          onPress={() => router.push('/orchestration')}
        >
          <Ionicons name="git-network-outline" size={14} color="#9B59B6" />
          <Text style={{ color: '#9B59B6', fontSize: 11, fontWeight: '700', marginLeft: 4 }}>Graph</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {traceLog.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 100 }}>
            <Ionicons name="analytics" size={60} color={textSub} />
            <Text style={{ color: textMain, fontSize: 18, marginVertical: 10 }}>No Agent Traces</Text>
            <TouchableOpacity style={styles.runBtn} onPress={() => router.push('/(tabs)')}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Send a Request</Text>
            </TouchableOpacity>
          </View>
        ) : (
          traceLog.map((step, idx) => {
            const color = AGENT_COLORS[step.agent] || '#95A5A6';
            const isExpanded = expanded === idx;
            
            return (
              <TouchableOpacity key={idx} style={[styles.card, { backgroundColor: cardBg, borderLeftColor: color, borderLeftWidth: 4 }]} onPress={() => setExpanded(isExpanded ? null : idx)}>
                 <View style={styles.cardHeader}>
                   <View style={[styles.badge, { backgroundColor: color + '20' }]}>
                     <Text style={{ color, fontSize: 12, fontWeight: 'bold' }}>{step.agent}</Text>
                   </View>
                   <Text style={{ color: textSub, fontSize: 12 }}>{step.duration_ms} ms</Text>
                 </View>
                 <Text style={{ color: textMain, marginTop: 8 }} numberOfLines={isExpanded ? undefined : 2}>{step.action}</Text>
              </TouchableOpacity>
            )
          })
        )}
      </ScrollView>

      {traceLog.length > 0 && (
         <View style={[styles.footer, { backgroundColor: cardBg, borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
            <View style={styles.stat}><Text style={{ color: '#0D7377', fontSize: 20, fontWeight: 'bold' }}>{traceLog.length}</Text><Text style={{ color: textSub, fontSize: 12 }}>Steps</Text></View>
            <View style={styles.stat}><Text style={{ color: '#F39C12', fontSize: 20, fontWeight: 'bold' }}>{uniqueAgents.length}</Text><Text style={{ color: textSub, fontSize: 12 }}>Agents</Text></View>
            <View style={styles.stat}><Text style={{ color: '#2ECC71', fontSize: 20, fontWeight: 'bold' }}>{totalMs}</Text><Text style={{ color: textSub, fontSize: 12 }}>MS</Text></View>
            <TouchableOpacity style={styles.adkBadge} onPress={() => router.push('/orchestration')}>
              <Ionicons name="hardware-chip-outline" size={13} color="#0D7377" />
              <Text style={{ color: '#0D7377', fontSize: 10, fontWeight: '700', marginLeft: 4 }}>Google ADK</Text>
            </TouchableOpacity>
         </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: 15, paddingHorizontal: 16, borderBottomWidth: 1 },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  runBtn: { backgroundColor: '#0D7377', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  card: { padding: 16, borderRadius: 8, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  footer: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', paddingVertical: 20, borderTopWidth: 1 },
  stat: { alignItems: 'center' },
  orchBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  adkBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(13,115,119,0.12)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
});
