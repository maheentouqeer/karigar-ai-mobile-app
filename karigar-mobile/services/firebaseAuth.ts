/**
 * Firebase Auth via Identity Toolkit REST API (no native Firebase SDK required).
 * Set EXPO_PUBLIC_FIREBASE_API_KEY in karigar-mobile/.env
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_STORAGE_KEY = 'karigar-firebase-auth';

const API_KEY = process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '';
const BASE = 'https://identitytoolkit.googleapis.com/v1';

export function isFirebaseAuthConfigured(): boolean {
  return API_KEY.length > 10;
}

interface AuthResponse {
  idToken: string;
  refreshToken: string;
  localId: string;
  email?: string;
  displayName?: string;
}

async function authRequest(
  endpoint: string,
  body: Record<string, string>
): Promise<AuthResponse> {
  if (!isFirebaseAuthConfigured()) {
    throw new Error('Firebase Auth not configured. Add EXPO_PUBLIC_FIREBASE_API_KEY to .env');
  }
  const res = await fetch(`${BASE}/${endpoint}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data?.error?.message || 'Authentication failed';
    throw new Error(msg.replace(/_/g, ' '));
  }
  return data;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string
): Promise<AuthResponse> {
  const result = await authRequest('accounts:signUp', {
    email,
    password,
    returnSecureToken: 'true',
  });
  if (displayName) {
    await updateProfile(result.idToken, displayName);
    result.displayName = displayName;
  }
  await persistAuthSession(result);
  return result;
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthResponse> {
  const result = await authRequest('accounts:signInWithPassword', {
    email,
    password,
    returnSecureToken: 'true',
  });
  await persistAuthSession(result);
  return result;
}

export async function persistAuthSession(auth: AuthResponse): Promise<void> {
  await AsyncStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      localId: auth.localId,
      email: auth.email,
      displayName: auth.displayName,
      idToken: auth.idToken,
    })
  );
}

export async function loadStoredAuth(): Promise<{
  localId: string;
  email?: string;
  displayName?: string;
} | null> {
  const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function clearAuthSession(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
}

async function updateProfile(idToken: string, displayName: string): Promise<void> {
  await fetch(`${BASE}/accounts:update?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, displayName, returnSecureToken: 'false' }),
  });
}

/** Optional: persist user profile to Firestore via backend */
export async function syncUserProfile(
  userId: string,
  profile: { name: string; email: string; role: string; address?: string }
): Promise<void> {
  const base = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/$/, '');
  if (!base) return;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s max
    await fetch(`${base}/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
      signal: controller.signal,
    });
    clearTimeout(timeout);
  } catch {
    /* backend optional — silently ignore */
  }
}
