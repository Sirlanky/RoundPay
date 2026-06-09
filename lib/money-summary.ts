import { cyclePayoutBreakdown } from './admin-fee';
import { payoutFromContributions, resolvePayoutBadgeStatus } from './cycle-utils';
import { fetchGroupHistory } from './group-history';
import { getAdminGroups } from './admin/role';
import { supabase } from './supabase';

/** Personal wallet: what you paid in vs what you collected from the circle. */
export interface MemberMoneySummary {
  paidIn: number;
  /** Payouts already sent to you (completed only). */
  collected: number;
  /** Your turn(s) where payout has not been sent yet. */
  pendingToReceive: number;
  /** collected − paidIn — personal savings in the circle, not admin fees. */
  netPosition: number;
  paidCount: number;
  pendingCount: number;
  payoutCount: number;
  pendingPayoutCount: number;
}

export interface AdminFeeByGroup {
  groupId: string;
  groupName: string;
  feePercent: number;
  earned: number;
  completedCycles: number;
}

export interface AdminFeeSummary {
  totalEarned: number;
  byGroup: AdminFeeByGroup[];
}

export interface AdminEarningEntry {
  id: string;
  groupId: string;
  groupName: string;
  cycleNumber: number;
  recipientName: string;
  feeAmount: number;
  feePercent: number;
  earnedAt: string | null;
}

export interface AdminEarningsHistory {
  totalEarned: number;
  entries: AdminEarningEntry[];
}

export async function fetchMemberMoneySummary(userId: string): Promise<MemberMoneySummary> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== userId) {
    return {
      paidIn: 0,
      collected: 0,
      pendingToReceive: 0,
      netPosition: 0,
      paidCount: 0,
      pendingCount: 0,
      payoutCount: 0,
      pendingPayoutCount: 0,
    };
  }

  const [{ data: contribs, error: contribsErr }, { data: payouts, error: payoutsErr }, cyclesRes] =
    await Promise.all([
      supabase.from('contributions').select('amount, status').eq('user_id', userId),
      supabase.from('payouts').select('amount, status').eq('recipient_id', userId).eq('status', 'completed'),
      supabase
        .from('cycles')
        .select(
          `
        id,
        status,
        recipient_id,
        group_id,
        groups!inner (admin_id, admin_fee_percent),
        contributions (amount, status),
        payouts (status)
      `
        )
        .eq('recipient_id', userId),
    ]);

  const cycles = cyclesRes.error ? [] : (cyclesRes.data ?? []);

  let paidIn = 0;
  let paidCount = 0;
  let pendingCount = 0;
  for (const c of contribs ?? []) {
    const row = c as { amount: number; status: string };
    if (row.status === 'paid') {
      paidIn += row.amount;
      paidCount += 1;
    } else if (row.status === 'pending') {
      pendingCount += 1;
    }
  }

  const collected = (payouts ?? []).reduce(
    (sum, p) => sum + ((p as { amount: number }).amount ?? 0),
    0
  );

  let pendingToReceive = 0;
  let pendingPayoutCount = 0;
  for (const raw of cycles ?? []) {
    const cycle = raw as {
      status: string;
      groups: { admin_id: string; admin_fee_percent: number } | { admin_id: string; admin_fee_percent: number }[] | null;
      contributions: Array<{ amount: number; status: string }> | null;
      payouts: { status: string } | { status: string }[] | null;
    };
    const group = Array.isArray(cycle.groups) ? cycle.groups[0] : cycle.groups;
    if (!group) continue;

    const contribs = cycle.contributions ?? [];
    const allPaid = contribs.length > 0 && contribs.every((c) => c.status === 'paid');

    const payout = Array.isArray(cycle.payouts) ? cycle.payouts[0] : cycle.payouts;
    const badge = resolvePayoutBadgeStatus({
      cycleStatus: cycle.status,
      payoutStatus: payout?.status ?? null,
    });
    if (badge === 'paid_out') continue;
    // Only money owed now: everyone paid but admin has not sent payout yet.
    if (!allPaid && cycle.status !== 'completed') continue;

    pendingPayoutCount += 1;
    pendingToReceive += payoutFromContributions({
      contributions: contribs,
      adminFeePercent: group.admin_fee_percent ?? 0,
      recipientId: userId,
      adminId: group.admin_id,
      estimateIfIncomplete: !allPaid,
    }).net;
  }

  return {
    paidIn,
    collected,
    pendingToReceive,
    netPosition: collected - paidIn,
    paidCount,
    pendingCount,
    payoutCount: payouts?.length ?? 0,
    pendingPayoutCount,
  };
}

/**
 * Admin fee income: sum of fees retained on member payout cycles (not on the admin's own turn).
 */
export async function fetchAdminFeeSummary(adminId: string): Promise<AdminFeeSummary> {
  const groups = await getAdminGroups(adminId);
  const feeGroups = groups.filter((g) => g.admin_fee_percent && g.admin_fee_percent > 0);

  const histories = await Promise.all(
    feeGroups.map(async (group) => {
      try {
        const history = await fetchGroupHistory(group.id);
        return { group, history };
      } catch {
        return { group, history: null };
      }
    })
  );

  const byGroup: AdminFeeByGroup[] = [];
  let totalEarned = 0;

  for (const { group, history } of histories) {
    if (!history) continue;
    totalEarned += history.totalFees;
    if (history.totalFees <= 0 && history.completedCycles === 0) continue;

    byGroup.push({
      groupId: group.id,
      groupName: group.name,
      feePercent: group.admin_fee_percent,
      earned: history.totalFees,
      completedCycles: history.completedCycles,
    });
  }

  byGroup.sort((a, b) => b.earned - a.earned);
  return { totalEarned, byGroup };
}

/** Cycle-by-cycle admin fee history across all managed groups. */
export async function fetchAdminEarningsHistory(adminId: string): Promise<AdminEarningsHistory> {
  const groups = await getAdminGroups(adminId);
  const feeGroups = groups.filter((g) => g.admin_fee_percent && g.admin_fee_percent > 0);

  const histories = await Promise.all(
    feeGroups.map(async (group) => {
      try {
        const history = await fetchGroupHistory(group.id);
        return { group, history };
      } catch {
        return { group, history: null };
      }
    })
  );

  const entries: AdminEarningEntry[] = [];
  let totalEarned = 0;

  for (const { group, history } of histories) {
    if (!history) continue;
    totalEarned += history.totalFees;

    for (const cycle of history.cycles) {
      if (cycle.payoutBadgeStatus !== 'paid_out' || cycle.feeAmount <= 0) continue;
      entries.push({
        id: cycle.id,
        groupId: group.id,
        groupName: group.name,
        cycleNumber: cycle.cycleNumber,
        recipientName: cycle.recipientName,
        feeAmount: cycle.feeAmount,
        feePercent: group.admin_fee_percent,
        earnedAt: cycle.payoutDate,
      });
    }
  }

  entries.sort((a, b) => {
    const ta = a.earnedAt ? new Date(a.earnedAt).getTime() : 0;
    const tb = b.earnedAt ? new Date(b.earnedAt).getTime() : 0;
    return tb - ta;
  });

  return { totalEarned, entries };
}

/** Admin fees earned for a single group. */
export async function fetchGroupAdminFees(groupId: string): Promise<number> {
  try {
    const history = await fetchGroupHistory(groupId);
    return history.totalFees;
  } catch {
    return 0;
  }
}

/** Preview net payout for a cycle (used in admin ops views). */
export function previewCyclePayout(params: {
  grossPool: number;
  adminFeePercent: number;
  recipientId: string;
  adminId: string;
}): { gross: number; fee: number; net: number } {
  const b = cyclePayoutBreakdown(params);
  return { gross: b.gross, fee: b.feeAmount, net: b.net };
}
