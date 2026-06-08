import { getAdminGroups } from '@/lib/admin/role';
import { memberDisplayName, type MemberWithProfile } from '@/lib/members';
import { supabase } from '@/lib/supabase';
import type { AjoGroup, Profile } from '@/lib/types';
import type { HomeActivity } from '@/lib/home-dashboard';

export type GroupHealth = 'healthy' | 'attention' | 'critical';

export interface AdminGroupSummary {
  group: AjoGroup;
  memberCount: number;
  paidCount: number;
  pendingCount: number;
  health: GroupHealth;
  nextPayoutName: string | null;
  dueDate: string | null;
}

export interface AdminDashboardStats {
  totalGroups: number;
  activeGroups: number;
  totalMembers: number;
  contributionsReceived: number;
  contributionsOutstanding: number;
  upcomingPayouts: number;
  pendingConfirmations: number;
}

export interface AdminDashboardData {
  stats: AdminDashboardStats;
  groups: AdminGroupSummary[];
  recentActivity: HomeActivity[];
}

function computeHealth(pending: number, isOverdue: boolean): GroupHealth {
  if (isOverdue && pending > 0) return 'critical';
  if (pending > 0) return 'attention';
  return 'healthy';
}

async function fetchStatsFromRpc(userId: string): Promise<AdminDashboardStats | null> {
  const { data, error } = await supabase.rpc('get_admin_dashboard_stats', {
    p_admin_id: userId,
  });

  if (error || !data || typeof data !== 'object') return null;

  const row = data as Record<string, number>;
  return {
    totalGroups: row.total_groups ?? 0,
    activeGroups: row.active_groups ?? 0,
    totalMembers: row.total_members ?? 0,
    contributionsReceived: Number(row.contributions_received ?? 0),
    contributionsOutstanding: Number(row.contributions_outstanding ?? 0),
    upcomingPayouts: row.upcoming_payouts ?? 0,
    pendingConfirmations: row.pending_confirmations ?? 0,
  };
}

async function buildGroupSummaries(groups: AjoGroup[]): Promise<AdminGroupSummary[]> {
  const summaries: AdminGroupSummary[] = [];

  for (const group of groups) {
    if (group.status !== 'active' && group.status !== 'draft') continue;

    const [membersRes, cycleRes] = await Promise.all([
      supabase
        .from('group_members')
        .select('*, profile:profiles(*)')
        .eq('group_id', group.id),
      group.status === 'active'
        ? supabase
            .from('cycles')
            .select('*, recipient:profiles(*)')
            .eq('group_id', group.id)
            .order('cycle_number', { ascending: false })
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const members = (membersRes.data ?? []) as MemberWithProfile[];
    const cycle = cycleRes.data as
      | ({ id: string; due_date: string | null; recipient?: Profile | null; recipient_id: string })
      | null;

    let paidCount = 0;
    let pendingCount = 0;
    let isOverdue = false;

    if (cycle?.id) {
      const { data: contribs } = await supabase
        .from('contributions')
        .select('status')
        .eq('cycle_id', cycle.id);

      for (const c of contribs ?? []) {
        if (c.status === 'paid') paidCount += 1;
        if (c.status === 'pending') pendingCount += 1;
      }

      if (cycle.due_date && new Date(cycle.due_date) < new Date() && pendingCount > 0) {
        isOverdue = true;
      }
    }

    let nextPayoutName: string | null = null;
    if (cycle?.recipient_id) {
      const member = members.find((m) => m.user_id === cycle.recipient_id);
      nextPayoutName = member
        ? memberDisplayName(member)
        : cycle.recipient?.full_name?.trim() ?? null;
    }

    summaries.push({
      group,
      memberCount: members.length,
      paidCount,
      pendingCount,
      health: computeHealth(pendingCount, isOverdue),
      nextPayoutName,
      dueDate: cycle?.due_date ?? null,
    });
  }

  return summaries;
}

async function fetchRecentAdminActivity(groups: AjoGroup[]): Promise<HomeActivity[]> {
  const activeIds = groups.filter((g) => g.status === 'active').map((g) => g.id);
  if (!activeIds.length) return [];

  const { data: cycles } = await supabase.from('cycles').select('id').in('group_id', activeIds);
  const cycleIds = (cycles ?? []).map((c) => c.id);
  if (!cycleIds.length) return [];

  const [contribRes, payoutRes] = await Promise.all([
    supabase
      .from('contributions')
      .select('id, paid_at, user_id, profiles:profiles!contributions_user_id_fkey(full_name)')
      .in('cycle_id', cycleIds)
      .eq('status', 'paid')
      .not('paid_at', 'is', null)
      .order('paid_at', { ascending: false })
      .limit(8),
    supabase
      .from('payouts')
      .select('id, created_at, recipient:profiles(full_name)')
      .in('cycle_id', cycleIds)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  const events: HomeActivity[] = [];

  for (const c of contribRes.data ?? []) {
    if (!c.paid_at) continue;
    const profile = c.profiles as { full_name?: string | null } | null;
    const who = profile?.full_name?.trim() || 'A member';
    events.push({
      id: `pay-${c.id}`,
      type: 'payment',
      timestamp: c.paid_at,
      label: `${who} contributed`,
    });
  }

  for (const p of payoutRes.data ?? []) {
    const recipient = p.recipient as { full_name?: string | null } | null;
    const who = recipient?.full_name?.trim() || 'Collector';
    events.push({
      id: `payout-${p.id}`,
      type: 'payout',
      timestamp: p.created_at,
      label: `${who} received payout`,
    });
  }

  return events
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8);
}

export async function fetchAdminDashboard(userId: string): Promise<AdminDashboardData> {
  const groups = await getAdminGroups(userId);
  const rpcStats = await fetchStatsFromRpc(userId);

  const [groupSummaries, recentActivity] = await Promise.all([
    buildGroupSummaries(groups),
    fetchRecentAdminActivity(groups),
  ]);

  const stats: AdminDashboardStats = rpcStats ?? {
    totalGroups: groups.filter((g) => !g.archived_at).length,
    activeGroups: groups.filter((g) => g.status === 'active').length,
    totalMembers: groupSummaries.reduce((sum, g) => sum + g.memberCount, 0),
    contributionsReceived: 0,
    contributionsOutstanding: groupSummaries.reduce(
      (sum, g) => sum + g.pendingCount * g.group.contribution_amount,
      0
    ),
    upcomingPayouts: groupSummaries.filter((g) => g.group.status === 'active').length,
    pendingConfirmations: groupSummaries.reduce((sum, g) => sum + g.pendingCount, 0),
  };

  return { stats, groups: groupSummaries, recentActivity };
}
