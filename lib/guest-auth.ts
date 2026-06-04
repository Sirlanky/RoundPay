import type { User } from '@supabase/supabase-js';
import { ensureProfile } from './profile';
import { supabase } from './supabase';

export const GUEST_SIGN_IN_SETUP =
  'Supabase Dashboard → Authentication → Providers → turn on **Anonymous sign-ins**.';

export function guestSignInErrorMessage(error: { message: string }): string {
  const msg = error.message;
  if (/anonymous|disabled|not enabled/i.test(msg)) {
    return `Guest sign-in is disabled in Supabase. ${GUEST_SIGN_IN_SETUP}`;
  }
  return msg;
}

/** Real Supabase session without email — for dev/testing when OTP email is unavailable. */
export async function signInAsGuestUser(): Promise<User> {
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw new Error(guestSignInErrorMessage(error));
  const user = data.user;
  if (!user) throw new Error('Guest sign-in failed. Try again.');
  await ensureProfile(user);
  return user;
}

export function isGuestUser(user: User | null | undefined): boolean {
  return user?.is_anonymous === true;
}
