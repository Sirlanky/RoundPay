import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { fetchConversations, type Conversation } from '@/lib/messages';
import { subscribePostgresChannel, unsubscribePostgresChannel, useRealtimeHandler } from '@/lib/supabase-realtime';

function sameList(a: Conversation[], b: Conversation[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (
      a[i].otherUserId !== b[i].otherUserId ||
      a[i].lastAt !== b[i].lastAt ||
      a[i].unreadCount !== b[i].unreadCount
    ) {
      return false;
    }
  }
  return true;
}

export function useConversations(userId: string | undefined) {
  const instanceId = useRef(Math.random().toString(36).slice(2)).current;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) {
      setConversations([]);
      setLoading(false);
      return;
    }
    try {
      const next = await fetchConversations();
      setConversations((prev) => (sameList(prev, next) ? prev : next));
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  const onRealtimeChange = useRealtimeHandler(() => {
    void load();
  });

  useEffect(() => {
    if (!userId) return;

    let channel: ReturnType<typeof subscribePostgresChannel> | null = null;
    try {
      channel = subscribePostgresChannel(`conversations-${userId}-${instanceId}`, [
        {
          config: {
            event: '*',
            schema: 'public',
            table: 'direct_messages',
            filter: `recipient_id=eq.${userId}`,
          },
          callback: onRealtimeChange,
        },
        {
          config: {
            event: '*',
            schema: 'public',
            table: 'direct_messages',
            filter: `sender_id=eq.${userId}`,
          },
          callback: onRealtimeChange,
        },
      ]);
    } catch (e) {
      console.warn('[conversations] realtime subscribe failed:', e);
      return;
    }

    return () => {
      if (channel) unsubscribePostgresChannel(channel);
    };
  }, [userId, instanceId, onRealtimeChange]);

  // Fallback so new conversations/unread counts show without a manual reload.
  useEffect(() => {
    if (!userId) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void load();
    });
    const interval = setInterval(() => void load(), 8000);
    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, [userId, load]);

  const unreadTotal = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return { conversations, loading, unreadTotal, refetch: load };
}
