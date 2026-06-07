import { useCallback, useEffect, useState } from 'react';
import {
  fetchNotifications,
  getUnreadNotificationCount,
  isNotificationsTableMissing,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/in-app-notifications';
import { supabase } from '@/lib/supabase';
import type { AppNotification } from '@/lib/types';

export function useNotificationsState(userId: string | undefined) {
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

  useEffect(() => {
    if (!userId || tableMissing) return;

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          load();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
