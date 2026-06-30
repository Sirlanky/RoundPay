import { supabase } from './supabase';

export type CycleSwapStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface CycleSwapRequest {
  id: string;
  groupId: string;
  cycleId: string;
  cycleNumber: number;
  requesterId: string;
  requesterName: string;
  scheduledRecipientId: string;
  scheduledRecipientName: string;
  status: CycleSwapStatus;
  scheduledApprovedAt: string | null;
  adminApprovedAt: string | null;
  createdAt: string;
}

export async function requestCycleSwap(cycleId: string): Promise<string> {
  const { data, error } = await supabase.rpc('request_cycle_swap', { p_cycle_id: cycleId });
  if (error) throw error;
  return data as string;
}

export async function respondCycleSwap(
  requestId: string,
  role: 'scheduled' | 'admin',
  approve: boolean
): Promise<void> {
  const { error } = await supabase.rpc('respond_cycle_swap', {
    p_request_id: requestId,
    p_role: role,
    p_approve: approve,
  });
  if (error) throw error;
}

export async function fetchPendingCycleSwaps(groupId: string): Promise<CycleSwapRequest[]> {
  const { data, error } = await supabase
    .from('cycle_swap_requests')
    .select(
      `
      id,
      group_id,
      cycle_id,
      requester_id,
      scheduled_recipient_id,
      status,
      scheduled_approved_at,
      admin_approved_at,
      created_at,
      cycles (cycle_number),
      requester:profiles!cycle_swap_requests_requester_id_fkey (full_name, first_name, last_name),
      scheduled:profiles!cycle_swap_requests_scheduled_recipient_id_fkey (full_name, first_name, last_name)
    `
    )
    .eq('group_id', groupId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((raw) => {
    const row = raw as unknown as {
      id: string;
      group_id: string;
      cycle_id: string;
      requester_id: string;
      scheduled_recipient_id: string;
      status: CycleSwapStatus;
      scheduled_approved_at: string | null;
      admin_approved_at: string | null;
      created_at: string;
      cycles: { cycle_number: number } | { cycle_number: number }[] | null;
      requester: { full_name: string | null; first_name: string | null; last_name: string | null } | { full_name: string | null; first_name: string | null; last_name: string | null }[] | null;
      scheduled: { full_name: string | null; first_name: string | null; last_name: string | null } | { full_name: string | null; first_name: string | null; last_name: string | null }[] | null;
    };
    const cycle = Array.isArray(row.cycles) ? row.cycles[0] : row.cycles;
    const profile = (
      p: typeof row.requester
    ): { full_name: string | null; first_name: string | null; last_name: string | null } | null => {
      if (!p) return null;
      return Array.isArray(p) ? (p[0] ?? null) : p;
    };
    const name = (p: typeof row.requester) => {
      const prof = profile(p);
      if (!prof) return 'Member';
      return prof.full_name?.trim() || [prof.first_name, prof.last_name].filter(Boolean).join(' ').trim() || 'Member';
    };
    return {
      id: row.id,
      groupId: row.group_id,
      cycleId: row.cycle_id,
      cycleNumber: cycle?.cycle_number ?? 0,
      requesterId: row.requester_id,
      requesterName: name(row.requester),
      scheduledRecipientId: row.scheduled_recipient_id,
      scheduledRecipientName: name(row.scheduled),
      status: row.status,
      scheduledApprovedAt: row.scheduled_approved_at,
      adminApprovedAt: row.admin_approved_at,
      createdAt: row.created_at,
    };
  });
}
