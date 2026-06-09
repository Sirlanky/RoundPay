import { supabase } from './supabase';
import type { AppNotification } from './types';

export async function fetchNotifications(userId: string, limit = 50): Promise<AppNotification[]> {
  // Direct messages have their own Messages area; keep them out of the Alerts feed.
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .neq('type', 'direct_message')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as AppNotification[];
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .neq('type', 'direct_message')
    .is('read_at', null);

  if (error) throw error;
  return count ?? 0;
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .is('read_at', null);

  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null);

  if (error) throw error;
}

/** Route to open when the user taps a push notification. */
export function getNotificationPathFromPushData(
  data: Record<string, unknown> | undefined
): string | null {
  if (!data) return null;

  const type = data.type as AppNotification['type'] | undefined;
  const group_id =
    (data.groupId as string | undefined) ?? (data.group_id as string | undefined) ?? null;
  const related_entity_id =
    (data.relatedEntityId as string | undefined) ??
    (data.related_entity_id as string | undefined) ??
    null;

  if (!type && !group_id) return null;

  return getNotificationPath({
    id: (data.notificationId as string | undefined) ?? '',
    user_id: '',
    group_id,
    type: type ?? 'group_joined',
    title: '',
    message: '',
    related_entity_id,
    read_at: null,
    created_at: '',
  });
}

/** Route to open when the user taps a notification row. */
export function getNotificationPath(notification: AppNotification): string | null {
  const { type, group_id, related_entity_id } = notification;

  if (type === 'direct_message' && related_entity_id) {
    return `/messages/${related_entity_id}`;
  }

  if (
    group_id &&
    related_entity_id &&
    (type === 'contribution_due' ||
      type === 'contribution_overdue' ||
      type === 'payment_confirmed')
  ) {
    return `/group/${group_id}/pay?contributionId=${related_entity_id}`;
  }

  if (group_id) {
    return `/group/${group_id}`;
  }

  return null;
}

export function isNotificationsTableMissing(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { code?: string; message?: string };
  return (
    e.code === '42P01' ||
    e.code === 'PGRST205' ||
    (e.message?.includes("Could not find the table 'public.notifications'") ?? false)
  );
}
