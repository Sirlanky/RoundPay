import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendPushToUser } from '../_shared/push.ts';
import {
  getLagosHour,
  getReminderProfile,
  shouldSendReminder,
} from '../_shared/reminders.ts';

async function createNotification(
  supabase: ReturnType<typeof createClient>,
  params: {
    user_id: string;
    group_id: string;
    type: string;
    title: string;
    message: string;
    related_entity_id?: string;
  }
) {
  await supabase.rpc('create_notification', {
    p_user_id: params.user_id,
    p_group_id: params.group_id,
    p_type: params.type,
    p_title: params.title,
    p_message: params.message,
    p_related_entity_id: params.related_entity_id ?? null,
  });
}

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const lagosHour = getLagosHour();
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  const startOfDayAfter = new Date(startOfTomorrow);
  startOfDayAfter.setDate(startOfDayAfter.getDate() + 1);

  // Due tomorrow
  const { data: dueTomorrowCycles } = await supabase
    .from('cycles')
    .select('id, due_date, group_id, recipient_id, groups(name)')
    .eq('status', 'collecting')
    .gte('due_date', startOfTomorrow.toISOString())
    .lt('due_date', startOfDayAfter.toISOString());

  for (const cycle of dueTomorrowCycles ?? []) {
    const groupName = (cycle as { groups?: { name?: string } }).groups?.name ?? 'your group';
    const groupId = cycle.group_id as string;

    const { data: pendingContribs } = await supabase
      .from('contributions')
      .select('id, user_id, amount')
      .eq('cycle_id', cycle.id)
      .eq('status', 'pending');

    for (const contrib of pendingContribs ?? []) {
      const reminderProfile = await getReminderProfile(supabase, contrib.user_id);
      if (!shouldSendReminder(reminderProfile, 'contribution', lagosHour)) continue;

      const message = `Your ${formatNaira(contrib.amount)} contribution for "${groupName}" is due tomorrow.`;
      const title = 'Contribution due tomorrow';

      await createNotification(supabase, {
        user_id: contrib.user_id,
        group_id: groupId,
        type: 'contribution_due',
        title,
        message,
        related_entity_id: contrib.id,
      });

      await sendPushToUser(supabase, contrib.user_id, title, message, {
        type: 'contribution_due',
        groupId,
        relatedEntityId: contrib.id,
      });
    }

    const recipientProfile = await getReminderProfile(supabase, cycle.recipient_id as string);
    if (shouldSendReminder(recipientProfile, 'payout', lagosHour)) {
      const payoutMessage = `You are collecting this cycle in "${groupName}". Payout happens when all members pay.`;
      const payoutTitle = 'Payout coming soon';

      await createNotification(supabase, {
        user_id: cycle.recipient_id,
        group_id: groupId,
        type: 'payout_soon',
        title: payoutTitle,
        message: payoutMessage,
        related_entity_id: cycle.id,
      });

      await sendPushToUser(supabase, cycle.recipient_id as string, payoutTitle, payoutMessage, {
        type: 'payout_soon',
        groupId,
        relatedEntityId: cycle.id as string,
      });
    }
  }

  // Due today
  const { data: dueTodayCycles } = await supabase
    .from('cycles')
    .select('id, group_id, groups(name)')
    .eq('status', 'collecting')
    .gte('due_date', startOfToday.toISOString())
    .lt('due_date', startOfTomorrow.toISOString());

  for (const cycle of dueTodayCycles ?? []) {
    const groupName = (cycle as { groups?: { name?: string } }).groups?.name ?? 'your group';
    const groupId = cycle.group_id as string;

    const { data: pendingContribs } = await supabase
      .from('contributions')
      .select('id, user_id, amount')
      .eq('cycle_id', cycle.id)
      .eq('status', 'pending');

    for (const contrib of pendingContribs ?? []) {
      const reminderProfile = await getReminderProfile(supabase, contrib.user_id);
      if (!shouldSendReminder(reminderProfile, 'contribution', lagosHour)) continue;

      const message = `Your ${formatNaira(contrib.amount)} contribution for "${groupName}" is due today.`;
      const title = 'Contribution due today';

      await createNotification(supabase, {
        user_id: contrib.user_id,
        group_id: groupId,
        type: 'contribution_due',
        title,
        message,
        related_entity_id: contrib.id,
      });

      await sendPushToUser(supabase, contrib.user_id, title, message, {
        type: 'contribution_due',
        groupId,
        relatedEntityId: contrib.id,
      });
    }
  }

  // Overdue (due date before today, still pending)
  const { data: overdueCycles } = await supabase
    .from('cycles')
    .select('id, group_id, groups(name)')
    .eq('status', 'collecting')
    .lt('due_date', startOfToday.toISOString());

  for (const cycle of overdueCycles ?? []) {
    const groupName = (cycle as { groups?: { name?: string } }).groups?.name ?? 'your group';
    const groupId = cycle.group_id as string;

    const { data: pendingContribs } = await supabase
      .from('contributions')
      .select('id, user_id, amount')
      .eq('cycle_id', cycle.id)
      .eq('status', 'pending');

    for (const contrib of pendingContribs ?? []) {
      const reminderProfile = await getReminderProfile(supabase, contrib.user_id);
      if (!shouldSendReminder(reminderProfile, 'overdue', lagosHour)) continue;

      const message = `Your ${formatNaira(contrib.amount)} contribution for "${groupName}" is overdue.`;
      const title = 'Contribution overdue';

      await createNotification(supabase, {
        user_id: contrib.user_id,
        group_id: groupId,
        type: 'contribution_overdue',
        title,
        message,
        related_entity_id: contrib.id,
      });

      await sendPushToUser(supabase, contrib.user_id, title, message, {
        type: 'contribution_overdue',
        groupId,
        relatedEntityId: contrib.id,
      });
    }
  }

  return new Response(JSON.stringify({ ok: true, lagosHour }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
