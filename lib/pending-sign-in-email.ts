import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@roundpay/pending_sign_in_email';

export async function setPendingSignInEmail(email: string): Promise<void> {
  await AsyncStorage.setItem(KEY, email.trim().toLowerCase());
}

export async function getPendingSignInEmail(): Promise<string | null> {
  const value = await AsyncStorage.getItem(KEY);
  return value?.trim() || null;
}

export async function clearPendingSignInEmail(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
