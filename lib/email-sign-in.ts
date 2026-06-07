import { sendEmailOtp as sendOtpRaw, verifyEmailOtp as verifyOtpRaw } from './auth';
import { ensureProfile } from './profile';
import { getAuthRedirectUrl } from './redirect';
import {
  clearPendingSignInEmail,
  getPendingSignInEmail,
  setPendingSignInEmail,
} from './pending-sign-in-email';
import { supabase } from './supabase';

export function normalizeSignInEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidSignInEmail(raw: string): boolean {
  const email = normalizeSignInEmail(raw);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function resolveSignInEmail(explicit?: string | null): Promise<string | null> {
  const fromParam = explicit?.trim();
  if (fromParam) return normalizeSignInEmail(fromParam);
  return getPendingSignInEmail();
}

/** Send sign-in / link-email message. Links email onto anonymous sessions when logged in as guest. */
export async function requestEmailSignIn(email: string) {
  const normalized = normalizeSignInEmail(email);
  if (!isValidSignInEmail(normalized)) {
    return { data: null, error: { message: 'Enter a valid email address.' } };
  }

  await setPendingSignInEmail(normalized);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.is_anonymous) {
    const result = await supabase.auth.updateUser(
      { email: normalized },
      { emailRedirectTo: getAuthRedirectUrl() }
    );
    if (result.error) {
      return result;
    }
    return { data: result.data, error: null };
  }

  return sendOtpRaw(normalized);
}

export type VerifyEmailSignInResult = Awaited<ReturnType<typeof verifyOtpRaw>>;

/** Verify 6-digit code from sign-in or link-email email. */
export async function verifyEmailSignIn(email: string, token: string): Promise<VerifyEmailSignInResult> {
  const normalized = normalizeSignInEmail(email);
  const code = token.trim();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const primaryType = user?.is_anonymous ? ('email_change' as const) : ('email' as const);
  let result = await verifyOtpRaw({ email: normalized, token: code, type: primaryType });

  if (result.error && primaryType === 'email') {
    result = await verifyOtpRaw({ email: normalized, token: code, type: 'magiclink' });
  }

  if (!result.error) {
    await clearPendingSignInEmail();
    const {
      data: { user: signedIn },
    } = await supabase.auth.getUser();
    if (signedIn) {
      await ensureProfile(signedIn);
    }
  }

  return result;
}

export async function resendEmailSignIn(email: string) {
  return requestEmailSignIn(email);
}
