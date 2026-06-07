import Constants from 'expo-constants';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const APP_LOCK_KEY = 'roundpay_app_lock_enabled';

export type FaceIdSupport = 'available' | 'expo_go' | 'passcode_only' | 'unavailable';

export interface BiometricSupportInfo {
  support: FaceIdSupport;
  biometricLabel: string;
  canPrompt: boolean;
}

export function isExpoGoClient(): boolean {
  return Constants.appOwnership === 'expo';
}

export async function isAppLockEnabled(): Promise<boolean> {
  if (!SecureStore.isAvailableAsync || !(await SecureStore.isAvailableAsync())) return false;
  const value = await SecureStore.getItemAsync(APP_LOCK_KEY);
  return value === '1';
}

export async function setAppLockEnabled(enabled: boolean): Promise<void> {
  if (enabled) {
    await SecureStore.setItemAsync(APP_LOCK_KEY, '1');
  } else {
    await SecureStore.deleteItemAsync(APP_LOCK_KEY);
  }
}

export async function canUseBiometrics(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return false;
  return LocalAuthentication.isEnrolledAsync();
}

export async function getBiometricLabel(): Promise<string> {
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return Platform.OS === 'ios' ? 'Face ID' : 'Face unlock';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
  }
  return 'Biometrics';
}

/** User-facing label for the lock screen — includes device passcode fallback. */
export async function getUnlockMethodLabel(): Promise<string> {
  const info = await getBiometricSupportInfo();
  if (info.support === 'expo_go') {
    return 'iPhone passcode';
  }
  const biometric = info.biometricLabel;
  if (Platform.OS === 'ios') {
    return `${biometric} or iPhone passcode`;
  }
  if (Platform.OS === 'android') {
    return `${biometric} or device PIN`;
  }
  return biometric;
}

/** Explains whether Face ID can appear in this build of the app. */
export async function getBiometricSupportInfo(): Promise<BiometricSupportInfo> {
  const biometricLabel = await getBiometricLabel();

  if (Platform.OS === 'web') {
    return { support: 'unavailable', biometricLabel, canPrompt: false };
  }

  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  const level = await LocalAuthentication.getEnrolledLevelAsync();
  const hasBiometric =
    enrolled &&
    level >= LocalAuthentication.SecurityLevel.BIOMETRIC_STRONG;

  if (!hasHardware || !enrolled) {
    return { support: 'unavailable', biometricLabel, canPrompt: false };
  }

  // Expo Go on iOS cannot use Face ID — iOS falls back to device passcode only.
  if (Platform.OS === 'ios' && isExpoGoClient()) {
    return { support: 'expo_go', biometricLabel, canPrompt: true };
  }

  // Standalone / dev builds need NSFaceIDUsageDescription (expo-local-authentication plugin).
  if (Platform.OS === 'ios' && hasBiometric) {
    return { support: 'available', biometricLabel, canPrompt: true };
  }

  return { support: hasBiometric ? 'available' : 'passcode_only', biometricLabel, canPrompt: true };
}

export async function authenticateWithBiometrics(prompt: string): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const info = await getBiometricSupportInfo();
  const preferBiometrics =
    info.support === 'available' &&
    (await LocalAuthentication.getEnrolledLevelAsync()) >=
      LocalAuthentication.SecurityLevel.BIOMETRIC_STRONG;

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: prompt,
    cancelLabel: 'Cancel',
    // Biometrics-first on proper builds; passcode fallback in Expo Go or after failures.
    disableDeviceFallback: preferBiometrics,
    // Hide the immediate "Use Passcode" shortcut so Face ID is tried first on iOS.
    fallbackLabel: Platform.OS === 'ios' && preferBiometrics ? '' : undefined,
  });

  return result.success;
}
