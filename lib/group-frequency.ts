import type { GroupFrequency, IntervalUnit } from './types';

export interface GroupInterval {
  unit: IntervalUnit;
  count: number;
}

/** Legacy named frequencies, kept for back-compat probing and parsing. */
export const GROUP_FREQUENCIES: GroupFrequency[] = ['daily', 'weekly', 'monthly'];

const LEGACY_MAP: Record<string, GroupInterval> = {
  daily: { unit: 'day', count: 1 },
  weekly: { unit: 'week', count: 1 },
  biweekly: { unit: 'week', count: 2 },
  monthly: { unit: 'month', count: 1 },
};

const UNIT_NAME: Record<IntervalUnit, string> = {
  day: 'day',
  week: 'week',
  month: 'month',
};

/** Named labels for single-unit intervals. */
const SINGLE_LABEL: Record<IntervalUnit, string> = {
  day: 'Daily',
  week: 'Weekly',
  month: 'Monthly',
};

export const INTERVAL_UNITS: { unit: IntervalUnit; label: string; pluralLabel: string }[] = [
  { unit: 'day', label: 'Day', pluralLabel: 'Days' },
  { unit: 'week', label: 'Week', pluralLabel: 'Weeks' },
  { unit: 'month', label: 'Month', pluralLabel: 'Months' },
];

/** Quick-pick presets shown in the schedule picker. */
export const FREQUENCY_PRESETS: GroupInterval[] = [
  { unit: 'day', count: 1 },
  { unit: 'day', count: 2 },
  { unit: 'day', count: 3 },
  { unit: 'week', count: 1 },
  { unit: 'month', count: 1 },
  { unit: 'month', count: 2 },
];

function isUnit(value: string): value is IntervalUnit {
  return value === 'day' || value === 'week' || value === 'month';
}

export function clampIntervalCount(count: number): number {
  if (!Number.isFinite(count)) return 1;
  return Math.min(365, Math.max(1, Math.round(count)));
}

/** Parse a stored frequency token (or legacy name) into a structured interval. */
export function parseFrequency(value: GroupFrequency | null | undefined): GroupInterval {
  if (!value) return { unit: 'week', count: 1 };

  const legacy = LEGACY_MAP[value];
  if (legacy) return { ...legacy };

  const [unitRaw, countRaw] = value.split(':');
  if (isUnit(unitRaw)) {
    return { unit: unitRaw, count: clampIntervalCount(parseInt(countRaw ?? '1', 10)) };
  }

  return { unit: 'week', count: 1 };
}

/** Serialize an interval into the storage token, e.g. `week:1`. */
export function serializeInterval(interval: GroupInterval): GroupFrequency {
  return `${interval.unit}:${clampIntervalCount(interval.count)}`;
}

export function intervalsEqual(a: GroupInterval, b: GroupInterval): boolean {
  return a.unit === b.unit && a.count === b.count;
}

export function intervalLabel(interval: GroupInterval, opts?: { lowercase?: boolean }): string {
  const { unit, count } = interval;
  const label =
    count <= 1 ? SINGLE_LABEL[unit] : `Every ${count} ${UNIT_NAME[unit]}s`;
  return opts?.lowercase ? label.toLowerCase() : label;
}

export function frequencyLabel(
  frequency: GroupFrequency,
  opts?: { lowercase?: boolean }
): string {
  return intervalLabel(parseFrequency(frequency), opts);
}

/** Add `intervals` periods of the group's cadence to a base date. */
export function addFrequencyIntervals(
  base: Date,
  frequency: GroupFrequency,
  intervals: number
): Date {
  const { unit, count } = parseFrequency(frequency);
  const steps = count * intervals;
  const d = new Date(base);
  switch (unit) {
    case 'day':
      d.setDate(d.getDate() + steps);
      break;
    case 'week':
      d.setDate(d.getDate() + 7 * steps);
      break;
    case 'month':
      d.setMonth(d.getMonth() + steps);
      break;
  }
  return d;
}
