import type { GroupCycleHistory, GroupHistorySummary } from './group-history';
import { fetchGroupHistory } from './group-history';
import { supabase } from './supabase';
import type { ContributionStatus } from './types';

export interface CycleContributionRow {
  id: string;
  userId: string;
  memberName: string;
  memberAvatarUrl: string | null;
  amount: number;
  status: ContributionStatus;
  paidAt: string | null;
  createdAt: string;
}

export interface GroupHistoryCycle extends GroupCycleHistory {
  contributions: CycleContributionRow[];
}

export interface FullGroupHistory extends GroupHistorySummary {
  cycles: GroupHistoryCycle[];
  groupName: string;
  contributionAmount: number;
  adminId: string;
  adminFeePercent: number;
}

type RawProfile = {
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
} | null;

function displayName(profile: RawProfile): string {
  if (!profile) return 'Member';
  const full = profile.full_name?.trim();
  if (full) return full;
  const composed = [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim();
  return composed || 'Member';
}

function mapContribution(raw: {
  id: string;
  cycle_id: string;
  user_id: string;
  amount: number;
  status: ContributionStatus;
  paid_at: string | null;
  created_at: string;
  profiles: RawProfile | RawProfile[];
}): CycleContributionRow {
  const profile = Array.isArray(raw.profiles) ? raw.profiles[0] : raw.profiles;
  return {
    id: raw.id,
    userId: raw.user_id,
    memberName: displayName(profile),
    memberAvatarUrl: profile?.avatar_url ?? null,
    amount: raw.amount,
    status: raw.status,
    paidAt: raw.paid_at,
    createdAt: raw.created_at,
  };
}

/** Every cycle for a group, each with member contribution rows. */
export async function fetchFullGroupHistory(groupId: string): Promise<FullGroupHistory> {
  const [{ data: group }, summary] = await Promise.all([
    supabase
      .from('groups')
      .select('name, admin_id, admin_fee_percent, contribution_amount')
      .eq('id', groupId)
      .single(),
    fetchGroupHistory(groupId),
  ]);

  const empty: FullGroupHistory = {
    ...summary,
    cycles: [],
    groupName: '',
    contributionAmount: 0,
    adminId: '',
    adminFeePercent: 0,
  };

  if (!group) return empty;

  const groupName = (group as { name: string }).name;
  const adminId = (group as { admin_id: string }).admin_id;
  const adminFeePercent = (group as { admin_fee_percent: number }).admin_fee_percent ?? 0;
  const contributionAmount = (group as { contribution_amount: number }).contribution_amount;

  const cycleIds = summary.cycles.map((c) => c.id);
  if (!cycleIds.length) {
    return { ...summary, cycles: [], groupName, contributionAmount, adminId, adminFeePercent };
  }

  const { data: contribs, error } = await supabase
    .from('contributions')
    .select(
      `
      id,
      cycle_id,
      user_id,
      amount,
      status,
      paid_at,
      created_at,
      profiles:profiles!contributions_user_id_fkey (full_name, first_name, last_name, avatar_url)
    `
    )
    .in('cycle_id', cycleIds)
    .order('created_at', { ascending: true });

  if (error) throw error;

  const byCycle = new Map<string, CycleContributionRow[]>();
  for (const row of contribs ?? []) {
    const mapped = mapContribution(row as never);
    const list = byCycle.get((row as { cycle_id: string }).cycle_id) ?? [];
    list.push(mapped);
    byCycle.set((row as { cycle_id: string }).cycle_id, list);
  }

  const cycles: GroupHistoryCycle[] = summary.cycles.map((cycle) => ({
    ...cycle,
    contributions: byCycle.get(cycle.id) ?? [],
  }));

  return {
    ...summary,
    cycles,
    groupName,
    contributionAmount,
    adminId,
    adminFeePercent,
  };
}
