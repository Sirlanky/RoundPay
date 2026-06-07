import { supabase } from './supabase';
import type { PayoutStatus } from './types';

export interface UserPayoutRow {
  id: string;
  amount: number;
  status: PayoutStatus;
  created_at: string;
  transferCode: string | null;
  groupId: string;
  groupName: string;
  cycleNumber: number;
  dueDate: string | null;
}

type PayoutQueryRow = {
  id: string;
  amount: number;
  status: PayoutStatus;
  created_at: string;
  paystack_transfer_code: string | null;
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
  groups: { id: string; name: string } | { id: string; name: string }[] | null | undefined
): { id: string; name: string } | null {
  if (!groups) return null;
  return Array.isArray(groups) ? groups[0] ?? null : groups;
}

function mapRow(row: PayoutQueryRow): UserPayoutRow | null {
  const cycle = Array.isArray(row.cycles) ? row.cycles[0] : row.cycles;
  if (!cycle) return null;
  const group = unwrapGroup(cycle.groups);
  if (!group) return null;

  return {
    id: row.id,
    amount: row.amount,
    status: row.status,
    created_at: row.created_at,
    transferCode: row.paystack_transfer_code,
    groupId: group.id,
    groupName: group.name,
    cycleNumber: cycle.cycle_number,
    dueDate: cycle.due_date,
  };
}

/** Payouts received by the signed-in user across all groups. */
export async function getUserPayouts(userId: string): Promise<UserPayoutRow[]> {
  const { data, error } = await supabase
    .from('payouts')
    .select(
      `
      id,
      amount,
      status,
      created_at,
      paystack_transfer_code,
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
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return ((data ?? []) as PayoutQueryRow[])
    .map(mapRow)
    .filter((row): row is UserPayoutRow => row !== null);
}

export function summarizePayouts(rows: UserPayoutRow[]) {
  const completed = rows.filter((r) => r.status === 'completed').length;
  const pending = rows.filter((r) => r.status === 'pending' || r.status === 'processing').length;
  const failed = rows.filter((r) => r.status === 'failed').length;
  const totalReceived = rows
    .filter((r) => r.status === 'completed')
    .reduce((sum, r) => sum + r.amount, 0);

  return { completed, pending, failed, total: rows.length, totalReceived };
}

export function payoutStatusVariant(
  status: PayoutStatus
): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  switch (status) {
    case 'completed':
      return 'success';
    case 'pending':
    case 'processing':
      return 'warning';
    case 'failed':
      return 'error';
    default:
      return 'neutral';
  }
}

export function payoutStatusLabel(status: PayoutStatus): string {
  return status.replace(/_/g, ' ');
}
