import type { GroupFrequency } from './types';

export const GROUP_FREQUENCIES: GroupFrequency[] = ['daily', 'weekly', 'monthly'];

export const FREQUENCY_OPTIONS: { value: GroupFrequency; label: string; chipLabel: string }[] = [
  { value: 'daily', label: 'Daily', chipLabel: 'Daily' },
  { value: 'weekly', label: 'Weekly', chipLabel: 'Weekly' },
  { value: 'monthly', label: 'Monthly', chipLabel: 'Monthly' },
];

export function frequencyLabel(frequency: GroupFrequency, opts?: { lowercase?: boolean }): string {
  const label = FREQUENCY_OPTIONS.find((o) => o.value === frequency)?.label ?? frequency;
  return opts?.lowercase ? label.toLowerCase() : label;
}

export function addFrequencyIntervals(base: Date, frequency: GroupFrequency, intervals: number): Date {
  const d = new Date(base);
  switch (frequency) {
    case 'daily':
      d.setDate(d.getDate() + intervals);
      break;
    case 'weekly':
      d.setDate(d.getDate() + 7 * intervals);
      break;
    case 'monthly':
      d.setMonth(d.getMonth() + intervals);
      break;
  }
  return d;
}
