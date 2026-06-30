import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@ajo/account-password-set-v1';

type PasswordSetMap = Record<string, true>;

async function loadMap(): Promise<PasswordSetMap> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as PasswordSetMap;
    if (parsed && typeof parsed === 'object') return parsed;
  } catch {
    // ignore
  }
  return {};
}

async function saveMap(map: PasswordSetMap): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export async function hasAccountPasswordSet(userId: string | undefined | null): Promise<boolean> {
  if (!userId) return false;
  const map = await loadMap();
  return map[userId] === true;
}

export async function markAccountPasswordSet(userId: string): Promise<void> {
  const map = await loadMap();
  map[userId] = true;
  await saveMap(map);
}

export async function clearAccountPasswordSet(userId: string): Promise<void> {
  const map = await loadMap();
  delete map[userId];
  await saveMap(map);
}
