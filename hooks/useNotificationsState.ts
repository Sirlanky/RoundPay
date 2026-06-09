import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
  fetchNotifications,
  getUnreadNotificationCount,
  isNotificationsTableMissing,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/in-app-notifications';
import { subscribePostgresChannel, unsubscribePostgresChannel, useRealtimeHandler } from '@/lib/supabase-realtime';
import type { AppNotification } from '@/lib/types';

export function useNotificationsState(userId: string | undefined) {
  // Unique per hook instance so a second mount (e.g. a nested tabs layout)
  // does not collide on a shared realtime channel topic.
  const instanceId = useRef(Math.random().toString(36).slice(2)).current;
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [tableMissing, setTableMissing] = useState(false);

  const load = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setLoadError('');
      setTableMissing(false);
      setInitialLoading(false);
      return;
    }

    try {
      setLoadError('');
      setTableMissing(false);
      const [items, count] = await Promise.all([
        fetchNotifications(userId),
        getUnreadNotificationCount(userId),
      ]);
      setNotifications(items);
      setUnreadCount(count);
    } catch (e) {
      if (isNotificationsTableMissing(e)) {
        setTableMissing(true);
        setNotifications([]);
        setUnreadCount(0);
        setLoadError('');
      } else {
        const message = e instanceof Error ? e.message : 'Could not load notifications';
        setLoadError(message);
        setNotifications([]);
        setUnreadCount(0);
        console.warn('[notifications] load failed:', message);
      }
    } finally {
      setInitialLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    setInitialLoading(true);
    load();
  }, [load]);

  const onRealtimeChange = useRealtimeHandler(() => {
    void load();
  });

  useEffect(() => {
    if (!userId || tableMissing) return;

    let channel: ReturnType<typeof subscribePostgresChannel> | null = null;
    try {
      channel = subscribePostgresChannel(`notifications-${userId}-${instanceId}`, [
        {
          config: {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          callback: onRealtimeChange,
        },
      ]);
    } catch (e) {
      console.warn('[notifications] realtime subscribe failed:', e);
      return;
    }

    return () => {
      if (channel) unsubscribePostgresChannel(channel);
    };
  }, [userId, tableMissing, instanceId, onRealtimeChange]);

  // Fallback so the bell badge and feed never go stale when realtime doesn't
  // deliver: refetch when the app returns to the foreground and on a light poll.
  useEffect(() => {
    if (!userId || tableMissing) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void load();
    });
    const interval = setInterval(() => void load(), 15000);
    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, [userId, tableMissing, load]);

  const markRead = useCallback(
    async (notificationId: string) => {
      const now = new Date().toISOString();
      let wasUnread = false;

      setNotifications((prev) => {
        const target = prev.find((n) => n.id === notificationId);
        wasUnread = Boolean(target && !target.read_at);
        if (!wasUnread) return prev;
        return prev.map((n) => (n.id === notificationId ? { ...n, read_at: now } : n));
      });

      if (wasUnread) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }

      try {
        await markNotificationRead(notificationId);
      } catch (e) {
        console.warn('[notifications] mark read failed:', e);
        await load();
      }
    },
    [load]
  );

  const markAllRead = useCallback(async () => {
    if (!userId) return;

    const now = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? now })));
    setUnreadCount(0);

    try {
      await markAllNotificationsRead(userId);
    } catch (e) {
      console.warn('[notifications] mark all read failed:', e);
      await load();
    }
  }, [userId, load]);

  return {
    notifications,
    unreadCount,
    loading: initialLoading,
    loadError,
    tableMissing,
    refetch: load,
    markRead,
    markAllRead,
  };
}

export type NotificationsState = ReturnType<typeof useNotificationsState>;
