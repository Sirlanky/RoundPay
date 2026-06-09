import { payoutFromContributions, resolvePayoutBadgeStatus } from './cycle-utils';
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

function unwrapGroup(
  groups:
    | { id: string; name: string; admin_id?: string; admin_fee_percent?: number }
    | { id: string; name: string; admin_id?: string; admin_fee_percent?: number }[]
    | null
    | undefined
): { id: string; name: string; admin_id: string; admin_fee_percent: number } | null {
  const group = !groups ? null : Array.isArray(groups) ? groups[0] ?? null : groups;
  if (!group?.admin_id) return null;
  return {
    id: group.id,
    name: group.name,
    admin_id: group.admin_id,
    admin_fee_percent: group.admin_fee_percent ?? 0,
  };
}

/** Payouts received by (or owed to) the signed-in user across all groups. */
export async function getUserPayouts(userId: string): Promise<UserPayoutRow[]> {
  const { data: cycles, error } = await supabase
    .from('cycles')
    .select(
      `
      id,
      cycle_number,
      status,
      due_date,
      recipient_id,
      groups (id, name, admin_id, admin_fee_percent),
      contributions (amount, status),
      payouts (
        id,
        amount,
        status,
        created_at,
        paystack_transfer_code
      )
    `
    )
    .eq('recipient_id', userId)
    .order('cycle_number', { ascending: false });

  if (error) throw error;

  const rows: UserPayoutRow[] = [];

  for (const raw of cycles ?? []) {
    const cycle = raw as {
      id: string;
      cycle_number: number;
      status: string;
      due_date: string | null;
      groups:
        | { id: string; name: string; admin_id: string; admin_fee_percent: number }
        | { id: string; name: string; admin_id: string; admin_fee_percent: number }[]
        | null;
      contributions: Array<{ amount: number; status: string }> | null;
      payouts:
        | {
            id: string;
            amount: number;
            status: PayoutStatus;
            created_at: string;
            paystack_transfer_code: string | null;
          }
        | {
            id: string;
            amount: number;
            status: PayoutStatus;
            created_at: string;
            paystack_transfer_code: string | null;
          }[]
        | null;
    };

    const group = unwrapGroup(cycle.groups);
    if (!group) continue;

    const payout = Array.isArray(cycle.payouts) ? cycle.payouts[0] : cycle.payouts;
    const badgeStatus = resolvePayoutBadgeStatus({
      cycleStatus: cycle.status,
      payoutStatus: payout?.status ?? null,
    });

    const breakdown = payoutFromContributions({
      contributions: cycle.contributions ?? [],
      adminFeePercent: group.admin_fee_percent ?? 0,
      recipientId: userId,
      adminId: group.admin_id,
      estimateIfIncomplete: true,
    });

    const status: PayoutStatus =
      badgeStatus === 'paid_out'
        ? 'completed'
        : badgeStatus === 'processing' || badgeStatus === 'failed' || badgeStatus === 'pending'
          ? badgeStatus
          : 'pending';

    rows.push({
      id: payout?.id ?? `pending-${cycle.id}`,
      amount: payout?.amount ?? breakdown.net,
      status,
      created_at: payout?.created_at ?? cycle.due_date ?? '',
      transferCode: payout?.paystack_transfer_code ?? null,
      groupId: group.id,
      groupName: group.name,
      cycleNumber: cycle.cycle_number,
      dueDate: cycle.due_date,
    });
  }

  return rows.sort((a, b) => {
    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
    return bTime - aTime;
  });
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
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'pending':
      return 'Pending';
    case 'processing':
      return 'Processing';
    case 'failed':
      return 'Failed';
    default:
      return String(status).replace(/_/g, ' ');
  }
}
