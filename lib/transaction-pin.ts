import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const PIN_HASH_KEY = 'roundpay_transaction_pin_hash';
const PIN_SALT_KEY = 'roundpay_transaction_pin_salt';
export const TRANSACTION_PIN_LENGTH = 4;

async function secureStoreReady(): Promise<boolean> {
  return SecureStore.isAvailableAsync ? SecureStore.isAvailableAsync() : false;
}

async function hashPin(pin: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${pin}`);
}

function randomSalt(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function isTransactionPinEnabled(): Promise<boolean> {
  if (!(await secureStoreReady())) return false;
  const hash = await SecureStore.getItemAsync(PIN_HASH_KEY);
  return Boolean(hash);
}

export async function setTransactionPin(pin: string): Promise<void> {
  if (pin.length !== TRANSACTION_PIN_LENGTH || !/^\d+$/.test(pin)) {
    throw new Error('PIN must be 4 digits');
  }
  const salt = randomSalt();
  const hash = await hashPin(pin, salt);
  await SecureStore.setItemAsync(PIN_SALT_KEY, salt);
  await SecureStore.setItemAsync(PIN_HASH_KEY, hash);
}

export async function verifyTransactionPin(pin: string): Promise<boolean> {
  if (!(await secureStoreReady())) return false;
  const salt = await SecureStore.getItemAsync(PIN_SALT_KEY);
  const stored = await SecureStore.getItemAsync(PIN_HASH_KEY);
  if (!salt || !stored) return false;
  const hash = await hashPin(pin, salt);
  return hash === stored;
}

export async function removeTransactionPin(): Promise<void> {
  await SecureStore.deleteItemAsync(PIN_HASH_KEY);
  await SecureStore.deleteItemAsync(PIN_SALT_KEY);
}
