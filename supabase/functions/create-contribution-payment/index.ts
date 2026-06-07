import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { isProfileReadyForTransfers } from '../_shared/profile-setup.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Unauthorized');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { contribution_id } = await req.json();
    const paystackKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackKey) throw new Error('Paystack not configured');

    const { data: contribution } = await supabase
      .from('contributions')
      .select('*, cycles(group_id, groups(name))')
      .eq('id', contribution_id)
      .eq('user_id', user.id)
      .single();

    if (!contribution) throw new Error('Contribution not found');
    if (contribution.status === 'paid') throw new Error('Already paid');

    const { data: profile } = await supabase
      .from('profiles')
      .select(
        'email, first_name, last_name, full_name, phone, account_number, paystack_recipient_code'
      )
      .eq('id', user.id)
      .single();

    if (!isProfileReadyForTransfers(profile)) {
      throw new Error(
        'Complete your profile (name, phone, and bank account) before making a payment.'
      );
    }

    const reference = `ajo_${contribution_id.slice(0, 8)}_${Date.now()}`;
    const groupName = (contribution as { cycles?: { groups?: { name?: string } } }).cycles?.groups?.name ?? 'Ajo Group';

    const initRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: profile?.email ?? `${user.id}@ajo.app`,
        amount: contribution.amount * 100,
        reference,
        callback_url: 'ajoesusu://payment-callback',
        metadata: {
          contribution_id,
          user_id: user.id,
          custom_fields: [{ display_name: 'Group', variable_name: 'group', value: groupName }],
        },
      }),
    });

    const initJson = await initRes.json();
    if (!initJson.status) throw new Error(initJson.message ?? 'Payment init failed');

    await supabase
      .from('contributions')
      .update({ paystack_reference: reference })
      .eq('id', contribution_id);

    return new Response(
      JSON.stringify({
        data: {
          authorization_url: initJson.data.authorization_url,
          reference: initJson.data.reference,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
