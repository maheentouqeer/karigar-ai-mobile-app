import { Platform } from 'react-native';

/**
 * Resolve backend base URL.
 *
 * The .env already has the correct LAN IP (EXPO_PUBLIC_API_URL).
 * We always use it as-is now — the old Constants.isDevice check was
 * unreliable and was incorrectly routing physical phones to 10.0.2.2.
 *
 * For Android emulator testing, set EXPO_PUBLIC_API_URL=http://10.0.2.2:8000
 * in .env manually.
 */
export function getApiBaseUrl(): string {
  const envUrl = (process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.108:8000').replace(/\/$/, '');
  return envUrl;
}
