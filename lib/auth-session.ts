import { supabase } from './supabase';

/** User JWT for Edge Functions (resolve-account, save-bank-account, etc.). */
export async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) return session.access_token;

  const { data: { session: refreshed }, error } = await supabase.auth.refreshSession();
  if (error) return null;
  return refreshed?.access_token ?? null;
}

export function bankAuthMessage(options: { buildMode: boolean; hasUser: boolean }): string {
  if (options.buildMode && !options.hasUser) {
    return 'You are in build mode without signing in. Open Sign in from the login screen, then try again.';
  }
  if (!options.hasUser) {
    return 'Sign in to link a bank account for payouts.';
  }
  return 'Your session expired. Sign out from Profile, sign in again, then retry.';
}

export function mapPaystackFunctionError(message: string): string {
  if (message === 'Not authenticated' || message === 'Unauthorized') {
    return 'Session expired or you are not signed in. Sign in again, then retry.';
  }
  if (message === 'Paystack not configured') {
    return 'Paystack is not set up on the server. Add PAYSTACK_SECRET_KEY to Supabase Edge Function secrets.';
  }
  return message;
}
