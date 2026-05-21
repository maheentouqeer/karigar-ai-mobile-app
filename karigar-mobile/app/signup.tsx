import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '../store';
import {
  isFirebaseAuthConfigured,
  signUpWithEmail,
  syncUserProfile,
} from '../services/firebaseAuth';

export default function SignupScreen() {
  const router = useRouter();
  const { login, isAuthenticated } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'customer' | 'provider'>('customer');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // If already authenticated (e.g. store rehydrated), go to tabs
  React.useEffect(() => {
    if (isAuthenticated && !loading) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  const handleSignup = async () => {
    if (!email.trim() || !name.trim()) {
      Alert.alert('Required', 'Name and email are required.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Password', 'Use at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      let uid: string | undefined;
      if (isFirebaseAuthConfigured()) {
        const auth = await signUpWithEmail(email.trim(), password, name.trim());
        uid = auth.localId;
      } else {
        uid = `demo-${email.trim().replace(/[^a-z0-9]/gi, '-')}`;
      }

      // Set auth state immediately
      login(role, name.trim(), email.trim(), uid);

      // Sync profile in background — don't block navigation
      if (uid) {
        syncUserProfile(uid, { name: name.trim(), email: email.trim(), role }).catch(() => {});
      }

      // Navigate right away
      setLoading(false);
      router.replace('/(tabs)');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Signup failed';
      Alert.alert('Sign up failed', msg);
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join Karigar AI today</Text>

        <View style={styles.roleToggle}>
          <TouchableOpacity
            style={[styles.roleBtn, role === 'customer' && styles.roleBtnActive]}
            onPress={() => setRole('customer')}
          >
            <Text style={[styles.roleTxt, role === 'customer' && styles.roleTxtActive]}>
              Customer
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleBtn, role === 'provider' && styles.roleBtnActive]}
            onPress={() => setRole('provider')}
          >
            <Text style={[styles.roleTxt, role === 'provider' && styles.roleTxtActive]}>
              Provider
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password (min 6 chars)"
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.loginBtn, loading && { opacity: 0.7 }]}
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginBtnTxt}>Sign Up</Text>
          )}
        </TouchableOpacity>

        <View style={styles.signupRow}>
          <Text style={{ color: 'rgba(255,255,255,0.6)' }}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={{ color: '#3498DB', fontWeight: 'bold' }}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F', justifyContent: 'center' },
  content: { padding: 24, width: '100%', maxWidth: 400, alignSelf: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.6)', marginBottom: 32 },
  roleToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  roleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  roleBtnActive: { backgroundColor: '#0D7377' },
  roleTxt: { color: 'rgba(255,255,255,0.6)', fontWeight: 'bold' },
  roleTxtActive: { color: '#fff' },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#fff',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  loginBtn: { backgroundColor: '#3498DB', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  loginBtnTxt: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
});
