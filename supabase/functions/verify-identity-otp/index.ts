import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { normalizeEmail, normalizeNgPhone } from '../_shared/identity-contact.ts';
import { decodeLocalOtpPayload, verifyLocalOtp } from '../_shared/local-otp.ts';
import { verifyEmailOtp } from '../_shared/resend-email-otp.ts';
import { termiiVerifyOtp } from '../_shared/termii.ts';

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

    const { channel, code } = (await req.json()) as { channel?: Channel; code?: string };
    if (channel !== 'phone' && channel !== 'email') {
      throw new Error('channel must be phone or email');
    }
    if (!code?.trim()) throw new Error('Enter the OTP code');

    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('phone, email, phone_otp_reference_id, email_otp_reference_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) throw new Error('Profile not found');

    let valid = false;

    if (channel === 'phone') {
      const pin_id = profile.phone_otp_reference_id;
      if (!pin_id) throw new Error('No OTP pending. Tap Send code first.');
      const destination = normalizeNgPhone(profile.phone ?? '');
      const localPayload = decodeLocalOtpPayload(pin_id);
      if (localPayload) {
        valid = await verifyLocalOtp({
          stored: pin_id,
          code: code.trim(),
          expectedDestination: destination,
          channel: 'phone',
        });
      } else {
        valid = await termiiVerifyOtp({ pin_id, code: code.trim() });
      }
    } else {
      const email = normalizeEmail(profile.email ?? user.email ?? '');
      if (!profile.email_otp_reference_id) {
        throw new Error('No OTP pending. Tap Send code first.');
      }
      const localPayload = decodeLocalOtpPayload(profile.email_otp_reference_id);
      if (localPayload) {
        valid = await verifyLocalOtp({
          stored: profile.email_otp_reference_id,
          code: code.trim(),
          expectedDestination: email,
          channel: 'email',
        });
      } else {
        valid = await verifyEmailOtp({
          stored: profile.email_otp_reference_id,
          code: code.trim(),
          expectedEmail: email,
        });
      }
    }

    if (!valid) throw new Error('Invalid or expired code. Request a new OTP and try again.');

    const now = new Date().toISOString();
    const patch =
      channel === 'phone'
        ? {
            phone_verified_at: now,
            phone_otp_reference_id: null,
            updated_at: now,
          }
        : {
            email_verified_at: now,
            email_otp_reference_id: null,
            updated_at: now,
          };

    const { error: updateError } = await adminClient.from('profiles').update(patch).eq('id', user.id);
    if (updateError) throw updateError;

    return new Response(JSON.stringify({ data: { channel, verified: true } }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to verify OTP';
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
