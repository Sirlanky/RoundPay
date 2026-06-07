import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { sendPushToUser } from '../_shared/push.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Unauthorized');

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { cycle_id } = await req.json();
    const paystackKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackKey) throw new Error('Paystack not configured');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: cycle } = await supabase
      .from('cycles')
      .select('*, groups(admin_id, admin_fee_percent, contribution_amount)')
      .eq('id', cycle_id)
      .single();

    if (!cycle) throw new Error('Cycle not found');
    if (cycle.groups.admin_id !== user.id) throw new Error('Only admin can trigger payout');
    if (cycle.status !== 'completed') throw new Error('Cycle must have all contributions paid');

    const { data: contributions } = await supabase
      .from('contributions')
      .select('amount, status')
      .eq('cycle_id', cycle_id);

    const allPaid = contributions?.every((c) => c.status === 'paid');
    if (!allPaid) throw new Error('Not all contributions are paid');

    const total = contributions!.reduce((sum, c) => sum + c.amount, 0);
    const feePercent = cycle.groups.admin_fee_percent ?? 0;
    const payoutAmount = Math.floor(total * (1 - feePercent / 100));

    const { data: recipient } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', cycle.recipient_id)
      .single();

    if (!recipient?.paystack_recipient_code) {
      throw new Error('Recipient has no bank account configured');
    }

    const transferRes = await fetch('https://api.paystack.co/transfer', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'balance',
        amount: payoutAmount * 100,
        recipient: recipient.paystack_recipient_code,
        reason: `Ajo cycle ${cycle.cycle_number} payout`,
      }),
    });

    const transferJson = await transferRes.json();
    if (!transferJson.status) throw new Error(transferJson.message ?? 'Transfer failed');

    await supabase.from('payouts').upsert({
      cycle_id,
      recipient_id: cycle.recipient_id,
      amount: payoutAmount,
      status: 'completed',
      paystack_transfer_code: transferJson.data.transfer_code,
    });

    await supabase.from('cycles').update({ status: 'paid_out' }).eq('id', cycle_id);

    await supabase
      .from('group_members')
      .update({ has_collected: true })
      .eq('group_id', cycle.group_id)
      .eq('user_id', cycle.recipient_id);

    await sendPushToUser(
      supabase,
      cycle.recipient_id,
      'Payout sent!',
      `You received ₦${payoutAmount.toLocaleString()} for this cycle.`,
      {
        type: 'payout_completed',
        groupId: cycle.group_id,
        relatedEntityId: cycle_id,
      }
    );

    return new Response(
      JSON.stringify({ data: { transfer_code: transferJson.data.transfer_code } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
