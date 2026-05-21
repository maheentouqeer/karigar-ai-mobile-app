import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store';

export default function ChatsScreen() {
  const router = useRouter();
  const { theme, chatSessions, loadSession, startNewSession } = useStore();

  const isDark = theme === 'dark';
  const bg = isDark ? '#0A0A0F' : '#F8F9FA';
  const textMain = isDark ? '#fff' : '#111';
  const textSub = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF';

  const handleNewChat = () => {
    startNewSession();
    router.push('/chat');
  };

  const openSession = (id: string) => {
    loadSession(id);
    router.push('/chat');
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
        <Text style={[styles.headerTitle, { color: textMain }]}>AI Assistants</Text>
        <TouchableOpacity style={styles.newChatBtn} onPress={handleNewChat}>
          <Ionicons name="chatbubble-ellipses" size={16} color="#fff" style={{ marginRight: 6 }} />
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>New Chat</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={chatSessions}
        keyExtractor={s => s.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text style={{ color: textSub, textAlign: 'center', marginTop: 40 }}>No previous chats.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.chatCard, { backgroundColor: cardBg }]} onPress={() => openSession(item.id)}>
             <View style={styles.cardHeader}>
               <Text style={[styles.chatTitle, { color: textMain }]} numberOfLines={1}>{item.title}</Text>
               <Text style={[styles.dateTxt, { color: textSub }]}>{item.date}</Text>
             </View>
             <Text style={[styles.chatPreview, { color: textSub }]} numberOfLines={1}>
                {item.messages.length > 0 ? item.messages[item.messages.length - 1].content : 'Empty Chat'}
             </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingBottom: 15, paddingHorizontal: 16, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  newChatBtn: { flexDirection: 'row', backgroundColor: '#3498DB', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, alignItems: 'center' },
  chatCard: { padding: 16, borderRadius: 12, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  chatTitle: { fontSize: 16, fontWeight: 'bold', flex: 1, paddingRight: 10 },
  dateTxt: { fontSize: 12 },
  chatPreview: { fontSize: 14 }
});
