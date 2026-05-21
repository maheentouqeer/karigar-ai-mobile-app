import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';

function isoNow() {
  return new Date().toISOString();
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function ProviderCustomerChatScreen() {
  const router = useRouter();
  const {
    theme,
    role,
    currentBooking,
    selectedProvider,
    inAppChatMessages,
    addInAppChatMessage,
    userName,
  } = useStore();

  const isDark = theme === 'dark';
  const bg = isDark ? '#0A0A0F' : '#F8F9FA';
  const textMain = isDark ? '#fff' : '#111';
  const textSub = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)';
  const cardBg = isDark ? '#12121A' : '#fff';

  const threadId = currentBooking?.id ? `booking:${currentBooking.id}` : 'provider-chat';
  const messages = inAppChatMessages[threadId] || [];
  const [text, setText] = React.useState('');
  const [typing, setTyping] = React.useState(false);
  const scrollRef = React.useRef<ScrollView>(null);

  const me: 'customer' | 'provider' = role === 'provider' ? 'provider' : 'customer';
  const other: 'customer' | 'provider' = me === 'customer' ? 'provider' : 'customer';

  const providerName = selectedProvider?.name || currentBooking?.provider_name || 'Provider';
  const title = me === 'customer' ? providerName : (userName || 'Customer');

  React.useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length, typing]);

  const send = (msg: string) => {
    const trimmed = msg.trim();
    if (!trimmed) return;
    setText('');
    addInAppChatMessage(threadId, { from: me, text: trimmed, id: makeId('chat'), createdAt: isoNow() });

    // Simulated typing from the other side for demo UX
    setTyping(true);
    setTimeout(() => {
      const auto =
        trimmed.toLowerCase().includes('location')
          ? 'Share your exact street / house number please.'
          : trimmed.toLowerCase().includes('time')
            ? 'I will be there in 25–30 minutes. On my way.'
            : trimmed.toLowerCase().includes('price') || trimmed.toLowerCase().includes('budget')
              ? 'Understood. I can do it in the agreed price. I will confirm once I arrive.'
              : 'Got it. I’m on it.';
      addInAppChatMessage(threadId, { from: other, text: auto, id: makeId('chat'), createdAt: isoNow() });
      setTyping(false);
    }, 650);
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={textMain} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ color: textMain, fontWeight: '800', fontSize: 16 }}>{title}</Text>
          <Text style={{ color: textSub, fontSize: 11 }}>
            {currentBooking?.service_type ? currentBooking.service_type.replace('_', ' ') : 'In-app chat'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/track')} style={styles.iconBtn}>
          <Ionicons name="location" size={20} color="#0D7377" />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 && (
          <View style={[styles.infoCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff' }]}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#0D7377" />
            <Text style={{ color: textMain, marginLeft: 10, flex: 1, lineHeight: 20 }}>
              This is a two-way in-app chat for your booking. Messages are stored locally for the demo.
            </Text>
          </View>
        )}

        {messages.map((m) => {
          const mine = m.from === me;
          return (
            <View
              key={m.id}
              style={[
                styles.bubble,
                mine ? styles.bubbleMine : styles.bubbleOther,
                !mine && { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#E8ECEF' },
              ]}
            >
              <Text style={{ color: mine ? '#111' : textMain, fontSize: 15, lineHeight: 22 }}>{m.text}</Text>
              <Text style={{ color: mine ? 'rgba(0,0,0,0.45)' : textSub, fontSize: 10, marginTop: 6 }}>
                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          );
        })}

        {typing && (
          <View style={[styles.typing, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#E8ECEF' }]}>
            <Ionicons name="ellipsis-horizontal" size={18} color={textSub} />
            <Text style={{ color: textSub, marginLeft: 6, fontStyle: 'italic' }}>
              {other === 'provider' ? 'Provider is typing…' : 'Customer is typing…'}
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.inputRow, { backgroundColor: cardBg, borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}>
        <TextInput
          style={[styles.input, { color: textMain, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}
          placeholder="Message…"
          placeholderTextColor={textSub}
          value={text}
          onChangeText={setText}
          onSubmitEditing={() => send(text)}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={() => send(text)}>
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: 12, paddingHorizontal: 14, borderBottomWidth: 1 },
  iconBtn: { padding: 6, width: 36, alignItems: 'center' },
  bubble: { maxWidth: '82%', padding: 14, borderRadius: 18, marginBottom: 12 },
  bubbleMine: { alignSelf: 'flex-end', backgroundColor: '#F39C12', borderBottomRightRadius: 4 },
  bubbleOther: { alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  typing: { alignSelf: 'flex-start', padding: 10, borderRadius: 14, flexDirection: 'row', alignItems: 'center' },
  infoCard: { padding: 14, borderRadius: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  inputRow: { flexDirection: 'row', padding: 12, paddingBottom: 30, alignItems: 'center', borderTopWidth: 1 },
  input: { flex: 1, height: 44, borderRadius: 22, paddingHorizontal: 16, marginRight: 10 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#0D7377', justifyContent: 'center', alignItems: 'center' },
});

