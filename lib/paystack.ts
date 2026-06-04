import { getAccessToken, mapPaystackFunctionError } from './auth-session';
import { getFunctionsUrl } from './supabase';

const publicKey = process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY ?? '';

export function isPaystackConfigured(): boolean {
  return publicKey.length > 0 && !publicKey.includes('xxxxxxxx');
}

export function getPaystackPublicKey(): string {
  return publicKey;
}

async function authedFunctionPost(functionName: string, body: Record<string, unknown>) {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(getFunctionsUrl(functionName), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(mapPaystackFunctionError(json.error ?? 'Request failed'));
  return json.data;
}

export async function resolveBankAccount(
  accountNumber: string,
  bankCode: string
): Promise<{ account_name: string; account_number: string }> {
  return authedFunctionPost('resolve-account', {
    account_number: accountNumber,
    bank_code: bankCode,
  });
}

export async function saveBankAccount(params: {
  account_number: string;
  bank_code: string;
  bank_name: string;
  account_name: string;
}): Promise<{ recipient_code: string }> {
  return authedFunctionPost('save-bank-account', params);
}

export async function createContributionPayment(
  contributionId: string
): Promise<{ authorization_url: string; reference: string }> {
  return authedFunctionPost('create-contribution-payment', {
    contribution_id: contributionId,
  });
}

export async function triggerPayout(cycleId: string): Promise<{ transfer_code: string }> {
  return authedFunctionPost('trigger-payout', { cycle_id: cycleId });
}
