import { cycleGrossPool, cyclePayoutBreakdown } from './admin-fee';
import type { PayoutStatus } from './types';

export type PayoutDisplayStatus = 'paid_out' | PayoutStatus;

/** Badge label for whether the collector has received their payout yet. */
export function resolvePayoutBadgeStatus(params: {
  cycleStatus: string;
  payoutStatus: string | null;
}): PayoutDisplayStatus {
  const { cycleStatus, payoutStatus } = params;
  if (payoutStatus === 'completed' || cycleStatus === 'paid_out') return 'paid_out';
  if (payoutStatus === 'processing') return 'processing';
  if (payoutStatus === 'failed') return 'failed';
  return 'pending';
}

export function isLastCycle(cycleNumber: number, memberCount: number): boolean {
  return memberCount > 0 && cycleNumber >= memberCount;
}

export function cyclePositionLabel(cycleNumber: number, memberCount: number): string {
  if (memberCount <= 0) return `Cycle ${cycleNumber}`;
  return `Cycle ${cycleNumber} of ${memberCount}`;
}

export function netCyclePayout(params: {
  grossPool: number;
  adminFeePercent: number;
  recipientId: string;
  adminId: string;
}): number {
  return cyclePayoutBreakdown(params).net;
}

/** Gross pool when every member pays the fixed contribution amount. */
export function estimatedGrossPool(contributionAmount: number, contributorCount: number): number {
  return cycleGrossPool(contributionAmount, contributorCount);
}

/** Expected net payout before/after all contributions are in. */
export function estimatedNetPayout(params: {
  contributionAmount: number;
  contributorCount: number;
  adminFeePercent: number;
  recipientId: string;
  adminId: string;
}): number {
  const gross = estimatedGrossPool(params.contributionAmount, params.contributorCount);
  return netCyclePayout({
    grossPool: gross,
    adminFeePercent: params.adminFeePercent,
    recipientId: params.recipientId,
    adminId: params.adminId,
  });
}

/** Actual gross from contribution rows (uses all rows when every one is paid). */
export function grossPoolFromContributions(
  contributions: Array<{ amount: number; status: string }>
): number {
  if (!contributions.length) return 0;
  const allPaid = contributions.every((c) => c.status === 'paid');
  if (allPaid) {
    return contributions.reduce((sum, c) => sum + c.amount, 0);
  }
  return contributions.reduce((sum, c) => (c.status === 'paid' ? sum + c.amount : sum), 0);
}

export function payoutFromContributions(params: {
  contributions: Array<{ amount: number; status: string }>;
  adminFeePercent: number;
  recipientId: string;
  adminId: string;
  /** When true and not all paid yet, estimate from first contribution × count. */
  estimateIfIncomplete?: boolean;
}): { gross: number; net: number; feeAmount: number; isEstimate: boolean } {
  const { contributions, adminFeePercent, recipientId, adminId, estimateIfIncomplete } = params;
  const allPaid = contributions.length > 0 && contributions.every((c) => c.status === 'paid');

  let gross: number;
  let isEstimate = false;

  if (allPaid) {
    gross = contributions.reduce((sum, c) => sum + c.amount, 0);
  } else if (estimateIfIncomplete && contributions.length > 0) {
    gross = contributions[0].amount * contributions.length;
    isEstimate = true;
  } else {
    gross = grossPoolFromContributions(contributions);
  }

  const breakdown = cyclePayoutBreakdown({
    grossPool: gross,
    adminFeePercent,
    recipientId,
    adminId,
  });

  return { gross: breakdown.gross, net: breakdown.net, feeAmount: breakdown.feeAmount, isEstimate };
}
