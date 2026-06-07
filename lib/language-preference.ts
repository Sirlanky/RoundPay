import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_LANGUAGE, isAppLanguage, type AppLanguage } from './languages';

const STORAGE_KEY = '@roundpay/preferred_language';

export async function loadPreferredLanguage(): Promise<AppLanguage> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored && isAppLanguage(stored)) return stored;
  } catch {
    // ignore read errors
  }
  return DEFAULT_LANGUAGE;
}

export async function savePreferredLanguage(code: AppLanguage): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, code);
}
