import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@ajo/profile-setup-reminder-daily';
const COMPLETE_KEY = '@ajo/profile-setup-reminder-complete-v1';
const LEGACY_SNOOZE_KEY = '@ajo/profile-setup-reminder-snooze-until';

/** Max reminder appearances per calendar day (device local time). */
export const PROFILE_SETUP_REMINDER_DAILY_LIMIT = 2;

/** Minimum time between two reminders on the same day. */
export const PROFILE_SETUP_REMINDER_MIN_GAP_MS = 4 * 60 * 60 * 1000;

/** How long a visible reminder stays on screen before auto-hiding. */
export const PROFILE_SETUP_REMINDER_AUTO_HIDE_MS = 4 * 60 * 60 * 1000;

const MIN_GAP_MS = PROFILE_SETUP_REMINDER_MIN_GAP_MS;

interface DailyState {
  date: string;
  count: number;
  lastShownAt: number;
}

type CompleteMap = Record<string, true>;

function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function loadCompleteMap(): Promise<CompleteMap> {
  const raw = await AsyncStorage.getItem(COMPLETE_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as CompleteMap;
    if (parsed && typeof parsed === 'object') return parsed;
  } catch {
    // ignore corrupt storage
  }
  return {};
}

async function saveCompleteMap(map: CompleteMap): Promise<void> {
  await AsyncStorage.setItem(COMPLETE_KEY, JSON.stringify(map));
}

/** True once this user finished profile setup — reminder never shows again for them. */
export async function isProfileSetupReminderPermanentlyComplete(userId: string): Promise<boolean> {
  const map = await loadCompleteMap();
  return map[userId] === true;
}

/** Call when name, phone, and bank are all on file — stops future reminders for this user. */
export async function markProfileSetupReminderPermanentlyComplete(userId: string): Promise<void> {
  const map = await loadCompleteMap();
  map[userId] = true;
  await saveCompleteMap(map);
  await clearProfileSetupReminderState();
}

async function loadState(): Promise<DailyState | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as DailyState;
    if (
      typeof parsed.date === 'string' &&
      typeof parsed.count === 'number' &&
      typeof parsed.lastShownAt === 'number'
    ) {
      return parsed;
    }
  } catch {
    // ignore corrupt storage
  }
  return null;
}

async function saveState(state: DailyState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/** Use one of today's reminder slots and return whether the banner should show. */
export async function tryConsumeProfileSetupReminderShow(userId: string | undefined): Promise<boolean> {
  if (!userId) return false;

  if (await isProfileSetupReminderPermanentlyComplete(userId)) return false;

  await AsyncStorage.removeItem(LEGACY_SNOOZE_KEY);

  const today = todayKey();
  const now = Date.now();
  const state = await loadState();

  if (state?.date === today) {
    if (state.count >= PROFILE_SETUP_REMINDER_DAILY_LIMIT) return false;
    if (state.lastShownAt > 0 && now - state.lastShownAt < MIN_GAP_MS) return false;
  }

  const count = state?.date === today ? state.count + 1 : 1;
  await saveState({ date: today, count, lastShownAt: now });
  return true;
}

/** Swipe away — no more reminders for the rest of today. */
export async function dismissProfileSetupReminderForToday(): Promise<void> {
  await saveState({
    date: todayKey(),
    count: PROFILE_SETUP_REMINDER_DAILY_LIMIT,
    lastShownAt: Date.now(),
  });
}

export async function clearProfileSetupReminderState(): Promise<void> {
  await AsyncStorage.multiRemove([STORAGE_KEY, LEGACY_SNOOZE_KEY]);
}
