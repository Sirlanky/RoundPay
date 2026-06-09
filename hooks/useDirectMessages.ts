import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { fetchThread, markThreadRead, type DirectMessage } from '@/lib/messages';
import { subscribePostgresChannel, unsubscribePostgresChannel, useRealtimeHandler } from '@/lib/supabase-realtime';

function sameThread(a: DirectMessage[], b: DirectMessage[]): boolean {
  if (a.length !== b.length) return false;
  const la = a[a.length - 1];
  const lb = b[b.length - 1];
  if (!la || !lb) return a.length === b.length;
  return la.id === lb.id && la.read_at === lb.read_at;
}

export function useDirectMessages(meId: string | undefined, otherUserId: string | undefined) {
  const instanceId = useRef(Math.random().toString(36).slice(2)).current;
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!meId || !otherUserId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    try {
      const thread = await fetchThread(meId, otherUserId);
      setMessages((prev) => (sameThread(prev, thread) ? prev : thread));
      if (thread.some((m) => m.recipient_id === meId && !m.read_at)) {
        void markThreadRead(meId, otherUserId);
      }
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [meId, otherUserId]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  const onRealtimeChange = useRealtimeHandler(() => {
    void load();
  });

  // Realtime: instant delivery when the table is published to supabase_realtime.
  useEffect(() => {
    if (!meId || !otherUserId) return;

    let channel: ReturnType<typeof subscribePostgresChannel> | null = null;
    try {
      channel = subscribePostgresChannel(`thread-${meId}-${otherUserId}-${instanceId}`, [
        {
          config: {
            event: '*',
            schema: 'public',
            table: 'direct_messages',
            filter: `recipient_id=eq.${meId}`,
          },
          callback: onRealtimeChange,
        },
        {
          config: {
            event: '*',
            schema: 'public',
            table: 'direct_messages',
            filter: `sender_id=eq.${meId}`,
          },
          callback: onRealtimeChange,
        },
      ]);
    } catch (e) {
      console.warn('[messages] realtime subscribe failed:', e);
      return;
    }

    return () => {
      if (channel) unsubscribePostgresChannel(channel);
    };
  }, [meId, otherUserId, instanceId, onRealtimeChange]);

  // Fallback so the user never has to reload: refetch on app foreground and on a
  // light interval while the chat is open (covers realtime not being delivered).
  useEffect(() => {
    if (!meId || !otherUserId) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void load();
    });
    const interval = setInterval(() => void load(), 5000);
    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, [meId, otherUserId, load]);

  return { messages, loading, refetch: load };
}
