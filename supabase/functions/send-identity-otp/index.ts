import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { maskEmail, maskPhone, normalizeEmail, normalizeNgPhone } from '../_shared/identity-contact.ts';
import { resendEmailOtp } from '../_shared/resend-email-otp.ts';
import { termiiSendOtp } from '../_shared/termii.ts';

type Channel = 'phone' | 'email';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Unauthorized');

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const adminClient = createClient(supabaseUrl, serviceKey);

    const { channel } = (await req.json()) as { channel?: Channel };
    if (channel !== 'phone' && channel !== 'email') {
      throw new Error('channel must be phone or email');
    }

    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('phone, email')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) throw new Error('Profile not found');

    let referenceColumn: 'phone_otp_reference_id' | 'email_otp_reference_id';
    let destination: string;
    let reference_id: string;
    let status: string;

    if (channel === 'phone') {
      if (!profile.phone?.trim()) throw new Error('Add your phone number in Profile first.');
      destination = normalizeNgPhone(profile.phone);
      const result = await termiiSendOtp(destination);
      reference_id = result.pin_id;
      status = result.status;
      referenceColumn = 'phone_otp_reference_id';
    } else {
      const email = normalizeEmail(profile.email ?? user.email ?? '');
      if (!profile.email?.trim()) {
        const { error: emailSyncError } = await adminClient
          .from('profiles')
          .update({ email, updated_at: new Date().toISOString() })
          .eq('id', user.id);
        if (emailSyncError) throw emailSyncError;
      }
      const result = await resendEmailOtp(email);
      destination = result.destination;
      reference_id = result.reference_id;
      status = 'sent';
      referenceColumn = 'email_otp_reference_id';
    }

    const { error: updateError } = await adminClient
      .from('profiles')
      .update({
        [referenceColumn]: reference_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    const maskedDestination = channel === 'phone' ? maskPhone(destination) : maskEmail(destination);

    return new Response(
      JSON.stringify({
        data: {
          reference_id,
          destination: maskedDestination,
          status,
          channel,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to send OTP';
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
