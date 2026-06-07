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

export async function sendPushToUser(
  supabase: SupabaseClient,
  userId: string,
  title: string,
  body: string,
  data: PushData = {}
): Promise<boolean> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('expo_push_token, push_enabled')
    .eq('id', userId)
    .single();

  if (!profile?.expo_push_token || profile.push_enabled === false) {
    return false;
  }

  await sendPush(profile.expo_push_token, title, body, data, { supabase, userId });
  return true;
}
