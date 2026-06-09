import { addFrequencyIntervals } from './group-frequency';
import type { AjoGroup, Cycle, CycleStatus, Profile } from './types';
import { memberDisplayName, type MemberWithProfile } from './members';

export type ScheduleDateSource = 'recorded' | 'estimated' | 'pending';

export interface PayoutScheduleEntry {
  round: number;
  dueDate: string | null;
  dateSource: ScheduleDateSource;
  collectorName: string;
  cycleStatus: CycleStatus | null;
  isCurrent: boolean;
  isYou: boolean;
  displayStatus: string;
}

type CycleWithRecipient = Cycle & { recipient?: Profile | null };

function collectorNameForRound(
  round: number,
  members: MemberWithProfile[],
  cycle: CycleWithRecipient | undefined
): string {
  const member = members.find((m) => m.rotation_order === round);
  if (member) return memberDisplayName(member);
  if (cycle?.recipient) {
    const name = cycle.recipient.full_name?.trim();
    if (name) return name;
  }
  return 'Not assigned yet';
}

function displayStatus(
  group: AjoGroup,
  round: number,
  cycle: CycleWithRecipient | undefined,
  member: MemberWithProfile | undefined,
  isCurrent: boolean
): string {
  if (group.status === 'draft') return 'Starts when group begins';

  if (cycle) {
    if (cycle.status === 'paid_out' || member?.has_collected) return 'Completed';
    if (isCurrent) {
      if (cycle.status === 'completed') return 'Pending';
      return 'Current round';
    }
    if (cycle.status === 'completed') return 'Pending';
    return 'Scheduled';
  }

  if (member?.has_collected) return 'Completed';
  if (isCurrent) return 'Current round';
  return 'Upcoming';
}

export function buildPayoutSchedule(
  group: AjoGroup,
  members: MemberWithProfile[],
  cycles: CycleWithRecipient[],
  currentUserId?: string
): PayoutScheduleEntry[] {
  const sorted = [...members].sort((a, b) => a.rotation_order - b.rotation_order);
  if (!sorted.length) return [];

  const cycleByRound = new Map(cycles.map((c) => [c.cycle_number, c]));
  const firstCycle = cycles.find((c) => c.cycle_number === 1) ?? cycles[0];
  const isDraft = group.status === 'draft';
  const currentRound = group.current_cycle;

  return sorted.map((member) => {
    const round = member.rotation_order;
    const cycle = cycleByRound.get(round);
    const isCurrent = !isDraft && currentRound === round;
    const isYou = member.user_id === currentUserId;

    let dueDate: string | null = null;
    let dateSource: ScheduleDateSource = 'pending';

    if (cycle?.due_date) {
      dueDate = cycle.due_date;
      dateSource = 'recorded';
    } else if (!isDraft && firstCycle?.due_date) {
      dueDate = addFrequencyIntervals(
        new Date(firstCycle.due_date),
        group.frequency,
        round - firstCycle.cycle_number
      ).toISOString();
      dateSource = 'estimated';
    }

    return {
      round,
      dueDate,
      dateSource,
      collectorName: collectorNameForRound(round, members, cycle),
      cycleStatus: cycle?.status ?? null,
      isCurrent,
      isYou,
      displayStatus: displayStatus(group, round, cycle, member, isCurrent),
    };
  });
}

/** Group entries by month key `YYYY-MM` for calendar sections. Undated entries go under `pending`. */
export function groupScheduleByMonth(
  entries: PayoutScheduleEntry[]
): { key: string; label: string; entries: PayoutScheduleEntry[] }[] {
  const buckets = new Map<string, PayoutScheduleEntry[]>();

  for (const entry of entries) {
    const key =
      entry.dueDate != null
        ? `${new Date(entry.dueDate).getFullYear()}-${String(new Date(entry.dueDate).getMonth() + 1).padStart(2, '0')}`
        : 'pending';
    const list = buckets.get(key) ?? [];
    list.push(entry);
    buckets.set(key, list);
  }

  const sortedKeys = [...buckets.keys()].sort((a, b) => {
    if (a === 'pending') return 1;
    if (b === 'pending') return -1;
    return a.localeCompare(b);
  });

  return sortedKeys.map((key) => ({
    key,
    label:
      key === 'pending'
        ? 'Dates not set yet'
        : new Date(`${key}-01`).toLocaleDateString('en-NG', { month: 'long', year: 'numeric' }),
    entries: (buckets.get(key) ?? []).sort((a, b) => {
      if (!a.dueDate || !b.dueDate) return a.round - b.round;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }),
  }));
}

export function scheduleDayParts(isoDate: string): { day: string; weekday: string } {
  const d = new Date(isoDate);
  return {
    day: String(d.getDate()),
    weekday: d.toLocaleDateString('en-NG', { weekday: 'short' }),
  };
}
