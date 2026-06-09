import { useCallback, useEffect, useRef, useState } from 'react';
import { subscribePostgresChannel, unsubscribePostgresChannel, useRealtimeHandler } from '@/lib/supabase-realtime';
import { supabase } from '@/lib/supabase';
import type { Contribution } from '@/lib/types';

export function useContributions(cycleId: string | undefined) {
  // Unique per hook instance so multiple screens can observe the same cycle
  // without colliding on a shared realtime channel topic.
  const instanceId = useRef(Math.random().toString(36).slice(2)).current;
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContributions = useCallback(async () => {
    if (!cycleId) return;
    setLoading(true);
    const { data } = await supabase
      .from('contributions')
      .select('*')
      .eq('cycle_id', cycleId)
      .order('created_at');
    setContributions((data ?? []) as Contribution[]);
    setLoading(false);
  }, [cycleId]);

  useEffect(() => {
    fetchContributions();
  }, [fetchContributions]);

  const onRealtimeChange = useRealtimeHandler(() => {
    void fetchContributions();
  });

  useEffect(() => {
    if (!cycleId) return;

    let channel: ReturnType<typeof subscribePostgresChannel> | null = null;
    try {
      channel = subscribePostgresChannel(`contributions-${cycleId}-${instanceId}`, [
        {
          config: {
            event: '*',
            schema: 'public',
            table: 'contributions',
            filter: `cycle_id=eq.${cycleId}`,
          },
          callback: onRealtimeChange,
        },
      ]);
    } catch (e) {
      console.warn('[contributions] realtime subscribe failed:', e);
      return;
    }

    return () => {
      if (channel) unsubscribePostgresChannel(channel);
    };
  }, [cycleId, instanceId, onRealtimeChange]);

  const paidCount = contributions.filter((c) => c.status === 'paid').length;
  const allPaid = contributions.length > 0 && paidCount === contributions.length;

  return { contributions, loading, paidCount, allPaid, refetch: fetchContributions };
}
