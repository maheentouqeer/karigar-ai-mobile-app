import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store';

export default function ProfileScreen() {
  const router = useRouter();
  const {
    theme, setTheme, userName, userEmail, userAddress,
    setUserName, setUserEmail, setUserAddress,
    role, notificationsEnabled, setNotificationsEnabled, logout,
  } = useStore();
  const [lang, setLang] = useState('English');
  const [isEditing, setIsEditing] = useState(false);

  const isDark = theme === 'dark';
  const bg = isDark ? '#0A0A0F' : '#F8F9FA';
  const textMain = isDark ? '#fff' : '#111';
  const textSub = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF';

  const ActionRow = ({ title, value, onPress, isSwitch, switchVal, onSwitch }: any) => (
    <TouchableOpacity style={[styles.row, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} onPress={onPress} disabled={isSwitch}>
      <Text style={[styles.rowTitle, { color: textMain }]}>{title}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {value && <Text style={{ color: textSub, marginRight: 10 }}>{value}</Text>}
        {isSwitch ? (
          <Switch value={switchVal} onValueChange={onSwitch} />
        ) : (
          <Ionicons name="chevron-forward" size={20} color={textSub} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
        <Text style={[styles.headerTitle, { color: textMain }]}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={[styles.profileCard, { flexDirection: 'column', alignItems: 'flex-start' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.avatar}><Text style={styles.avatarTxt}>{userName.substring(0, 2).toUpperCase()}</Text></View>
              <View style={{ marginLeft: 16 }}>
                {!isEditing ? (
                  <>
                    <Text style={[styles.name, { color: textMain }]}>{userName || 'No Name'}</Text>
                    <Text style={{ color: textSub }}>{userEmail || 'No Email'}</Text>
                  </>
                ) : (
                  <View style={{ flex: 1 }}>
                    <TextInput
                      style={[styles.input, { color: textMain, borderColor: textSub }]}
                      value={userName}
                      onChangeText={setUserName}
                      placeholder="Name"
                      placeholderTextColor={textSub}
                    />
                    <TextInput
                      style={[styles.input, { color: textMain, borderColor: textSub, marginTop: 4 }]}
                      value={userEmail}
                      onChangeText={setUserEmail}
                      placeholder="Email"
                      keyboardType="email-address"
                      placeholderTextColor={textSub}
                    />
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={{ padding: 8 }}>
              <Ionicons name={isEditing ? "checkmark" : "pencil"} size={24} color={isDark ? '#0D7377' : '#14A098'} />
            </TouchableOpacity>
          </View>
          
          {isEditing && (
            <View style={{ marginTop: 16, width: '100%' }}>
              <Text style={{ color: textSub, marginBottom: 4 }}>Home Address:</Text>
              <TextInput
                style={[styles.input, { color: textMain, borderColor: textSub, width: '100%' }]}
                value={userAddress}
                onChangeText={setUserAddress}
                placeholder="e.g. House 12, Street 4, G-13/1, Islamabad"
                placeholderTextColor={textSub}
              />
            </View>
          )}
          {!isEditing && userAddress ? (
             <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="location" size={16} color={textSub} style={{ marginRight: 4 }} />
                <Text style={{ color: textSub }}>{userAddress}</Text>
             </View>
          ) : null}
        </View>

        <Text style={[styles.sectionTitle, { color: textSub }]}>PREFERENCES</Text>
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <ActionRow title="Theme" value={isDark ? "Dark" : "Light"} isSwitch switchVal={isDark} onSwitch={() => setTheme(isDark ? 'light' : 'dark')} />
          <ActionRow title="Language" value={lang} onPress={() => setLang(lang === 'English' ? 'Urdu' : 'English')} />
          <ActionRow title="Notifications" isSwitch switchVal={notificationsEnabled} onSwitch={setNotificationsEnabled} />
        </View>

        <Text style={[styles.sectionTitle, { color: textSub, marginTop: 24 }]}>ACCOUNT</Text>
        <View style={[styles.card, { backgroundColor: cardBg }]}>
           <ActionRow title="My Bookings" onPress={() => router.push('/(tabs)/bookings')} />
           <ActionRow title="Help & Support" onPress={() => Alert.alert('Support', 'Email us at support@karigar.ai')} />
           <ActionRow title="About Karigar AI" onPress={() => Alert.alert('Karigar AI', 'Version 1.0.0 (Expo Prototype)')} />
        </View>

        <Text style={[styles.sectionTitle, { color: textSub, marginTop: 24 }]}>DEVELOPER TOOLS</Text>
        <View style={[styles.card, { backgroundColor: cardBg }]}>
           <ActionRow title="Account Type" value={role === 'provider' ? 'Provider' : 'Customer'} onPress={() => Alert.alert('Role', `Signed in as ${role || 'customer'}. Log out and sign in again to switch.`)} />
           <ActionRow title="Agent Orchestration" onPress={() => router.push('/orchestration')} />
           <ActionRow title="View Agent Trace Logic" onPress={() => router.push('/trace')} />
           <ActionRow title="Demo Scenarios" onPress={() => { router.push('/(tabs)'); Alert.alert('Demo', 'Long press the greeting on Home for 5 scenarios'); }} />
           <ActionRow title="Log Out" onPress={() => { logout(); router.replace('/login'); }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingBottom: 15, paddingHorizontal: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  profileCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#0D7377', justifyContent: 'center', alignItems: 'center' },
  avatarTxt: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  name: { fontSize: 20, fontWeight: 'bold' },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 10, letterSpacing: 1 },
  card: { borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  rowTitle: { fontSize: 16 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 16, minWidth: 200 }
});
