const TERMII_BASE_URL = (Deno.env.get('TERMII_BASE_URL') ?? 'https://api.ng.termii.com').replace(/\/$/, '');

export interface TermiiSendResult {
  pin_id: string;
  destination: string;
  status: string;
}

function getTermiiConfig() {
  const apiKey = Deno.env.get('TERMII_API_KEY') ?? '';
  const senderId = Deno.env.get('TERMII_SENDER_ID') ?? 'N-Alert';

  if (!apiKey) {
    throw new Error('Termii is not configured. Set TERMII_API_KEY in Supabase Edge Function secrets.');
  }

  return { apiKey, senderId };
}

export async function termiiSendOtp(destination: string): Promise<TermiiSendResult> {
  const { apiKey, senderId } = getTermiiConfig();

  const res = await fetch(`${TERMII_BASE_URL}/api/sms/otp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      pin_type: 'NUMERIC',
      to: destination,
      from: senderId,
      channel: 'generic',
      pin_attempts: 3,
      pin_time_to_live: 10,
      pin_length: 6,
      pin_placeholder: '< 1234 >',
      message_text: 'Your RoundPay verification code is < 1234 >. It expires in 10 minutes.',
    }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      (json as { message?: string }).message ??
      (json as { error?: string }).error ??
      `Termii send OTP failed (${res.status})`;
    throw new Error(message);
  }

  const pinId = (json as { pin_id?: string; pinId?: string }).pin_id ?? (json as { pinId?: string }).pinId;
  if (!pinId) {
    throw new Error('Termii did not return a pin_id');
  }

  return {
    pin_id: pinId,
    destination,
    status: (json as { smsStatus?: string }).smsStatus ?? 'sent',
  };
}

export async function termiiVerifyOtp(params: { pin_id: string; code: string }): Promise<boolean> {
  const { apiKey } = getTermiiConfig();

  const res = await fetch(`${TERMII_BASE_URL}/api/sms/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      pin_id: params.pin_id,
      pin: params.code.trim(),
    }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      (json as { message?: string }).message ??
      (json as { error?: string }).error ??
      `Termii verify OTP failed (${res.status})`;
    throw new Error(message);
  }

  const verified = (json as { verified?: string | boolean }).verified;
  return verified === true || verified === 'True' || verified === 'true';
}
