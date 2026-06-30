import { addFrequencyIntervals, parseFrequency, serializeInterval } from './group-frequency';
import type { TranslationKey } from './i18n/keys';
import type { AjoGroup, GroupFrequency } from './types';

/** How often members pay in (UI preset). */
export type CollectionFrequencyPreset = 'daily' | 'weekly' | 'monthly' | 'custom';

/** How often a member collects (UI preset). */
export type PayoutFrequencyPreset = 'weekly' | 'monthly' | 'end_of_cycle';

export interface GroupScheduleInput {
  collectionFrequency: CollectionFrequencyPreset;
  customCollectionDays?: number | null;
  payoutFrequency: PayoutFrequencyPreset;
}

export interface ResolvedGroupSchedule extends GroupScheduleInput {
  customCollectionDays: number | null;
  /** Legacy token kept in sync for existing RPCs and reports. */
  frequency: GroupFrequency;
  payInsPerCycle: number;
  nextCollectionDate: Date;
  nextPayoutDate: Date;
}

export const COLLECTION_FREQUENCY_OPTIONS: {
  value: CollectionFrequencyPreset;
  labelKey: 'create.collectionDaily' | 'create.collectionWeekly' | 'create.collectionMonthly' | 'create.collectionCustom';
}[] = [
  { value: 'daily', labelKey: 'create.collectionDaily' },
  { value: 'weekly', labelKey: 'create.collectionWeekly' },
  { value: 'monthly', labelKey: 'create.collectionMonthly' },
  { value: 'custom', labelKey: 'create.collectionCustom' },
];

export const PAYOUT_FREQUENCY_OPTIONS: {
  value: PayoutFrequencyPreset;
  labelKey: 'create.payoutWeekly' | 'create.payoutMonthly' | 'create.payoutEndOfCycle';
}[] = [
  { value: 'weekly', labelKey: 'create.payoutWeekly' },
  { value: 'monthly', labelKey: 'create.payoutMonthly' },
  { value: 'end_of_cycle', labelKey: 'create.payoutEndOfCycle' },
];

const PAYOUT_WINDOW_DAYS: Record<Exclude<PayoutFrequencyPreset, 'end_of_cycle'>, number> = {
  weekly: 7,
  monthly: 30,
};

export function clampCustomCollectionDays(days: number): number {
  if (!Number.isFinite(days)) return 1;
  return Math.min(365, Math.max(1, Math.round(days)));
}

/** Calendar days between each member pay-in for a schedule preset. */
export function collectionIntervalDays(input: GroupScheduleInput): number {
  switch (input.collectionFrequency) {
    case 'daily':
      return 1;
    case 'weekly':
      return 7;
    case 'monthly':
      return 30;
    case 'custom':
      return clampCustomCollectionDays(input.customCollectionDays ?? 0);
    default:
      return 7;
  }
}

/** Pay-ins parked before someone collects. */
export function resolvePayInsPerCycle(input: GroupScheduleInput): number {
  if (input.payoutFrequency === 'end_of_cycle') return 1;
  const collDays = collectionIntervalDays(input);
  if (collDays <= 0) return 1;
  const payoutDays = PAYOUT_WINDOW_DAYS[input.payoutFrequency];
  return Math.min(52, Math.max(1, Math.ceil(payoutDays / collDays)));
}

/** Map UI schedule to the legacy `frequency` column token. */
export function resolveFrequencyToken(input: GroupScheduleInput): GroupFrequency {
  switch (input.collectionFrequency) {
    case 'daily':
      return 'day:1';
    case 'weekly':
      return 'week:1';
    case 'monthly':
      return 'month:1';
    case 'custom': {
      const days = clampCustomCollectionDays(input.customCollectionDays ?? 1);
      return serializeInterval({ unit: 'day', count: days });
    }
    default:
      return 'week:1';
  }
}

export function computeNextScheduleDates(
  input: GroupScheduleInput,
  from: Date = new Date()
): { nextCollectionDate: Date; nextPayoutDate: Date } {
  const frequency = resolveFrequencyToken(input);
  const payIns = resolvePayInsPerCycle(input);
  return {
    nextCollectionDate: addFrequencyIntervals(from, frequency, 1),
    nextPayoutDate: addFrequencyIntervals(from, frequency, payIns),
  };
}

export function resolveGroupSchedule(
  input: GroupScheduleInput,
  from: Date = new Date()
): ResolvedGroupSchedule {
  const customCollectionDays =
    input.collectionFrequency === 'custom'
      ? clampCustomCollectionDays(input.customCollectionDays ?? 1)
      : null;
  const { nextCollectionDate, nextPayoutDate } = computeNextScheduleDates(
    { ...input, customCollectionDays },
    from
  );
  return {
    collectionFrequency: input.collectionFrequency,
    customCollectionDays,
    payoutFrequency: input.payoutFrequency,
    frequency: resolveFrequencyToken({ ...input, customCollectionDays }),
    payInsPerCycle: resolvePayInsPerCycle({ ...input, customCollectionDays }),
    nextCollectionDate,
    nextPayoutDate,
  };
}

export function validateGroupSchedule(
  input: GroupScheduleInput
): { ok: true; data: GroupScheduleInput } | { ok: false; messageKey: TranslationKey } {
  const validCollection = COLLECTION_FREQUENCY_OPTIONS.some((o) => o.value === input.collectionFrequency);
  if (!validCollection) return { ok: false, messageKey: 'create.scheduleCollectionRequired' };

  const validPayout = PAYOUT_FREQUENCY_OPTIONS.some((o) => o.value === input.payoutFrequency);
  if (!validPayout) return { ok: false, messageKey: 'create.schedulePayoutRequired' };

  if (input.collectionFrequency === 'custom') {
    const days = input.customCollectionDays;
    if (days == null || !Number.isFinite(days) || days <= 0) {
      return { ok: false, messageKey: 'create.scheduleCustomDaysInvalid' };
    }
  }

  return { ok: true, data: input };
}

export function parseCustomCollectionDays(raw: string): number | null {
  const n = parseInt(raw.replace(/\D/g, ''), 10);
  if (!Number.isFinite(n) || n < 1 || n > 365) return null;
  return n;
}

/** Build schedule fields from a stored group row (legacy or new columns). */
export function scheduleFromGroup(
  group: Pick<
    AjoGroup,
    | 'collection_frequency'
    | 'custom_collection_days'
    | 'payout_frequency'
    | 'frequency'
    | 'pay_ins_per_cycle'
  >
): GroupScheduleInput {
  if (group.collection_frequency && group.payout_frequency) {
    return {
      collectionFrequency: group.collection_frequency as CollectionFrequencyPreset,
      customCollectionDays: group.custom_collection_days ?? null,
      payoutFrequency: group.payout_frequency as PayoutFrequencyPreset,
    };
  }

  const { unit, count } = parseFrequency(group.frequency);
  const payIns = Math.max(1, group.pay_ins_per_cycle ?? 1);

  let collectionFrequency: CollectionFrequencyPreset;
  let customCollectionDays: number | null = null;

  if (unit === 'day' && count === 1) {
    collectionFrequency = 'daily';
  } else if (unit === 'week' && count === 1) {
    collectionFrequency = 'weekly';
  } else if (unit === 'month' && count === 1) {
    collectionFrequency = 'monthly';
  } else if (unit === 'day') {
    collectionFrequency = 'custom';
    customCollectionDays = count;
  } else if (unit === 'week') {
    collectionFrequency = 'custom';
    customCollectionDays = count * 7;
  } else {
    collectionFrequency = 'monthly';
  }

  let payoutFrequency: PayoutFrequencyPreset;
  if (payIns > 1) {
    payoutFrequency = 'monthly';
  } else if (collectionFrequency === 'monthly') {
    payoutFrequency = 'end_of_cycle';
  } else {
    payoutFrequency = 'weekly';
  }

  return { collectionFrequency, customCollectionDays, payoutFrequency };
}

export function collectionFrequencyLabel(
  input: GroupScheduleInput,
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
): string {
  if (input.collectionFrequency === 'custom') {
    const days = clampCustomCollectionDays(input.customCollectionDays ?? 1);
    return t('create.collectionEveryDays', { days });
  }
  const opt = COLLECTION_FREQUENCY_OPTIONS.find((o) => o.value === input.collectionFrequency);
  return opt ? t(opt.labelKey) : input.collectionFrequency;
}

export function payoutFrequencyLabel(
  payout: PayoutFrequencyPreset,
  t: (key: TranslationKey) => string
): string {
  const opt = PAYOUT_FREQUENCY_OPTIONS.find((o) => o.value === payout);
  return opt ? t(opt.labelKey) : payout;
}

export function scheduleSummaryLine(
  input: GroupScheduleInput,
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
): string {
  const resolved = resolveGroupSchedule(input);
  return t('create.scheduleSummaryLine', {
    collection: collectionFrequencyLabel(input, t),
    payout: payoutFrequencyLabel(input.payoutFrequency, t),
    payIns: resolved.payInsPerCycle,
  });
}
