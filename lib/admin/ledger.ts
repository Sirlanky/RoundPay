import { getAdminGroups } from '@/lib/admin/role';
import { supabase } from '@/lib/supabase';
import type { ContributionStatus } from '@/lib/types';

export interface LedgerRow {
  id: string;
  groupId: string;
  groupName: string;
  memberName: string;
  memberAvatarUrl: string | null;
  amount: number;
  status: ContributionStatus;
  dueDate: string | null;
  paidAt: string | null;
  cycleNumber: number;
}

type RawRow = {
  id: string;
  amount: number;
  status: ContributionStatus;
  paid_at: string | null;
  user_id: string;
  cycles: {
    cycle_number: number;
    due_date: string | null;
    groups: { id: string; name: string } | { id: string; name: string }[] | null;
  } | null;
  profiles: { full_name: string | null; avatar_url: string | null } | null;
};

export async function fetchAdminLedger(
  userId: string,
  filters?: { status?: ContributionStatus | 'all'; query?: string; groupId?: string }
): Promise<LedgerRow[]> {
  const groups = await getAdminGroups(userId);
  let groupIds = new Set(groups.map((g) => g.id));
  if (filters?.groupId) {
    groupIds = new Set(groupIds.has(filters.groupId) ? [filters.groupId] : []);
  }
  if (!groupIds.size) return [];

  const { data: cycles } = await supabase.from('cycles').select('id').in('group_id', [...groupIds]);
  const cycleIds = (cycles ?? []).map((c) => c.id);
  if (!cycleIds.length) return [];

  let query = supabase
    .from('contributions')
    .select(
      `
      id,
      amount,
      status,
      paid_at,
      user_id,
      cycles (cycle_number, due_date, groups (id, name)),
      profiles:profiles!contributions_user_id_fkey (full_name, avatar_url)
    `
    )
    .in('cycle_id', cycleIds)
    .order('created_at', { ascending: false });

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows: LedgerRow[] = [];

  for (const raw of (data ?? []) as unknown as RawRow[]) {
    const cycle = raw.cycles;
    if (!cycle) continue;
    const groupObj = Array.isArray(cycle.groups) ? cycle.groups[0] : cycle.groups;
    if (!groupObj || !groupIds.has(groupObj.id)) continue;

    const memberName =
      raw.profiles?.full_name?.trim() ||
      `Member ${raw.user_id.slice(0, 6)}`;

    if (filters?.query) {
      const q = filters.query.toLowerCase();
      if (!memberName.toLowerCase().includes(q) && !groupObj.name.toLowerCase().includes(q)) {
        continue;
      }
    }

    rows.push({
      id: raw.id,
      groupId: groupObj.id,
      groupName: groupObj.name,
      memberName,
      memberAvatarUrl: raw.profiles?.avatar_url?.trim() || null,
      amount: raw.amount,
      status: raw.status,
      dueDate: cycle.due_date,
      paidAt: raw.paid_at,
      cycleNumber: cycle.cycle_number,
    });
  }

  return rows;
}
