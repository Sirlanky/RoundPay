import { supabase } from './supabase';

/**
 * A trimmed view of another member's profile that is safe to show to
 * co-group members. Deliberately excludes bank, identity, push and OTP fields
 * even though RLS may technically expose them to co-members.
 */
export interface PublicProfile {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string | null;
}

export interface SharedGroup {
  id: string;
  name: string;
  status: string;
}

const SAFE_COLUMNS = 'id, full_name, first_name, last_name, avatar_url, phone, created_at';

export async function fetchPublicProfile(userId: string): Promise<PublicProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(SAFE_COLUMNS)
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return (data as PublicProfile | null) ?? null;
}

export async function fetchSharedGroups(userId: string): Promise<SharedGroup[]> {
  const { data, error } = await supabase.rpc('get_shared_groups', { p_other: userId });
  if (error) {
    if (isMessagingNotInstalled(error)) return [];
    throw error;
  }
  return (data ?? []) as SharedGroup[];
}

export function isMessagingNotInstalled(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { code?: string; message?: string };
  // 42P01 = undefined_table, PGRST202 = function not found in schema cache.
  return (
    e.code === '42P01' ||
    e.code === 'PGRST202' ||
    e.code === 'PGRST205' ||
    (e.message?.includes('direct_messages') ?? false) ||
    (e.message?.includes('get_conversations') ?? false) ||
    (e.message?.includes('get_shared_groups') ?? false)
  );
}
