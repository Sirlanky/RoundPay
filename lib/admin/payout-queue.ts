import { getAdminGroups } from '@/lib/admin/role';
import { payoutFromContributions } from '@/lib/cycle-utils';
import { memberDisplayName } from '@/lib/members';
import { supabase } from '@/lib/supabase';

export interface PayoutQueueItem {
  cycleId: string;
  groupId: string;
  groupName: string;
  cycleNumber: number;
  memberCount: number;
  isLastCycle: boolean;
  recipientName: string;
  recipientAvatarUrl: string | null;
  amount: number;
  dueDate: string | null;
  cycleStatus: string;
  allPaid: boolean;
  paidCount: number;
}

export async function fetchPayoutQueue(
  userId: string,
  filters?: { groupId?: string }
): Promise<PayoutQueueItem[]> {
  const groups = await getAdminGroups(userId);
  const active = groups.filter(
    (g) => g.status === 'active' && (!filters?.groupId || g.id === filters.groupId)
  );
  if (!active.length) return [];

  const groupById = new Map(active.map((g) => [g.id, g]));
  const groupIds = active.map((g) => g.id);

  const { data: cycles } = await supabase
    .from('cycles')
    .select('id, group_id, cycle_number, due_date, status, recipient_id, recipient:profiles(*)')
    .in('group_id', groupIds)
    .in('status', ['open', 'collecting', 'completed'])
    .order('due_date', { ascending: true });

  const items: PayoutQueueItem[] = [];

  for (const cycle of cycles ?? []) {
    const group = groupById.get(cycle.group_id);
    if (!group) continue;

    const { data: contribs } = await supabase
      .from('contributions')
      .select('amount, status')
      .eq('cycle_id', cycle.id);

    const paidCount = (contribs ?? []).filter((c) => c.status === 'paid').length;
    const allPaid = (contribs ?? []).length > 0 && paidCount === contribs!.length;
    const memberCount = contribs?.length ?? group.max_members;
    const isLastCycle = memberCount > 0 && cycle.cycle_number >= memberCount;

    const payout = payoutFromContributions({
      contributions: (contribs ?? []) as Array<{ amount: number; status: string }>,
      adminFeePercent: group.admin_fee_percent ?? 0,
      recipientId: cycle.recipient_id,
      adminId: group.admin_id,
      estimateIfIncomplete: true,
    });

    const recipient = cycle.recipient as
      | { full_name?: string | null; avatar_url?: string | null }
      | null;
    let recipientName = recipient?.full_name?.trim() ?? 'Next collector';
    let recipientAvatarUrl = recipient?.avatar_url?.trim() || null;

    if (cycle.recipient_id) {
      const { data: memberRow } = await supabase
        .from('group_members')
        .select('*, profile:profiles(*)')
        .eq('group_id', cycle.group_id)
        .eq('user_id', cycle.recipient_id)
        .maybeSingle();
      if (memberRow) {
        recipientName = memberDisplayName(memberRow as never);
        recipientAvatarUrl =
          (memberRow as { profile?: { avatar_url?: string | null } | null }).profile?.avatar_url?.trim() ||
          recipientAvatarUrl;
      }
    }

    items.push({
      cycleId: cycle.id,
      groupId: cycle.group_id,
      groupName: group.name,
      cycleNumber: cycle.cycle_number,
      memberCount,
      isLastCycle,
      recipientName,
      recipientAvatarUrl,
      amount: payout.net,
      dueDate: cycle.due_date,
      cycleStatus: cycle.status,
      allPaid,
      paidCount,
    });
  }

  return items;
}
