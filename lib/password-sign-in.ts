import { markAccountPasswordSet } from './account-password-preference';
import { ensureProfile } from './profile';
import { getAuthRedirectUrl } from './redirect';
import { isValidSignInEmail, normalizeSignInEmail } from './email-sign-in';
import { supabase } from './supabase';

export const MIN_AUTH_PASSWORD_LENGTH = 8;

export function isValidAuthPassword(password: string): boolean {
  return password.length >= MIN_AUTH_PASSWORD_LENGTH;
}

async function clearAnonymousSessionIfNeeded() {
  const {
    data: { user: current },
  } = await supabase.auth.getUser();

  if (current?.is_anonymous) {
    await supabase.auth.signOut();
  }
}

export async function signInWithEmailPassword(email: string, password: string) {
  const normalized = normalizeSignInEmail(email);
  if (!isValidSignInEmail(normalized)) {
    return { data: { user: null, session: null }, error: { message: 'Enter a valid email address.' } };
  }
  if (!password) {
    return { data: { user: null, session: null }, error: { message: 'Enter your password.' } };
  }

  await clearAnonymousSessionIfNeeded();

  const result = await supabase.auth.signInWithPassword({
    email: normalized,
    password,
  });

  if (!result.error && result.data.user) {
    await ensureProfile(result.data.user);
    await markAccountPasswordSet(result.data.user.id);
  }

  return result;
}

export async function signUpWithEmailPassword(email: string, password: string) {
  const normalized = normalizeSignInEmail(email);
  if (!isValidSignInEmail(normalized)) {
    return { data: { user: null, session: null }, error: { message: 'Enter a valid email address.' } };
  }
  if (!password) {
    return { data: { user: null, session: null }, error: { message: 'Enter your password.' } };
  }
  if (!isValidAuthPassword(password)) {
    return {
      data: { user: null, session: null },
      error: { message: `Password must be at least ${MIN_AUTH_PASSWORD_LENGTH} characters.` },
    };
  }

  await clearAnonymousSessionIfNeeded();

  const result = await supabase.auth.signUp({
    email: normalized,
    password,
  });

  if (!result.error && result.data.user) {
    await ensureProfile(result.data.user);
    await markAccountPasswordSet(result.data.user.id);
  }

  return result;
}

export async function requestPasswordReset(email: string) {
  const normalized = normalizeSignInEmail(email);
  if (!isValidSignInEmail(normalized)) {
    return { data: null, error: { message: 'Enter a valid email address.' } };
  }

  return supabase.auth.resetPasswordForEmail(normalized, {
    redirectTo: getAuthRedirectUrl(),
  });
}

/** Verify the 6-digit recovery code from email, then set a new password. */
export async function completePasswordResetWithCode(email: string, token: string, password: string) {
  const normalized = normalizeSignInEmail(email);
  if (!isValidSignInEmail(normalized)) {
    return { data: { user: null }, error: { message: 'Enter a valid email address.' } };
  }
  const code = token.trim();
  if (!/^\d{6}$/.test(code)) {
    return { data: { user: null }, error: { message: 'Enter the 6-digit code from your email.' } };
  }
  if (!isValidAuthPassword(password)) {
    return {
      data: { user: null },
      error: { message: `Password must be at least ${MIN_AUTH_PASSWORD_LENGTH} characters.` },
    };
  }

  const { error: verifyError } = await supabase.auth.verifyOtp({
    email: normalized,
    token: code,
    type: 'recovery',
  });
  if (verifyError) {
    return { data: { user: null }, error: verifyError };
  }

  return updateAccountPassword(password);
}

/** Set a new password after opening the reset link from email. */
export async function updateAccountPassword(password: string) {
  if (!isValidAuthPassword(password)) {
    return {
      data: { user: null },
      error: { message: `Password must be at least ${MIN_AUTH_PASSWORD_LENGTH} characters.` },
    };
  }

  const result = await supabase.auth.updateUser({ password });

  if (!result.error && result.data.user) {
    await ensureProfile(result.data.user);
    await markAccountPasswordSet(result.data.user.id);
  }

  return result;
}
