import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { sendPushToUser } from '../_shared/push.ts';

async function verifyPaystackSignature(body: string, signature: string | null): Promise<boolean> {
  const secret = Deno.env.get('PAYSTACK_SECRET_KEY') ?? '';
  if (!signature || !secret) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const hash = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return hash === signature;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const body = await req.text();
  const signature = req.headers.get('x-paystack-signature');

  if (!(await verifyPaystackSignature(body, signature))) {
    return new Response('Invalid signature', { status: 401 });
  }

  const event = JSON.parse(body);
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  if (event.event === 'charge.success') {
    const reference = event.data.reference as string;
    const metadata = event.data.metadata ?? {};
    const contributionId = metadata.contribution_id as string | undefined;

    let query = supabase.from('contributions').update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      paystack_reference: reference,
    });

    if (contributionId) {
      query = query.eq('id', contributionId);
    } else {
      query = query.eq('paystack_reference', reference);
    }

    const { data: contribution } = await query.select('*, cycles(id, group_id, recipient_id)').single();

    if (contribution) {
      const { data: allContribs } = await supabase
        .from('contributions')
        .select('status')
        .eq('cycle_id', contribution.cycle_id);

      const allPaid = allContribs?.every((c) => c.status === 'paid');
      if (allPaid) {
        await supabase
          .from('cycles')
          .update({ status: 'completed' })
          .eq('id', contribution.cycle_id);
      }

      const rawCycle = contribution.cycles as
        | { id: string; group_id: string }
        | { id: string; group_id: string }[]
        | null;
      const cycle = Array.isArray(rawCycle) ? rawCycle[0] ?? null : rawCycle;
      await sendPushToUser(
        supabase,
        contribution.user_id,
        'Payment confirmed',
        'Your contribution was received.',
        {
          type: 'payment_confirmed',
          groupId: cycle?.group_id,
          relatedEntityId: contribution.id,
        }
      );
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
