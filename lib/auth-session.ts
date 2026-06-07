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
  if (message === 'Edge function not deployed' || message.includes('Request failed (404)')) {
    return 'Payout will be recorded manually — Paystack transfer is not set up yet.';
  }
  if (message.includes('Complete your profile')) {
    return 'Finish your profile setup (name, phone, and bank account) before making a payment.';
  }
  if (message.includes('Recipient has no bank account')) {
    return 'Collector has no bank account on file. They must add one in Profile, or use Record payout sent.';
  }
  if (message.includes('Cycle must have all contributions paid') || message.includes('All members must pay')) {
    return 'Everyone must pay before sending payout.';
  }
  if (message.includes('Not all contributions are paid')) {
    return 'Not all contributions are marked paid yet.';
  }
  if (message.includes('record_cycle_payout') || message.includes('Could not find the function')) {
    return 'Run supabase/migrations/RECORD_PAYOUT_FIX.sql in Supabase SQL Editor, then try again.';
  }
  return message;
}
