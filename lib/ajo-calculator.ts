import { parseFrequency, type GroupInterval } from './group-frequency';
import type { GroupFrequency } from './types';

/** Approximate collection rounds per calendar month (Nigeria-friendly: 4 weeks). */
export function cyclesPerMonth(frequency: GroupFrequency): number {
  const { unit, count } = parseFrequency(frequency);
  if (unit === 'day') return 30 / count;
  if (unit === 'week') return 4 / count;
  return 1 / count;
}

export interface ContributionSuggestion {
  contributionAmount: number;
  grossPerCycle: number;
  cyclesPerMonth: number;
}

/**
 * Total monthly pool turnover = sum of every round's pot in a month.
 * Example: 4 members × ₦10k weekly × 4 weeks ≈ ₦160k/month.
 */
export function suggestContributionFromMonthlyTarget(params: {
  monthlyPoolTarget: number;
  memberCount: number;
  frequency: GroupFrequency;
}): ContributionSuggestion | null {
  const { monthlyPoolTarget, memberCount, frequency } = params;
  if (monthlyPoolTarget <= 0 || memberCount < 2) return null;

  const rounds = cyclesPerMonth(frequency);
  const grossPerCycle = Math.round(monthlyPoolTarget / rounds);
  const contributionAmount = Math.max(100, Math.round(grossPerCycle / memberCount));

  return {
    contributionAmount,
    grossPerCycle: contributionAmount * memberCount,
    cyclesPerMonth: rounds,
  };
}

export function monthlyTurnoverFromContribution(params: {
  contributionAmount: number;
  memberCount: number;
  frequency: GroupFrequency;
}): number {
  const rounds = cyclesPerMonth(params.frequency);
  return Math.round(params.contributionAmount * params.memberCount * rounds);
}

export function formatIntervalShort(interval: GroupInterval): string {
  const { unit, count } = interval;
  if (count === 1) {
    return unit === 'day' ? 'daily' : unit === 'week' ? 'weekly' : 'monthly';
  }
  return `every ${count} ${unit}${count > 1 ? 's' : ''}`;
}
