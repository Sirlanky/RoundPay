import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupportedStorage } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  '';

export const isSupabaseConfigured =
  supabaseUrl.length > 0 &&
  supabaseAnonKey.length > 0 &&
  !supabaseUrl.includes('your-project') &&
  !supabaseAnonKey.includes('your-anon');

/** Avoid AsyncStorage during Metro web SSR (Node has no `window`). */
const ssrSafeAuthStorage: SupportedStorage = {
  getItem: async (key) => {
    if (typeof window === 'undefined') return null;
    return AsyncStorage.getItem(key);
  },
  setItem: async (key, value) => {
    if (typeof window === 'undefined') return;
    await AsyncStorage.setItem(key, value);
  },
  removeItem: async (key) => {
    if (typeof window === 'undefined') return;
    await AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      storage: ssrSafeAuthStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}

export function getFunctionsUrl(functionName: string): string {
  const base = supabaseUrl.replace(/\/$/, '');
  return `${base}/functions/v1/${functionName}`;
}
