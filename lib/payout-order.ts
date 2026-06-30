import { supabase } from './supabase';

export interface PayoutSlot {
  id: string;
  groupId: string;
  position: number;
  userId: string;
  memberName: string;
  memberAvatarUrl: string | null;
}

type RawSlot = {
  id: string;
  group_id: string;
  position: number;
  user_id: string;
  profiles: {
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
};

function slotName(p: RawSlot['profiles']): string {
  if (!p) return 'Member';
  const full = p.full_name?.trim();
  if (full) return full;
  return [p.first_name, p.last_name].filter(Boolean).join(' ').trim() || 'Member';
}

export async function fetchPayoutSlots(groupId: string): Promise<PayoutSlot[]> {
  const { data, error } = await supabase
    .from('group_payout_slots')
    .select(
      `
      id,
      group_id,
      position,
      user_id,
      profiles:profiles!group_payout_slots_user_id_fkey (
        full_name,
        first_name,
        last_name,
        avatar_url
      )
    `
    )
    .eq('group_id', groupId)
    .order('position', { ascending: true });

  if (error) throw error;

  return ((data ?? []) as unknown as RawSlot[]).map((row) => ({
    id: row.id,
    groupId: row.group_id,
    position: row.position,
    userId: row.user_id,
    memberName: slotName(Array.isArray(row.profiles) ? row.profiles[0] : row.profiles),
    memberAvatarUrl:
      (Array.isArray(row.profiles) ? row.profiles[0] : row.profiles)?.avatar_url ?? null,
  }));
}

/** Replace draft payout order (allows same member more than once). */
export async function setPayoutOrder(groupId: string, orderedUserIds: string[]): Promise<void> {
  const { error } = await supabase.rpc('set_group_payout_order', {
    p_group_id: groupId,
    p_user_ids: orderedUserIds,
  });
  if (error) throw error;
}

export async function addPayoutSlot(groupId: string, userId: string): Promise<void> {
  const { error } = await supabase.rpc('add_group_payout_slot', {
    p_group_id: groupId,
    p_user_id: userId,
  });
  if (error) throw error;
}
