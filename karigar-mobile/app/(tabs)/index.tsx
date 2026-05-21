import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Modal, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store';
import { sendRequest } from '../../services/api';
import { getSmartReminder } from '../../services/historyHints';

const CATEGORIES = [
  { id: 'freelancer', name: 'Freelancing', icon: 'laptop-outline', color: '#8E44AD' },
  { id: 'driver', name: 'Drivers', icon: 'car-outline', color: '#F39C12' },
  { id: 'tutoring', name: 'Tutors', icon: 'book-outline', color: '#2ECC71' },
  { id: 'home_cleaning', name: 'Cleaning', icon: 'home-outline', color: '#16A085' },
  { id: 'AC_repair', name: 'AC Repair', icon: 'snow-outline', color: '#3498DB' },
  { id: 'plumbing', name: 'Plumbing', icon: 'water-outline', color: '#34495E' },
  { id: 'electrical', name: 'Electrical', icon: 'flash-outline', color: '#E74C3C' },
  { id: 'mechanic', name: 'Mechanic', icon: 'build-outline', color: '#7F8C8D' },
  { id: 'beautician', name: 'Beauty', icon: 'sparkles-outline', color: '#E91E63' },
  { id: 'carpenter', name: 'Carpenter', icon: 'hammer-outline', color: '#D35400' },
  { id: 'painter', name: 'Painter', icon: 'color-fill-outline', color: '#9B59B6' },
  { id: 'cook', name: 'Cook/Chef', icon: 'restaurant-outline', color: '#C0392B' },
  { id: 'security', name: 'Security', icon: 'shield-checkmark-outline', color: '#2C3E50' },
  { id: 'gardener', name: 'Gardener', icon: 'leaf-outline', color: '#27AE60' },
  { id: 'tailor', name: 'Tailor', icon: 'cut-outline', color: '#E67E22' },
  { id: 'general', name: 'Others', icon: 'ellipsis-horizontal-outline', color: '#95A5A6' },
];

const CATEGORY_MESSAGES: Record<string, string> = {
  freelancer: 'Mujhe freelancer chahiye website ya logo ke liye, budget 3000',
  driver: 'Mujhe driver chahiye aaj shaam 6 baje tak',
  tutoring: 'Mujhe O Level Math ka home tutor chahiye G-13 mein, budget 6000',
  home_cleaning: 'Ghar ki safai chahiye kal dopahar',
  AC_repair: 'AC thand nahi kar raha urgent G-13 budget 500',
  plumbing: 'Pipe leak ho gaya urgent plumber chahiye',
  electrical: 'Bijli ki wiring problem hai G-9',
  mechanic: 'Gari start nahi ho rahi mechanic chahiye',
  beautician: 'Ghar par bridal makeup chahiye',
  carpenter: 'Furniture repair carpenter chahiye',
  painter: 'Kamre ka paint karwana hai',
  cook: 'Ghar par daawat ke liye cook chahiye',
  security: 'Raat ki security guard chahiye',
  gardener: 'Garden ki safai aur grass cut chahiye',
  tailor: 'Suit silwana hai jaldi',
  general: 'Mujhe local professional chahiye ghar par kaam ke liye',
};

export default function HomeScreen() {
  const router = useRouter();
  const {
    addMessage, setResponse, setLoading, isLoading, sessionId, userId, setProviders,
    theme, setPendingServiceType, serviceHistory, recordServiceHistory, startNewSession,
  } = useStore();
  const [text, setText] = useState('');
  const [demoVisible, setDemoVisible] = useState(false);
  const { role, userName } = useStore();

  React.useEffect(() => {
    if (role === 'provider') {
      router.replace('/provider-home');
    }
  }, [role]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
  const displayGreeting = `${greeting}, ${userName || 'Guest'}`;

  const isDark = theme === 'dark';
  const bg = isDark ? '#0A0A0F' : '#F8F9FA';
  const textMain = isDark ? '#fff' : '#111';
  const textSub = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : '#fff';

  async function handleSend(message: string) {
    if (!message.trim()) return;
    addMessage('user', message);
    setText('');
    setLoading(true);
    setDemoVisible(false);
    router.push('/chat');

    const serviceHint = Object.keys(CATEGORY_MESSAGES).find((k) => message === CATEGORY_MESSAGES[k]) || undefined;
    if (serviceHint) setPendingServiceType(serviceHint);

    try {
      const result = await sendRequest(message, sessionId, userId, undefined, { serviceTypeHint: serviceHint });
      setResponse(result);
      if (result.service_type) {
        setPendingServiceType(result.service_type);
        recordServiceHistory(result.service_type);
      }
      if (result.providers) setProviders(result.providers);
      if (result.needs_clarification) {
        addMessage('ai', result.clarification_question_urdu || result.clarification_question_en || result.response_en || 'More details?');
      } else {
        addMessage('ai', result.response_en || result.response_urdu || 'Found results!');
      }
    } catch (e) {
      addMessage('ai', 'Connection error. Check Wi‑Fi and backend at your LAN IP.');
    } finally {
      setLoading(false);
    }
  }

  const handleCategory = (catId: string) => {
    const msg = CATEGORY_MESSAGES[catId] || `I need ${catId} service near me`;
    // Phase 2: category tap should start a NEW session and prefill chat input (no auto-send)
    startNewSession();
    setPendingServiceType(catId === 'general' ? null : catId);
    router.push({
      pathname: '/chat',
      params: { prefill: msg, serviceType: catId === 'general' ? '' : catId },
    });
  };

  
  const predictiveProps = getSmartReminder(serviceHistory);

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Pressable delayLongPress={3000} onLongPress={() => setDemoVisible(true)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.greeting, { color: textSub }]}>{displayGreeting}</Text>
                <Text style={[styles.title, { color: textMain }]}>What do you need help with?</Text>
              </View>
              <View style={styles.swarmBadge}>
                <Ionicons name="git-network" size={14} color="#9B59B6" />
                <Text style={styles.swarmTxt}>AI Swarm</Text>
              </View>
            </View>
          </Pressable>
        </View>

        {serviceHistory.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: textMain, marginTop: 0 }]}>Book Again</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {serviceHistory.slice(0, 5).map((sid) => {
                const cat = CATEGORIES.find((c) => c.id === sid) || { name: sid.replace('_', ' '), icon: 'refresh', color: '#0D7377' };
                return (
                  <TouchableOpacity
                    key={sid}
                    style={[styles.historyChip, { backgroundColor: cardBg }]}
                    onPress={() => handleCategory(sid)}
                  >
                    <Ionicons name={cat.icon as any} size={16} color={cat.color || '#0D7377'} />
                    <Text style={{ color: textMain, fontSize: 12, marginLeft: 6, fontWeight: '600' }}>{cat.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* Predictive AI Card */}
        <TouchableOpacity style={[styles.predictiveCard, { backgroundColor: cardBg, borderColor: predictiveProps.color }]} onPress={() => handleSend(predictiveProps.query)}>
          <View style={styles.predictiveHeader}>
            <Ionicons name={predictiveProps.icon as any} size={20} color={predictiveProps.color} />
            <Text style={[styles.predictiveTitle, { color: predictiveProps.color }]}>{predictiveProps.title}</Text>
          </View>
          <Text style={[styles.predictiveText, { color: textSub }]}>
            {predictiveProps.desc}
            {predictiveProps.source === 'history' ? ' (based on your history)' : ''}
          </Text>
          <View style={[styles.predictiveBtn, { backgroundColor: predictiveProps.color }]}>
            <Text style={styles.predictiveBtnText}>{predictiveProps.btn}</Text>
          </View>
        </TouchableOpacity>

        {/* Categories */}
        <Text style={[styles.sectionTitle, { color: textMain }]}>Services</Text>
        <View style={styles.grid}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity key={cat.id} style={[styles.catCard, { backgroundColor: cardBg }]} onPress={() => handleCategory(cat.id)}>
              <View style={[styles.iconCircle, { backgroundColor: cat.color + '20' }]}>
                <Ionicons name={cat.icon as any} size={24} color={cat.color} />
              </View>
              <Text style={[styles.catText, { color: textMain }]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading && (
           <ActivityIndicator size="large" color="#0D7377" style={{ marginTop: 20 }} />
        )}
      </ScrollView>

      {/* Bottom Search Bar */}
      <View style={[styles.bottomBar, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', backgroundColor: isDark ? '#12121A' : '#ffffff' }]}>
        <TextInput
          style={[styles.input, { color: textMain, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}
          placeholder="Describe what you need..."
          placeholderTextColor={textSub}
          value={text}
          onChangeText={setText}
          onSubmitEditing={() => handleSend(text)}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={() => handleSend(text)}>
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Demo Mode Modal */}
      <Modal visible={demoVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: isDark ? '#1E1E24' : '#fff' }]}>
            <Text style={[styles.modalTitle, { color: textMain }]}>🛠 Demo Scenarios</Text>
            
            <TouchableOpacity style={styles.demoBtn} onPress={() => handleSend('AC bilkul thand nahi, urgent hai, budget 500, G-13')}>
              <Text style={styles.demoBtnText}>1. Happy Path (AC + Negotiation)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.demoBtn} onPress={() => { setDemoVisible(false); router.push('/recovery'); }}>
              <Text style={styles.demoBtnText}>2. Provider Cancels → Recovery</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.demoBtn} onPress={() => handleSend('bijli ki problem hai')}>
              <Text style={styles.demoBtnText}>3. Ambiguous (needs location)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.demoBtn} onPress={() => handleSend('plumber chahiye abhi 2 AM rural area')}>
              <Text style={styles.demoBtnText}>4. No Provider → Waitlist</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.demoBtn} onPress={() => { setDemoVisible(false); router.push('/(tabs)/bookings'); }}>
              <Text style={styles.demoBtnText}>5. Dispute (from Bookings tab)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.demoBtn, { backgroundColor: '#E74C3C', marginTop: 20 }]} onPress={() => setDemoVisible(false)}>
              <Text style={styles.demoBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingTop: 60, paddingBottom: 100 },
  header: { marginBottom: 24 },
  greeting: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  title: { fontSize: 24, fontWeight: '800' },
  predictiveCard: { borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#F39C12' },
  predictiveHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  predictiveTitle: { color: '#F39C12', fontSize: 16, fontWeight: '700', marginLeft: 8 },
  predictiveText: { fontSize: 14, marginBottom: 12 },
  predictiveBtn: { backgroundColor: '#F39C12', alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  predictiveBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  catCard: { width: '31%', aspectRatio: 0.9, borderRadius: 16, padding: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  iconCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  catText: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  bottomBar: { flexDirection: 'row', padding: 12, paddingBottom: 30, position: 'absolute', bottom: 0, width: '100%', borderTopWidth: 1 },
  input: { flex: 1, height: 44, borderRadius: 22, paddingHorizontal: 16 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#3498DB', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalCard: { borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 20 },
  demoBtn: { backgroundColor: '#0D7377', padding: 14, borderRadius: 12, marginBottom: 10, alignItems: 'center' },
  demoBtnText: { color: '#fff', fontWeight: 'bold' },
  swarmBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(155,89,182,0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, marginLeft: 8 },
  swarmTxt: { color: '#9B59B6', fontSize: 11, fontWeight: '700' },
  historyChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, marginRight: 10 },
});
