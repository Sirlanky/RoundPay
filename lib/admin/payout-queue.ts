import { getAdminGroups } from '@/lib/admin/role';
import { memberDisplayName } from '@/lib/members';
import { supabase } from '@/lib/supabase';

export interface PayoutQueueItem {
  cycleId: string;
  groupId: string;
  groupName: string;
  cycleNumber: number;
  recipientName: string;
  amount: number;
  dueDate: string | null;
  cycleStatus: string;
  allPaid: boolean;
}

export async function fetchPayoutQueue(userId: string): Promise<PayoutQueueItem[]> {
  const groups = await getAdminGroups(userId);
  const active = groups.filter((g) => g.status === 'active');
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
      .select('status')
      .eq('cycle_id', cycle.id);

    const allPaid = (contribs ?? []).every((c) => c.status === 'paid');
    const memberCount = contribs?.length ?? group.max_members;

    const recipient = cycle.recipient as { full_name?: string | null } | null;
    let recipientName = recipient?.full_name?.trim() ?? 'Next collector';

    if (cycle.recipient_id) {
      const { data: memberRow } = await supabase
        .from('group_members')
        .select('*, profile:profiles(*)')
        .eq('group_id', cycle.group_id)
        .eq('user_id', cycle.recipient_id)
        .maybeSingle();
      if (memberRow) recipientName = memberDisplayName(memberRow as never);
    }

    items.push({
      cycleId: cycle.id,
      groupId: cycle.group_id,
      groupName: group.name,
      cycleNumber: cycle.cycle_number,
      recipientName,
      amount: group.contribution_amount * Math.max(memberCount, 1),
      dueDate: cycle.due_date,
      cycleStatus: cycle.status,
      allPaid,
    });
  }

  return items;
}
