import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Contribution } from '@/lib/types';

export function useContributions(cycleId: string | undefined) {
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

  useEffect(() => {
    if (!cycleId) return;
    const channel = supabase
      .channel(`contributions-${cycleId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contributions', filter: `cycle_id=eq.${cycleId}` },
        fetchContributions
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [cycleId, fetchContributions]);

  const paidCount = contributions.filter((c) => c.status === 'paid').length;
  const allPaid = contributions.length > 0 && paidCount === contributions.length;

  return { contributions, loading, paidCount, allPaid, refetch: fetchContributions };
}
