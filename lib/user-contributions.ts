import { supabase } from './supabase';
import type { ContributionStatus } from './types';

export interface UserContributionRow {
  id: string;
  amount: number;
  status: ContributionStatus;
  paid_at: string | null;
  created_at: string;
  groupId: string;
  groupName: string;
  cycleNumber: number;
  dueDate: string | null;
}

type ContributionQueryRow = {
  id: string;
  amount: number;
  status: ContributionStatus;
  paid_at: string | null;
  created_at: string;
  cycles: {
    cycle_number: number;
    due_date: string | null;
    groups: { id: string; name: string } | { id: string; name: string }[] | null;
  } | {
    cycle_number: number;
    due_date: string | null;
    groups: { id: string; name: string } | { id: string; name: string }[] | null;
  }[] | null;
};

function unwrapGroup(
  groups: ContributionQueryRow['cycles'] extends infer C
    ? C extends { groups: infer G }
      ? G
      : never
    : never
): { id: string; name: string } | null {
  if (!groups) return null;
  return Array.isArray(groups) ? groups[0] ?? null : groups;
}

function mapRow(row: ContributionQueryRow): UserContributionRow | null {
  const cycle = Array.isArray(row.cycles) ? row.cycles[0] : row.cycles;
  if (!cycle) return null;
  const group = unwrapGroup(cycle.groups as ContributionQueryRow['cycles'] extends infer C
    ? C extends { groups: infer G }
      ? G
      : never
    : never);
  if (!group) return null;

  return {
    id: row.id,
    amount: row.amount,
    status: row.status,
    paid_at: row.paid_at,
    created_at: row.created_at,
    groupId: group.id,
    groupName: group.name,
    cycleNumber: cycle.cycle_number,
    dueDate: cycle.due_date,
  };
}

/** All contribution rows for the signed-in user across every group. */
export async function getUserContributions(userId: string): Promise<UserContributionRow[]> {
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    throw new Error('Sign in to view your contributions.');
  }
  // Never trust a caller-supplied id if the session has changed (e.g. after sign-out/sign-in).
  if (user.id !== userId) {
    throw new Error('Your session changed. Pull down to refresh.');
  }

  const { data, error } = await supabase
    .from('contributions')
    .select(
      `
      id,
      amount,
      status,
      paid_at,
      created_at,
      cycles (
        cycle_number,
        due_date,
        groups (
          id,
          name
        )
      )
    `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return ((data ?? []) as ContributionQueryRow[])
    .map(mapRow)
    .filter((row): row is UserContributionRow => row !== null);
}

export function summarizeContributions(rows: UserContributionRow[]) {
  const paidRows = rows.filter((r) => r.status === 'paid');
  const pendingRows = rows.filter((r) => r.status === 'pending');
  const failed = rows.filter((r) => r.status === 'failed').length;
  const totalPaidAmount = paidRows.reduce((sum, r) => sum + r.amount, 0);
  const groupCount = new Set(rows.map((r) => r.groupId)).size;

  return {
    /** Number of contribution payments you have completed (one per cycle per group). */
    paid: paidRows.length,
    /** Number of contribution payments still owed. */
    pending: pendingRows.length,
    failed,
    total: rows.length,
    /** Sum of every completed payment you have made, across all groups. */
    totalPaidAmount,
    groupCount,
  };
}
