import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

async function sendPush(token: string, title: string, body: string) {
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: token, title, body, sound: 'default' }),
  });
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);

  const { data: cycles } = await supabase
    .from('cycles')
    .select('id, due_date, group_id, recipient_id, groups(name)')
    .eq('status', 'collecting')
    .gte('due_date', tomorrow.toISOString())
    .lt('due_date', dayAfter.toISOString());

  for (const cycle of cycles ?? []) {
    const { data: pendingContribs } = await supabase
      .from('contributions')
      .select('user_id')
      .eq('cycle_id', cycle.id)
      .eq('status', 'pending');

    for (const contrib of pendingContribs ?? []) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('expo_push_token')
        .eq('id', contrib.user_id)
        .single();

      if (profile?.expo_push_token) {
        const groupName = (cycle as { groups?: { name?: string } }).groups?.name ?? 'your group';
        await sendPush(
          profile.expo_push_token,
          'Contribution due tomorrow',
          `Your ${groupName} contribution is due soon.`
        );
      }
    }

    const { data: recipientProfile } = await supabase
      .from('profiles')
      .select('expo_push_token')
      .eq('id', cycle.recipient_id)
      .single();

    if (recipientProfile?.expo_push_token) {
      await sendPush(
        recipientProfile.expo_push_token,
        "You're collecting this cycle",
        `You will receive the pot when all members pay.`
      );
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
