import { isVerifiedAdmin } from '@/lib/identity-verification';
import { supabase } from '@/lib/supabase';
import type { AjoGroup, Profile } from '@/lib/types';

export function canUseAdminMode(
  profile: Pick<Profile, 'identity_status'> | null | undefined,
  adminGroupCount: number
): boolean {
  return isVerifiedAdmin(profile) && adminGroupCount > 0;
}

export async function countAdminGroups(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('groups')
    .select('id', { count: 'exact', head: true })
    .eq('admin_id', userId)
    .is('archived_at', null);

  if (error) return 0;
  return count ?? 0;
}

export async function getAdminGroups(userId: string): Promise<AjoGroup[]> {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('admin_id', userId)
    .is('archived_at', null)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as AjoGroup[];
}

export function isGroupAdmin(group: Pick<AjoGroup, 'admin_id'>, userId: string | undefined): boolean {
  return Boolean(userId && group.admin_id === userId);
}
