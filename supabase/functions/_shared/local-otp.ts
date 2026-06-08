export interface LocalOtpPayload {
  hash: string;
  exp: number;
  destination: string;
  channel: 'phone' | 'email';
}

const OTP_TTL_MS = 10 * 60 * 1000;

function getOtpSecret(): string {
  return (
    Deno.env.get('OTP_EMAIL_SECRET') ??
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ??
    'roundpay-local-otp'
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

export function encodeLocalOtpPayload(payload: LocalOtpPayload): string {
  return JSON.stringify(payload);
}

export function decodeLocalOtpPayload(raw: string | null | undefined): LocalOtpPayload | null {
  if (!raw?.trim()) return null;
  if (!raw.trim().startsWith('{')) return null;
  try {
    const parsed = JSON.parse(raw) as LocalOtpPayload;
    if (!parsed?.hash || !parsed?.exp || !parsed?.destination || !parsed?.channel) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function createLocalOtp(params: {
  channel: 'phone' | 'email';
  destination: string;
}): Promise<{ reference_id: string; dev_code: string }> {
  const code = generateCode();
  const hash = await hashOtp(code);
  const payload: LocalOtpPayload = {
    hash,
    exp: Date.now() + OTP_TTL_MS,
    destination: params.destination,
    channel: params.channel,
  };

  return {
    reference_id: encodeLocalOtpPayload(payload),
    dev_code: code,
  };
}

export async function verifyLocalOtp(params: {
  stored: string | null | undefined;
  code: string;
  expectedDestination: string;
  channel: 'phone' | 'email';
}): Promise<boolean> {
  const payload = decodeLocalOtpPayload(params.stored);
  if (!payload) return false;
  if (payload.channel !== params.channel) return false;
  if (payload.destination !== params.expectedDestination) return false;
  if (Date.now() > payload.exp) return false;

  const hash = await hashOtp(params.code);
  return hash === payload.hash;
}
