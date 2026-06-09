import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@ajo/profile-setup-reminder-daily';
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

function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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
export async function tryConsumeProfileSetupReminderShow(): Promise<boolean> {
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
