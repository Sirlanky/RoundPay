import { cyclePayoutBreakdown } from './admin-fee';
import { resolvePayoutBadgeStatus } from './cycle-utils';
import { supabase } from './supabase';

export interface GroupCycleHistory {
  id: string;
  cycleNumber: number;
  recipientId: string;
  recipientName: string;
  recipientAvatarUrl: string | null;
  status: string;
  dueDate: string | null;
  grossPool: number;
  feeAmount: number;
  payoutAmount: number | null;
  payoutStatus: string | null;
  payoutBadgeStatus: ReturnType<typeof resolvePayoutBadgeStatus>;
  payoutDate: string | null;
  paidCount: number;
  totalCount: number;
  expectedNetPayout: number;
}

export interface GroupHistorySummary {
  cycles: GroupCycleHistory[];
  totalPaidOut: number;
  totalFees: number;
  completedCycles: number;
}

type RawRecipient = {
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
} | null;

function recipientName(r: RawRecipient): string {
  if (!r) return 'Member';
  const full = r.full_name?.trim();
  if (full) return full;
  const composed = [r.first_name, r.last_name].filter(Boolean).join(' ').trim();
  return composed || 'Member';
}

export async function fetchGroupHistory(groupId: string): Promise<GroupHistorySummary> {
  const { data: group, error: groupErr } = await supabase
    .from('groups')
    .select('admin_id, admin_fee_percent')
    .eq('id', groupId)
    .single();
  if (groupErr) throw groupErr;

  const adminId = (group as { admin_id: string }).admin_id;
  const adminFeePercent = (group as { admin_fee_percent: number }).admin_fee_percent ?? 0;

  const { data: cycles, error } = await supabase
    .from('cycles')
    .select(
      'id, cycle_number, recipient_id, status, due_date, recipient:profiles(full_name, first_name, last_name, avatar_url)'
    )
    .eq('group_id', groupId)
    .order('cycle_number', { ascending: true });
  if (error) throw error;

  const rows = (cycles ?? []) as Array<{
    id: string;
    cycle_number: number;
    recipient_id: string;
    status: string;
    due_date: string | null;
    recipient: RawRecipient | RawRecipient[];
  }>;

  const cycleIds = rows.map((c) => c.id);
  if (!cycleIds.length) {
    return { cycles: [], totalPaidOut: 0, totalFees: 0, completedCycles: 0 };
  }

  const [{ data: payouts }, { data: contribs }] = await Promise.all([
    supabase.from('payouts').select('cycle_id, amount, status, created_at').in('cycle_id', cycleIds),
    supabase.from('contributions').select('cycle_id, status, amount').in('cycle_id', cycleIds),
  ]);

  const payoutByCycle = new Map<string, { amount: number; status: string; created_at: string }>();
  for (const p of payouts ?? []) {
    payoutByCycle.set((p as { cycle_id: string }).cycle_id, p as never);
  }

  const counts = new Map<string, { paid: number; total: number; gross: number }>();
  for (const c of contribs ?? []) {
    const row = c as { cycle_id: string; status: string; amount: number };
    const entry = counts.get(row.cycle_id) ?? { paid: 0, total: 0, gross: 0 };
    entry.total += 1;
    entry.gross += row.amount;
    if (row.status === 'paid') entry.paid += 1;
    counts.set(row.cycle_id, entry);
  }

  let totalPaidOut = 0;
  let totalFees = 0;
  let completedCycles = 0;

  const cyclesOut: GroupCycleHistory[] = rows.map((c) => {
    const recipient = (Array.isArray(c.recipient) ? c.recipient[0] : c.recipient) ?? null;
    const payout = payoutByCycle.get(c.id) ?? null;
    const count = counts.get(c.id) ?? { paid: 0, total: 0, gross: 0 };
    const breakdown = cyclePayoutBreakdown({
      grossPool: count.gross,
      adminFeePercent,
      recipientId: c.recipient_id,
      adminId,
    });
    const payoutStatus = payout?.status ?? null;
    const payoutBadgeStatus = resolvePayoutBadgeStatus({
      cycleStatus: c.status,
      payoutStatus,
    });
    if (payoutBadgeStatus === 'paid_out') {
      totalPaidOut += payout?.amount ?? breakdown.net;
      totalFees += breakdown.feeAmount;
      completedCycles += 1;
    }
    return {
      id: c.id,
      cycleNumber: c.cycle_number,
      recipientId: c.recipient_id,
      recipientName: recipientName(recipient),
      recipientAvatarUrl: recipient?.avatar_url ?? null,
      status: c.status,
      dueDate: c.due_date,
      grossPool: count.gross,
      feeAmount: breakdown.feeAmount,
      payoutAmount: payout?.amount ?? null,
      payoutStatus,
      payoutBadgeStatus,
      payoutDate: payout?.created_at ?? null,
      paidCount: count.paid,
      totalCount: count.total,
      expectedNetPayout: breakdown.net,
    };
  });

  return { cycles: cyclesOut, totalPaidOut, totalFees, completedCycles };
}

export interface GroupCollectionTotals {
  collected: number;
  outstanding: number;
}

/** Sum of paid vs pending contribution amounts across every cycle in the group. */
export async function fetchGroupCollectionTotals(groupId: string): Promise<GroupCollectionTotals> {
  const { data: cycles, error: cycleErr } = await supabase.from('cycles').select('id').eq('group_id', groupId);
  if (cycleErr) throw cycleErr;

  const cycleIds = (cycles ?? []).map((c) => (c as { id: string }).id);
  if (!cycleIds.length) return { collected: 0, outstanding: 0 };

  const { data, error } = await supabase
    .from('contributions')
    .select('amount, status')
    .in('cycle_id', cycleIds);
  if (error) throw error;

  let collected = 0;
  let outstanding = 0;
  for (const row of data ?? []) {
    const r = row as { amount: number; status: string };
    if (r.status === 'paid') collected += r.amount;
    else if (r.status === 'pending') outstanding += r.amount;
  }
  return { collected, outstanding };
}
