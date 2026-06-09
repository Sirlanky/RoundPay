import { frequencyLabel } from './group-frequency';
import type { GroupFrequency } from './types';

/** Gross pool for one cycle (sum of all contributions in that cycle). */
export function cycleGrossPool(contributionAmount: number, contributorCount: number): number {
  return contributionAmount * contributorCount;
}

/**
 * Fee percent for a cycle payout. The admin never pays their own fee — when they
 * are the recipient, the fee is 0 and they receive the full gross pool.
 */
export function feePercentForRecipient(
  adminFeePercent: number,
  recipientId: string,
  adminId: string
): number {
  if (adminFeePercent <= 0) return 0;
  if (recipientId === adminId) return 0;
  return adminFeePercent;
}

export function cyclePayoutBreakdown(params: {
  grossPool: number;
  adminFeePercent: number;
  recipientId: string;
  adminId: string;
}): { gross: number; feePercent: number; feeAmount: number; net: number } {
  const { grossPool, adminFeePercent, recipientId, adminId } = params;
  const feePercent = feePercentForRecipient(adminFeePercent, recipientId, adminId);
  const feeAmount = Math.floor(grossPool * (feePercent / 100));
  const net = grossPool - feeAmount;
  return { gross: grossPool, feePercent, feeAmount, net };
}

function formatNairaShort(amount: number): string {
  return `₦${amount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}

/**
 * Human-readable pool summary for create/edit screens. When the admin is in the
 * rotation and a fee is set, members collect net-of-fee while the admin collects
 * the full pool on their turn.
 */
export function poolSummary(
  contributionAmount: number,
  memberCount: number,
  frequency: GroupFrequency,
  adminFeePercent: number,
  opts?: { adminParticipates?: boolean; memberWord?: string }
): string {
  const gross = cycleGrossPool(contributionAmount, memberCount);
  const freq = frequencyLabel(frequency, { lowercase: true });
  const members = opts?.memberWord ?? (memberCount === 1 ? 'member' : 'members');
  const base = `${formatNairaShort(contributionAmount)} × ${memberCount} ${members} · ${freq}`;

  if (adminFeePercent <= 0) {
    return `${base} · pool ${formatNairaShort(gross)}`;
  }

  const memberNet = cyclePayoutBreakdown({
    grossPool: gross,
    adminFeePercent,
    recipientId: 'member',
    adminId: 'admin',
  }).net;

  if (opts?.adminParticipates === false) {
    return `${base} · pool ${formatNairaShort(memberNet)} (${adminFeePercent}% admin fee)`;
  }

  if (opts?.adminParticipates) {
    return `${base} · members collect ${formatNairaShort(memberNet)} (${adminFeePercent}% fee) · admin collects ${formatNairaShort(gross)} on their turn`;
  }

  return `${base} · pool ${formatNairaShort(memberNet)} (${adminFeePercent}% admin fee)`;
}
