import { estimatedNetPayout } from './cycle-utils';
import { cycleGrossPool } from './admin-fee';
import { getUserGroups } from './groups';
import { memberDisplayName, type MemberWithProfile } from './members';
import { supabase } from './supabase';
import type { AjoGroup, Contribution, Cycle, Profile } from './types';

export type HomeActivityType = 'payment' | 'payout';

export interface HomeActivity {
  id: string;
  type: HomeActivityType;
  timestamp: string;
  label: string;
}

export interface HomeDashboardData {
  hasGroups: boolean;
  inProgressGroups: AjoGroup[];
  inProgressCount: number;
  primaryGroup: AjoGroup | null;
  members: MemberWithProfile[];
  memberCount: number;
  currentCycle: (Cycle & { recipient?: Profile | null }) | null;
  contributions: Contribution[];
  paidCount: number;
  userPendingContributionId: string | null;
  userContributionStatus: 'pending' | 'paid' | null;
  adminPendingCount: number;
  isOverdue: boolean;
  totalPot: number | null;
  recentActivity: HomeActivity[];
  isAdmin: boolean;
  cyclePot: CyclePotProgress | null;
  payoutReady: boolean;
}

export interface CyclePotProgress {
  collectedGross: number;
  expectedGross: number;
  paidCount: number;
  totalCount: number;
}

function pickPrimaryGroup(groups: AjoGroup[], preferredId?: string): AjoGroup | null {
  const inProgress = groups.filter((g) => g.status === 'active' || g.status === 'draft');

  if (preferredId) {
    const preferred = inProgress.find((g) => g.id === preferredId);
    if (preferred) return preferred;
  }

  const active = inProgress.filter((g) => g.status === 'active');
  if (active.length) return active[0];
  const draft = inProgress.filter((g) => g.status === 'draft');
  if (draft.length) return draft[0];
  return null;
}

function profileLabel(profile: Profile | null | undefined, fallback: string): string {
  const name = profile?.full_name?.trim();
  if (name) return name;
  const email = profile?.email?.split('@')[0];
  if (email) return email;
  return fallback;
}

function buildRecentActivity(
  paidContributions: Array<{
    id: string;
    paid_at: string | null;
    user_id: string;
  }>,
  completedPayouts: Array<{
    id: string;
    created_at: string;
    recipient?: Profile | null;
  }>,
  members: MemberWithProfile[]
): HomeActivity[] {
  const memberByUserId = new Map(members.map((m) => [m.user_id, m]));
  const events: HomeActivity[] = [];

  for (const c of paidContributions) {
    if (!c.paid_at) continue;
    const member = memberByUserId.get(c.user_id);
    const who = member ? memberDisplayName(member) : 'A member';
    events.push({
      id: `pay-${c.id}`,
      type: 'payment',
      timestamp: c.paid_at,
      label: `${who} contributed`,
    });
  }

  for (const p of completedPayouts) {
    const who = profileLabel(p.recipient, 'Collector');
    events.push({
      id: `payout-${p.id}`,
      type: 'payout',
      timestamp: p.created_at,
      label: `${who} received payout`,
    });
  }

  return events
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8);
}

export async function fetchHomeDashboard(
  userId: string,
  preferredGroupId?: string
): Promise<HomeDashboardData> {
  const groups = (await getUserGroups(userId)) as AjoGroup[];
  const hasGroups = groups.length > 0;
  const inProgressGroups = groups.filter((g) => g.status === 'active' || g.status === 'draft');
  const inProgressCount = inProgressGroups.length;
  const primaryGroup = pickPrimaryGroup(groups, preferredGroupId);

  const empty: HomeDashboardData = {
    hasGroups,
    inProgressGroups,
    inProgressCount,
    primaryGroup: null,
    members: [],
    memberCount: 0,
    currentCycle: null,
    contributions: [],
    paidCount: 0,
    userPendingContributionId: null,
    userContributionStatus: null,
    adminPendingCount: 0,
    isOverdue: false,
    totalPot: null,
    recentActivity: [],
    isAdmin: false,
    cyclePot: null,
    payoutReady: false,
  };

  if (!primaryGroup) return empty;

  const [membersRes, cycleRes] = await Promise.all([
    supabase
      .from('group_members')
      .select('*, profile:profiles(*)')
      .eq('group_id', primaryGroup.id)
      .order('rotation_order'),
    primaryGroup.status === 'active'
      ? supabase
          .from('cycles')
          .select('*, recipient:profiles(*)')
          .eq('group_id', primaryGroup.id)
          .order('cycle_number', { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const members = (membersRes.data ?? []) as MemberWithProfile[];
  const memberCount = members.length;
  const currentCycle = (cycleRes.data as (Cycle & { recipient?: Profile | null }) | null) ?? null;
  const isAdmin = primaryGroup.admin_id === userId;

  let contributions: Contribution[] = [];
  if (currentCycle?.id) {
    const { data } = await supabase
      .from('contributions')
      .select('*')
      .eq('cycle_id', currentCycle.id)
      .order('user_id')
      .order('installment_number');
    contributions = (data ?? []) as Contribution[];
  }

  const paidCount = contributions.filter((c) => c.status === 'paid').length;
  const totalCount = contributions.length;
  const payInsPerCycle = primaryGroup.pay_ins_per_cycle ?? 1;
  const expectedGross =
    totalCount > 0
      ? contributions.reduce((sum, c) => sum + c.amount, 0)
      : cycleGrossPool(primaryGroup.contribution_amount, memberCount, payInsPerCycle);
  const collectedGross = contributions
    .filter((c) => c.status === 'paid')
    .reduce((sum, c) => sum + c.amount, 0);

  const cyclePot: CyclePotProgress | null =
    primaryGroup.status === 'active' && totalCount > 0
      ? { collectedGross, expectedGross, paidCount, totalCount }
      : null;

  const payoutReady =
    primaryGroup.status === 'active' &&
    !!currentCycle &&
    currentCycle.status !== 'paid_out' &&
    totalCount > 0 &&
    paidCount >= totalCount;
  const userPending = contributions
    .filter((c) => c.user_id === userId && c.status === 'pending')
    .sort((a, b) => (a.installment_number ?? 1) - (b.installment_number ?? 1))[0];
  const userPaidAll =
    contributions.filter((c) => c.user_id === userId).length > 0 &&
    contributions.filter((c) => c.user_id === userId).every((c) => c.status === 'paid');
  const userHasPending = contributions.some((c) => c.user_id === userId && c.status === 'pending');
  const userContributionStatus: 'pending' | 'paid' | null = userPaidAll
    ? 'paid'
    : userHasPending
      ? 'pending'
      : null;
  const adminPendingCount = isAdmin
    ? contributions.filter((c) => c.status === 'pending').length
    : 0;

  const duePassed =
    currentCycle?.due_date != null && new Date(currentCycle.due_date) < new Date();
  const hasPending = contributions.some((c) => c.status === 'pending');
  const isOverdue = Boolean(duePassed && hasPending);

  const totalPot =
    memberCount > 0 && currentCycle?.recipient_id
      ? estimatedNetPayout({
          contributionAmount: primaryGroup.contribution_amount,
          contributorCount: memberCount,
          adminFeePercent: primaryGroup.admin_fee_percent ?? 0,
          recipientId: currentCycle.recipient_id,
          adminId: primaryGroup.admin_id,
          payInsPerCycle,
        })
      : null;

  let recentActivity: HomeActivity[] = [];
  if (primaryGroup.status === 'active') {
    const { data: cycles } = await supabase.from('cycles').select('id').eq('group_id', primaryGroup.id);
    const cycleIds = (cycles ?? []).map((c) => c.id);

    if (cycleIds.length) {
      const [contribRes, payoutRes] = await Promise.all([
        supabase
          .from('contributions')
          .select('id, paid_at, user_id')
          .in('cycle_id', cycleIds)
          .eq('status', 'paid')
          .not('paid_at', 'is', null)
          .order('paid_at', { ascending: false })
          .limit(10),
        supabase
          .from('payouts')
          .select('id, created_at, recipient:profiles(*)')
          .in('cycle_id', cycleIds)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      recentActivity = buildRecentActivity(
        (contribRes.data ?? []) as Array<{
          id: string;
          paid_at: string | null;
          user_id: string;
        }>,
        (payoutRes.data ?? []) as unknown as Array<{
          id: string;
          created_at: string;
          recipient?: Profile | null;
        }>,
        members
      );
    }
  }

  return {
    hasGroups,
    inProgressGroups,
    inProgressCount,
    primaryGroup,
    members,
    memberCount,
    currentCycle,
    contributions,
    paidCount,
    userPendingContributionId: userPending?.id ?? null,
    userContributionStatus,
    adminPendingCount,
    isOverdue,
    totalPot,
    recentActivity,
    isAdmin,
    cyclePot,
    payoutReady,
  };
}

export function nextPayoutRecipientName(
  cycle: (Cycle & { recipient?: Profile | null }) | null,
  members: MemberWithProfile[]
): string | null {
  if (!cycle?.recipient_id) return null;
  const member = members.find((m) => m.user_id === cycle.recipient_id);
  if (member) return memberDisplayName(member);
  const profile = cycle.recipient;
  const name = profile?.full_name?.trim();
  if (name) return name;
  return null;
}

/** Show home payout card only after every member has paid for the current cycle. */
export function shouldShowNextPayoutOnHome(data: HomeDashboardData): boolean {
  return data.payoutReady;
}
