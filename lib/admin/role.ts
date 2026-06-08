import { supabase } from '@/lib/supabase';
import type { AjoGroup } from '@/lib/types';

export async function countAdminGroups(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('groups')
    .select('id', { count: 'exact', head: true })
    .eq('admin_id', userId);

  if (error) return 0;
  return count ?? 0;
}

export async function getAdminGroups(userId: string): Promise<AjoGroup[]> {
  // Avoid filtering/ordering on columns that only exist after later migrations
  // (e.g. archived_at) so the managing surfaces work regardless of DB state.
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('admin_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return ((data ?? []) as AjoGroup[]).filter((g) => !g.archived_at);
}

export function isGroupAdmin(group: Pick<AjoGroup, 'admin_id'>, userId: string | undefined): boolean {
  return Boolean(userId && group.admin_id === userId);
}
