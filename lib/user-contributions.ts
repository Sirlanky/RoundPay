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
  const paid = rows.filter((r) => r.status === 'paid').length;
  const pending = rows.filter((r) => r.status === 'pending').length;
  const failed = rows.filter((r) => r.status === 'failed').length;
  const totalPaidAmount = rows
    .filter((r) => r.status === 'paid')
    .reduce((sum, r) => sum + r.amount, 0);

  return { paid, pending, failed, total: rows.length, totalPaidAmount };
}
