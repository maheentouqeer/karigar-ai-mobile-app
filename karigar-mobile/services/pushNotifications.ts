import { useStore } from '../store';

/**
 * Replacement for expo-notifications.
 * Since Expo Go SDK 53 crashes with expo-notifications, we use an in-app
 * global toast system managed by the store.
 */

export async function scheduleLocalNotification(
  title: string,
  body: string,
  options?: { enabled?: boolean }
): Promise<void> {
  if (options?.enabled === false) return;
  
  // We can't use hooks here if called from non-component, 
  // so we access the store directly.
  try {
    const state = useStore.getState();
    if (state.notify) {
      state.notify(title, body, 'info');
    }
  } catch (err) {
    console.warn('In-app notification failed:', err);
  }
}
