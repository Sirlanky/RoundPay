export interface EmailOtpPayload {
  hash: string;
  exp: number;
  to: string;
}

const OTP_TTL_MS = 10 * 60 * 1000;

/** Resend sandbox only delivers to the account owner until a domain is verified. */
export function isResendRecipientRestrictedError(message: string): boolean {
  return /only send testing emails|verify a domain|must be a verified email|recipient.*not allowed/i.test(
    message
  );
}

function getResendConfig() {
  const apiKey = Deno.env.get('RESEND_API_KEY') ?? '';
  const from = Deno.env.get('RESEND_FROM_EMAIL') ?? '';

  if (!apiKey) {
    throw new Error('Resend is not configured. Set RESEND_API_KEY in Supabase Edge Function secrets.');
  }
  if (!from) {
    throw new Error('Resend is not configured. Set RESEND_FROM_EMAIL in Supabase Edge Function secrets.');
  }

  return { apiKey, from };
}

function getOtpSecret(): string {
  return (
    Deno.env.get('OTP_EMAIL_SECRET') ??
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ??
    'roundpay-email-otp'
  );
}

async function hashOtp(code: string): Promise<string> {
  const data = new TextEncoder().encode(`${code.trim()}:${getOtpSecret()}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateCode(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  return String(n).padStart(6, '0');
}

export function encodeEmailOtpPayload(payload: EmailOtpPayload): string {
  return JSON.stringify(payload);
}

export function decodeEmailOtpPayload(raw: string | null | undefined): EmailOtpPayload | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as EmailOtpPayload;
    if (!parsed?.hash || !parsed?.exp || !parsed?.to) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function resendEmailOtp(to: string): Promise<{ reference_id: string; destination: string }> {
  const { apiKey, from } = getResendConfig();
  const code = generateCode();
  const hash = await hashOtp(code);
  const payload: EmailOtpPayload = {
    hash,
    exp: Date.now() + OTP_TTL_MS,
    to,
  };

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: 'Your RoundPay verification code',
      html: `<p>Your RoundPay verification code is <strong>${code}</strong>.</p><p>It expires in 10 minutes. If you did not request this, you can ignore this email.</p>`,
    }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      (json as { message?: string }).message ??
      (json as { error?: string }).error ??
      `Resend email failed (${res.status})`;
    if (isResendRecipientRestrictedError(message)) {
      throw new Error(`RESEND_RECIPIENT_RESTRICTED: ${message}`);
    }
    throw new Error(message);
  }

  return {
    reference_id: encodeEmailOtpPayload(payload),
    destination: to,
  };
}

export async function verifyEmailOtp(params: {
  stored: string | null | undefined;
  code: string;
  expectedEmail: string;
}): Promise<boolean> {
  const payload = decodeEmailOtpPayload(params.stored);
  if (!payload) return false;
  if (payload.to !== params.expectedEmail.trim().toLowerCase()) return false;
  if (Date.now() > payload.exp) return false;

  const hash = await hashOtp(params.code);
  return hash === payload.hash;
}
