import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

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

    const { account_number, bank_code, bank_name, account_name } = await req.json();
    const paystackKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackKey) throw new Error('Paystack not configured');

    const recipientRes = await fetch('https://api.paystack.co/transferrecipient', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'nuban',
        name: account_name,
        account_number,
        bank_code,
        currency: 'NGN',
      }),
    });

    const recipientJson = await recipientRes.json();
    if (!recipientJson.status) throw new Error(recipientJson.message ?? 'Failed to create recipient');

    const { error } = await supabase
      .from('profiles')
      .update({
        bank_code,
        bank_name,
        account_number,
        account_name,
        paystack_recipient_code: recipientJson.data.recipient_code,
      })
      .eq('id', user.id);

    if (error) throw error;

    return new Response(JSON.stringify({ data: { recipient_code: recipientJson.data.recipient_code } }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
