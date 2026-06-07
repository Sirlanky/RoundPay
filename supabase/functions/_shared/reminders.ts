import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export type ReminderKind = 'contribution' | 'overdue' | 'payout';

export type ReminderProfile = {
  reminders_enabled?: boolean | null;
  reminder_contributions?: boolean | null;
  reminder_overdue?: boolean | null;
  reminder_payouts?: boolean | null;
  reminder_hour?: number | null;
};

export function getLagosHour(date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Lagos',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(date);
  const hourPart = parts.find((part) => part.type === 'hour');
  return hourPart ? parseInt(hourPart.value, 10) : date.getUTCHours();
}

export function shouldSendReminder(
  profile: ReminderProfile | null | undefined,
  kind: ReminderKind,
  lagosHour: number
): boolean {
  if (!profile) return true;

  if (profile.reminders_enabled === false) return false;

  if (
    profile.reminder_hour != null &&
    profile.reminder_hour !== lagosHour
  ) {
    return false;
  }

  if (kind === 'contribution' && profile.reminder_contributions === false) return false;
  if (kind === 'overdue' && profile.reminder_overdue === false) return false;
  if (kind === 'payout' && profile.reminder_payouts === false) return false;

  return true;
}

export async function getReminderProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<ReminderProfile | null> {
  const { data } = await supabase
    .from('profiles')
    .select(
      'reminders_enabled, reminder_contributions, reminder_overdue, reminder_payouts, reminder_hour'
    )
    .eq('id', userId)
    .single();

  return data;
}
