import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface PushData {
  type?: string;
  groupId?: string;
  relatedEntityId?: string;
  notificationId?: string;
}

function toExpoData(data: PushData): Record<string, string> {
  const payload: Record<string, string> = {};
  if (data.type) payload.type = data.type;
  if (data.groupId) payload.groupId = data.groupId;
  if (data.relatedEntityId) payload.relatedEntityId = data.relatedEntityId;
  if (data.notificationId) payload.notificationId = data.notificationId;
  return payload;
}

export async function sendPush(
  token: string,
  title: string,
  body: string,
  data: PushData = {},
  options?: {
    supabase?: SupabaseClient;
    userId?: string;
  }
): Promise<void> {
  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: token,
      title,
      body,
      sound: 'default',
      data: toExpoData(data),
    }),
  });

  if (!options?.supabase || !options.userId) return;

  try {
    const json = await res.json();
    const ticket = json?.data?.[0];
    const error = ticket?.details?.error ?? ticket?.message;
    if (error === 'DeviceNotRegistered' || error === 'InvalidCredentials') {
      await options.supabase
        .from('profiles')
        .update({ expo_push_token: null })
        .eq('id', options.userId);
    }
  } catch {
    // Best-effort token cleanup only.
  }
}

type ReminderPrefs = {
  reminders_enabled?: boolean | null;
  reminder_contributions?: boolean | null;
  reminder_overdue?: boolean | null;
  reminder_payouts?: boolean | null;
};

/**
 * Whether a push of the given type is allowed by the user's reminder settings.
 * Transactional/social events (payments, joins, messages) always pass; the
 * scheduled "reminder" categories respect the per-category toggles.
 */
function isPushAllowedByPrefs(type: string | undefined, prefs: ReminderPrefs): boolean {
  const enabled = (v: boolean | null | undefined) => v !== false; // default on when null/missing

  switch (type) {
    case 'contribution_due':
      return enabled(prefs.reminders_enabled) && enabled(prefs.reminder_contributions);
    case 'contribution_overdue':
      return enabled(prefs.reminders_enabled) && enabled(prefs.reminder_overdue);
    case 'payout_soon':
    case 'payout_completed':
      return enabled(prefs.reminders_enabled) && enabled(prefs.reminder_payouts);
    default:
      // payment_confirmed, payment_received, member_joined, group_joined,
      // direct_message, etc. are transactional/social and not gated by reminders.
      return true;
  }
}

export async function sendPushToUser(
  supabase: SupabaseClient,
  userId: string,
  title: string,
  body: string,
  data: PushData = {}
): Promise<boolean> {
  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'expo_push_token, push_enabled, reminders_enabled, reminder_contributions, reminder_overdue, reminder_payouts'
    )
    .eq('id', userId)
    .single();

  if (!profile?.expo_push_token || profile.push_enabled === false) {
    return false;
  }

  if (!isPushAllowedByPrefs(data.type, profile as ReminderPrefs)) {
    return false;
  }

  await sendPush(profile.expo_push_token, title, body, data, { supabase, userId });
  return true;
}
