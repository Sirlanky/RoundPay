import AsyncStorage from '@react-native-async-storage/async-storage';
import { GROUP_FREQUENCIES } from './group-frequency';
import { supabase } from './supabase';
import type { GroupFrequency } from './types';

const STORAGE_KEY = '@roundpay/supported_group_frequencies_v2';

const LEGACY_FREQUENCIES: GroupFrequency[] = ['weekly', 'monthly'];

let memoryCache: GroupFrequency[] | null = null;

function parseStored(raw: string | null): GroupFrequency[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    const valid = parsed.filter((v): v is GroupFrequency =>
      GROUP_FREQUENCIES.includes(v as GroupFrequency)
    );
    return valid.length ? valid : null;
  } catch {
    return null;
  }
}

function isFrequencyConstraintError(error: { code?: string; message?: string }): boolean {
  return (
    error.code === '23514' &&
    (error.message?.includes('groups_frequency_check') ?? false)
  );
}

/** One lightweight probe insert to learn which frequencies the DB accepts. */
async function probeFrequencies(userId: string): Promise<GroupFrequency[]> {
  const supported: GroupFrequency[] = [];

  for (const frequency of GROUP_FREQUENCIES) {
    const inviteCode =
      'Z' +
      frequency.slice(0, 2).toUpperCase() +
      Math.random().toString(36).slice(2, 4).toUpperCase();

    const { data, error } = await supabase
      .from('groups')
      .insert({
        name: '__frequency_probe__',
        contribution_amount: 1000,
        frequency,
        max_members: 2,
        admin_fee_percent: 0,
        admin_id: userId,
        invite_code: inviteCode,
        status: 'draft',
      })
      .select('id')
      .single();

    if (error) {
      if (isFrequencyConstraintError(error)) continue;
      // RLS or other issue — fall back to legacy options.
      return LEGACY_FREQUENCIES;
    }

    supported.push(frequency);
    if (data?.id) {
      await supabase.from('groups').delete().eq('id', data.id);
    }
  }

  return supported.length ? supported : LEGACY_FREQUENCIES;
}

function isCompleteCache(stored: GroupFrequency[] | null): stored is GroupFrequency[] {
  return (
    stored != null &&
    stored.length === GROUP_FREQUENCIES.length &&
    GROUP_FREQUENCIES.every((f) => stored.includes(f))
  );
}

export async function getSupportedGroupFrequencies(): Promise<GroupFrequency[]> {
  if (memoryCache && isCompleteCache(memoryCache)) return memoryCache;

  const stored = parseStored(await AsyncStorage.getItem(STORAGE_KEY));
  if (isCompleteCache(stored)) {
    memoryCache = stored;
    return stored;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    memoryCache = LEGACY_FREQUENCIES;
    return LEGACY_FREQUENCIES;
  }

  const probed = await probeFrequencies(user.id);
  memoryCache = probed;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(probed));
  return probed;
}

export async function refreshSupportedGroupFrequencies(): Promise<GroupFrequency[]> {
  memoryCache = null;
  await AsyncStorage.removeItem(STORAGE_KEY);
  return getSupportedGroupFrequencies();
}

export function frequencySupported(
  frequency: GroupFrequency,
  supported: GroupFrequency[]
): boolean {
  return supported.includes(frequency);
}

export function pickDefaultFrequency(supported: GroupFrequency[]): GroupFrequency {
  if (supported.includes('weekly')) return 'weekly';
  return supported[0] ?? 'weekly';
}

export { isFrequencyConstraintError };
