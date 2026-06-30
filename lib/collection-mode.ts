import { frequencyLabel, parseFrequency } from './group-frequency';
import type { AjoGroup, GroupFrequency } from './types';

/** Suggested default parkout length when pay-ins are weekly. */
export const DEFAULT_PARKOUT_PAY_INS = 4;

export type GroupSetupMode = 'standard' | 'monthly_target' | 'weekly_save_monthly';

export function isParkoutMode(group: Pick<AjoGroup, 'pay_ins_per_cycle'>): boolean {
  return (group.pay_ins_per_cycle ?? 1) > 1;
}

/** @deprecated use isParkoutMode */
export function isWeeklySaveMonthlyCollect(group: Pick<AjoGroup, 'pay_ins_per_cycle' | 'frequency'>): boolean {
  return isParkoutMode(group);
}

export function turnMoneyGross(
  payInAmount: number,
  memberCount: number,
  payInsPerCycle: number
): number {
  return payInAmount * memberCount * Math.max(1, payInsPerCycle);
}

export function memberTotalPerRound(payInAmount: number, payInsPerCycle: number): number {
  return payInAmount * Math.max(1, payInsPerCycle);
}

export function parseParkoutDuration(raw: string): number | null {
  const n = parseInt(raw.replace(/\D/g, ''), 10);
  if (!Number.isFinite(n) || n < 1 || n > 52) return null;
  return n;
}

export function parkoutPreset(params: {
  payInAmount: number;
  memberCount: number;
  frequency: GroupFrequency;
  payInsPerCycle?: number;
}) {
  const payInsPerCycle = params.payInsPerCycle ?? DEFAULT_PARKOUT_PAY_INS;
  const contributionAmount = params.payInAmount;
  const turnMoney = turnMoneyGross(contributionAmount, params.memberCount, payInsPerCycle);
  return {
    contributionAmount,
    payInsPerCycle,
    frequency: params.frequency,
    turnMoney,
    memberRoundTotal: memberTotalPerRound(contributionAmount, payInsPerCycle),
  };
}

/** Human label for one parkout window, e.g. "4 weekly pay-ins". */
export function parkoutDurationLabel(frequency: GroupFrequency, payInsPerCycle: number): string {
  const { unit, count } = parseFrequency(frequency);
  const n = Math.max(1, payInsPerCycle);
  const unitWord = unit === 'day' ? 'day' : unit === 'week' ? 'week' : 'month';
  const plural = n === 1 ? unitWord : `${unitWord}s`;
  if (count === 1) {
    return `${n} ${plural}`;
  }
  return `${n} pay-ins (every ${count} ${plural})`;
}

export function parkoutCollectLabel(frequency: GroupFrequency, payInsPerCycle: number): string {
  return `after ${parkoutDurationLabel(frequency, payInsPerCycle)}`;
}

/** Full circle ≈ one parkout window per collecting member. */
export function fullCircleParkoutRounds(memberCount: number, payInsPerCycle: number): number {
  return memberCount * Math.max(1, payInsPerCycle);
}

export function parkoutSummaryLine(params: {
  payInAmount: number;
  memberCount: number;
  frequency: GroupFrequency;
  payInsPerCycle: number;
}): { payInLine: string; collectLine: string; turnMoney: number } {
  const freq = frequencyLabel(params.frequency, { lowercase: true });
  const payIns = Math.max(1, params.payInsPerCycle);
  const turnMoney = turnMoneyGross(params.payInAmount, params.memberCount, payIns);
  return {
    payInLine: `${freq} pay-in`,
    collectLine: parkoutCollectLabel(params.frequency, payIns),
    turnMoney,
  };
}
