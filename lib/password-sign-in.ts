import { ensureProfile } from './profile';
import { getAuthRedirectUrl } from './redirect';
import { isValidSignInEmail, normalizeSignInEmail } from './email-sign-in';
import { supabase } from './supabase';

export async function signInWithEmailPassword(email: string, password: string) {
  const normalized = normalizeSignInEmail(email);
  if (!isValidSignInEmail(normalized)) {
    return { data: { user: null, session: null }, error: { message: 'Enter a valid email address.' } };
  }
  if (!password) {
    return { data: { user: null, session: null }, error: { message: 'Enter your password.' } };
  }

  const {
    data: { user: current },
  } = await supabase.auth.getUser();

  // Replace anonymous guest session with the existing account.
  if (current?.is_anonymous) {
    await supabase.auth.signOut();
  }

  const result = await supabase.auth.signInWithPassword({
    email: normalized,
    password,
  });

  if (!result.error && result.data.user) {
    await ensureProfile(result.data.user);
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
