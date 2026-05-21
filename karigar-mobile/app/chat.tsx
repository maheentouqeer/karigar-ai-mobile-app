import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { detectLanguage, sendRequest } from '../services/api';
import * as Location from 'expo-location';
import AgentThinkingCard from '../components/AgentThinkingCard';

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; prefill?: string; serviceType?: string }>();
  const scrollRef = useRef<ScrollView>(null);
  const {
    messages, isLoading, addMessage, setResponse, setLoading,
    currentResponse, sessionId, userId, setProviders, theme, saveCurrentSession,
    role, pendingServiceType, serviceHistory, bookingHistory, getUserContext,
  } = useStore();
  const [inputText, setInputText] = useState('');
  const prefillApplied = useRef(false);

  const isDark = theme === 'dark';
  const bg = isDark ? '#0A0A0F' : '#F8F9FA';
  const textMain = isDark ? '#fff' : '#111';
  const textSub = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, isLoading]);

  // Prefill input from Home category tap (no auto-send)
  useEffect(() => {
    if (prefillApplied.current) return;
    const p = typeof params.prefill === 'string' ? params.prefill : '';
    if (p.trim()) {
      prefillApplied.current = true;
      setInputText(p);
    }
  }, [params.prefill]);

  // Auto-start voice removed
  
  // Auto-greet if new session
  useEffect(() => {
    if (messages.length === 0 && !isLoading && !prefillApplied.current) {
       setLoading(true);
       const ctx = getUserContext();
       sendRequest('Hi', sessionId, userId, undefined, { userContext: ctx })
         .then(res => {
           setResponse(res);
           const reply = res.response_en || res.response_urdu || 'Hello!';
           addMessage('ai', reply);
         })
         .finally(() => setLoading(false));
    }
  }, []);

  const isProvider = role === 'provider';

  function buildAppendContext(): string {
    const recentServices = (serviceHistory || []).slice(0, 3).join(', ');
    const lastBooking = (bookingHistory || [])[0];
    const lastBookingCtx = lastBooking
      ? `Last booking: ${lastBooking.service_type || 'service'} at ${lastBooking.slot_time || 'ASAP'} (status: ${lastBooking.status || 'n/a'}).`
      : '';
    const serviceCtx = recentServices ? `Recent services: ${recentServices}.` : '';
    const langCtx = "IMPORTANT: If user speaks Roman Urdu (English letters but Urdu language), ALWAYS reply in Roman Urdu. NEVER use Urdu script unless requested.";
    return [serviceCtx, lastBookingCtx, langCtx].filter(Boolean).join('\n');
  }

  async function handleSendText(text: string) {
    const msg = text.trim();
    if (!msg) return;

    setInputText('');
    addMessage('user', msg);
    setLoading(true);
    let locationData: { latitude: number; longitude: number } | undefined;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        locationData = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      }
    } catch { /* location optional */ }

    try {
      const lang = detectLanguage(msg);
      const hinted =
        (typeof params.serviceType === 'string' && params.serviceType.trim())
          ? params.serviceType.trim()
          : pendingServiceType || undefined;
      const appendContext = buildAppendContext();
      const userContext = getUserContext();

      const result = await sendRequest(msg, sessionId, userId, locationData, { 
        serviceTypeHint: hinted, 
        appendContext,
        userContext,
        role: role as 'customer' | 'provider'
      });
      setResponse(result);
      if (result.providers?.length) setProviders(result.providers);
      
      const replyBody = lang === 'urdu'
          ? (result.response_urdu || result.response_en)
          : (result.response_en || result.response_urdu);

      if (result.needs_clarification) {
        const clarify =
          lang === 'urdu'
            ? (result.clarification_question_urdu || result.clarification_question_en)
            : (result.clarification_question_en || result.clarification_question_urdu);
        addMessage('ai', clarify || replyBody || 'Please provide more details.');
      } else {
        addMessage('ai', replyBody || 'Request processed!');
      }
      saveCurrentSession();
    } catch (e: any) {
      addMessage('ai', `⚠️ Backend unreachable (${e?.message || 'network error'}). Make sure your phone and laptop are on the same WiFi and the backend is running.`);
      saveCurrentSession();
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    await handleSendText(inputText);
  }



  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color={textMain} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.headerTitle, { color: textMain }]}>Karigar Assistant</Text>
          {params.mode === 'provider' && (
            <Text style={{ color: '#F39C12', fontSize: 11, fontWeight: '600' }}>Chatting with provider</Text>
          )}
        </View>
        <TouchableOpacity onPress={() => router.push('/trace')} style={styles.iconBtn}>
          <Ionicons name="analytics-outline" size={22} color={textMain} />
        </TouchableOpacity>
      </View>

      {/* Chat Area */}
      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {messages.length === 0 && !isLoading && (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Ionicons name="chatbubbles-outline" size={48} color={textSub} />
            <Text style={{ color: textSub, marginTop: 12, fontSize: 14, textAlign: 'center' }}>
              Describe your service need in Urdu, Roman Urdu, or English.{'\n'}e.g. "AC thand nahi, G-13, budget 500"
            </Text>
          </View>
        )}

        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <View key={idx} style={[styles.bubble, isUser ? styles.userBubble : [styles.aiBubble, { backgroundColor: isDark ? '#1A1A24' : '#E8ECEF' }]]}>
              <Text style={[styles.msgText, { color: isUser ? '#111' : textMain }]}>{msg.content}</Text>
            </View>
          );
        })}

        {isLoading && <AgentThinkingCard />}



        {/* Clarification banner removed (redundant with AI message) */}

        {/* Action card after AI responds */}
        {!isLoading && messages.length > 0 && messages[messages.length - 1].role === 'ai' && currentResponse && !currentResponse.needs_clarification && (
          <View style={[styles.aiCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff' }]}>
            <View style={styles.chipRow}>
              {currentResponse.service_type && (
                <View style={[styles.chip, { backgroundColor: '#3498DB20' }]}>
                  <Text style={{ color: '#3498DB', fontSize: 12, fontWeight: '600' }}>{currentResponse.service_type.replace('_', ' ')}</Text>
                </View>
              )}
              {currentResponse.location && (
                <View style={[styles.chip, { backgroundColor: '#2ECC7120' }]}>
                  <Text style={{ color: '#2ECC71', fontSize: 12, fontWeight: '600' }}>{currentResponse.location}</Text>
                </View>
              )}
              {currentResponse.urgency && (
                <View style={[styles.chip, { backgroundColor: '#E74C3C20' }]}>
                  <Text style={{ color: '#E74C3C', fontSize: 12, fontWeight: '600' }}>Urgency {currentResponse.urgency}/5</Text>
                </View>
              )}
              {currentResponse.budget && (
                <View style={[styles.chip, { backgroundColor: '#9B59B620' }]}>
                  <Text style={{ color: '#9B59B6', fontSize: 12, fontWeight: '600' }}>Rs {currentResponse.budget}</Text>
                </View>
              )}
            </View>

            {currentResponse.confidence && (
              <View style={styles.confidenceRow}>
                <View style={styles.confidenceBar}>
                  <View style={[styles.confidenceFill, {
                    width: `${Math.round(currentResponse.confidence * 100)}%`,
                    backgroundColor: currentResponse.confidence > 0.8 ? '#2ECC71' : currentResponse.confidence > 0.6 ? '#F39C12' : '#E74C3C',
                  }]} />
                </View>
                <Text style={styles.confidenceBadge}>
                  {(currentResponse.confidence * 100).toFixed(0)}% NLU confidence
                </Text>
              </View>
            )}

            <View style={styles.actionBtns}>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/providers')}>
                <Ionicons name="people-outline" size={16} color="#fff" />
                <Text style={styles.primaryBtnText}>View Providers ({currentResponse.providers?.length ?? 0})</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/trace')}>
                <Ionicons name="analytics-outline" size={16} color="#0D7377" />
                <Text style={styles.secondaryBtnText}>Agent Trace</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input Bar */}
      <View style={[styles.inputContainer, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', backgroundColor: isDark ? '#12121A' : '#ffffff' }]}>
        <TextInput
          style={[styles.input, { color: textMain, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}
          placeholder={'Type your request...'}
          placeholderTextColor={textSub}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleSend}
          editable={!isProvider}
        />
        <TouchableOpacity style={[styles.sendBtn, isProvider && { opacity: 0.5 }]} onPress={handleSend} disabled={isProvider}>
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: 15, paddingHorizontal: 16, borderBottomWidth: 1 },
  iconBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  scroll: { flex: 1 },
  bubble: { maxWidth: '80%', padding: 14, borderRadius: 18, marginBottom: 12 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#F39C12', borderBottomRightRadius: 4 },
  aiBubble: { alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  msgText: { fontSize: 15, lineHeight: 22 },
  clarifyCard: { borderRadius: 14, padding: 14, borderWidth: 1, marginBottom: 12 },
  aiCard: { marginTop: 4, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(150,150,150,0.1)' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  confidenceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  confidenceBar: { flex: 1, height: 4, backgroundColor: 'rgba(150,150,150,0.2)', borderRadius: 2, overflow: 'hidden' },
  confidenceFill: { height: '100%', borderRadius: 2 },
  confidenceBadge: { color: '#888', fontSize: 12, fontStyle: 'italic' },
  actionBtns: { flexDirection: 'row', gap: 10 },
  primaryBtn: { flex: 1, backgroundColor: '#0D7377', padding: 12, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  primaryBtnText: { color: '#fff', fontWeight: 'bold' },
  secondaryBtn: { flex: 1, backgroundColor: 'rgba(13,115,119,0.1)', borderWidth: 1, borderColor: '#0D7377', padding: 12, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  secondaryBtnText: { color: '#0D7377', fontWeight: 'bold' },
  inputContainer: { flexDirection: 'row', padding: 12, paddingBottom: 30, alignItems: 'center', borderTopWidth: 1 },
  input: { flex: 1, height: 44, borderRadius: 22, paddingHorizontal: 16, marginRight: 10 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#3498DB', justifyContent: 'center', alignItems: 'center' },
});
