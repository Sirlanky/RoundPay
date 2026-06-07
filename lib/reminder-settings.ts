import { supabase } from './supabase';
import type { Profile } from './types';

export interface ReminderPreferences {
  reminders_enabled: boolean;
  reminder_contributions: boolean;
  reminder_overdue: boolean;
  reminder_payouts: boolean;
  reminder_hour: number;
}

export const DEFAULT_REMINDER_PREFERENCES: ReminderPreferences = {
  reminders_enabled: true,
  reminder_contributions: true,
  reminder_overdue: true,
  reminder_payouts: true,
  reminder_hour: 9,
};

/** Hours offered in the time picker (6 AM – 9 PM, WAT). */
export const REMINDER_HOUR_OPTIONS = Array.from({ length: 16 }, (_, i) => i + 6);

export function profileToReminderPreferences(profile: Profile | null): ReminderPreferences {
  return {
    reminders_enabled: profile?.reminders_enabled ?? true,
    reminder_contributions: profile?.reminder_contributions ?? true,
    reminder_overdue: profile?.reminder_overdue ?? true,
    reminder_payouts: profile?.reminder_payouts ?? true,
    reminder_hour: profile?.reminder_hour ?? 9,
  };
}

export function formatReminderHour(hour: number): string {
  const normalized = ((hour % 24) + 24) % 24;
  const period = normalized >= 12 ? 'PM' : 'AM';
  const display = normalized % 12 === 0 ? 12 : normalized % 12;
  return `${display}:00 ${period}`;
}

export function isReminderColumnMissing(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { message?: string; code?: string };
  return (
    e.code === 'PGRST204' ||
    (e.message?.includes('reminder_') ?? false) ||
    (e.message?.includes('reminders_enabled') ?? false)
  );
}

export async function saveReminderPreferences(
  userId: string,
  prefs: Partial<ReminderPreferences>
): Promise<void> {
  const { error } = await supabase.from('profiles').update(prefs).eq('id', userId);
  if (error) throw error;
}

export async function saveReminderHour(userId: string, hour: number): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ reminder_hour: hour })
    .eq('id', userId);
  if (error) throw error;
}
