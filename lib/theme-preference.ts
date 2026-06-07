import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_THEME, isThemePreference, type ThemePreference } from './theme';

const STORAGE_KEY = '@roundpay/preferred_theme';

export async function loadPreferredTheme(): Promise<ThemePreference> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored && isThemePreference(stored)) return stored;
  } catch {
    // ignore read errors
  }
  return DEFAULT_THEME;
}

export async function savePreferredTheme(preference: ThemePreference): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, preference);
}
