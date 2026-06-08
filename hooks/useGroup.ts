import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { AjoGroup, Cycle, GroupMember } from '@/lib/types';

export function useGroup(groupId: string | undefined) {
  // Unique per hook instance so multiple screens can observe the same group
  // without colliding on a shared realtime channel topic.
  const instanceId = useRef(Math.random().toString(36).slice(2)).current;
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
      supabase.from('groups').select('*').eq('id', groupId).maybeSingle(),
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

    if (groupRes.error) {
      setError(groupRes.error.message);
      setGroup(null);
    } else if (!groupRes.data) {
      setGroup(null);
      setError(null);
    } else {
      setGroup(groupRes.data as AjoGroup);
    }

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
      .channel(`group-${groupId}-${instanceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'groups', filter: `id=eq.${groupId}` }, fetchGroup)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members', filter: `group_id=eq.${groupId}` }, fetchGroup)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cycles', filter: `group_id=eq.${groupId}` }, fetchGroup)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, fetchGroup, instanceId]);

  return { group, members, currentCycle, loading, error, refetch: fetchGroup };
}
