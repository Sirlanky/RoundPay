import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { AjoGroup, Cycle, GroupMember } from '@/lib/types';

export function useGroup(groupId: string | undefined) {
  const [group, setGroup] = useState<AjoGroup | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [currentCycle, setCurrentCycle] = useState<Cycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroup = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    setError(null);

    const [groupRes, membersRes, cycleRes] = await Promise.all([
      supabase.from('groups').select('*').eq('id', groupId).single(),
      supabase
        .from('group_members')
        .select('*, profile:profiles(*)')
        .eq('group_id', groupId)
        .order('rotation_order'),
      supabase
        .from('cycles')
        .select('*, recipient:profiles(*)')
        .eq('group_id', groupId)
        .order('cycle_number', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (groupRes.error) setError(groupRes.error.message);
    else setGroup(groupRes.data as AjoGroup);

    if (membersRes.error) setError(membersRes.error.message);
    else setMembers((membersRes.data ?? []) as GroupMember[]);

    setCurrentCycle((cycleRes.data as Cycle | null) ?? null);
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  useEffect(() => {
    if (!groupId) return;

    const channel = supabase
      .channel(`group-${groupId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'groups', filter: `id=eq.${groupId}` }, fetchGroup)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members', filter: `group_id=eq.${groupId}` }, fetchGroup)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cycles', filter: `group_id=eq.${groupId}` }, fetchGroup)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, fetchGroup]);

  return { group, members, currentCycle, loading, error, refetch: fetchGroup };
}
