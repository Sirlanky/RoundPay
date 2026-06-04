import { getFunctionsUrl, supabase } from './supabase';

const publicKey = process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY ?? '';

export function isPaystackConfigured(): boolean {
  return publicKey.length > 0 && !publicKey.includes('xxxxxxxx');
}

export function getPaystackPublicKey(): string {
  return publicKey;
}

export async function resolveBankAccount(
  accountNumber: string,
  bankCode: string
): Promise<{ account_name: string; account_number: string }> {
  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token;
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(getFunctionsUrl('resolve-account'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ account_number: accountNumber, bank_code: bankCode }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Failed to resolve account');
  return json.data;
}

export async function createContributionPayment(
  contributionId: string
): Promise<{ authorization_url: string; reference: string }> {
  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token;
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(getFunctionsUrl('create-contribution-payment'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ contribution_id: contributionId }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Failed to create payment');
  return json.data;
}

export async function triggerPayout(cycleId: string): Promise<{ transfer_code: string }> {
  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token;
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(getFunctionsUrl('trigger-payout'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ cycle_id: cycleId }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Failed to trigger payout');
  return json.data;
}
