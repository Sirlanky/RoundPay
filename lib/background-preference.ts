import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_BACKGROUND_PRESET,
  isBackgroundPresetId,
  type BackgroundPresetId,
} from './background-presets';

const STORAGE_KEY = '@roundpay/background_preset';

export async function loadBackgroundPreset(): Promise<BackgroundPresetId> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored && isBackgroundPresetId(stored)) return stored;
  } catch {
    // ignore read errors
  }
  return DEFAULT_BACKGROUND_PRESET;
}

export async function saveBackgroundPreset(preset: BackgroundPresetId): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, preset);
}
