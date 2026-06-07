import { getAccessToken, mapPaystackFunctionError } from './auth-session';
import { getFunctionsUrl, supabase } from './supabase';
import { isPaystackConfigured } from './paystack';

function isMissingRpc(error: { code?: string; message?: string }): boolean {
  return (
    error.code === 'PGRST202' ||
    (error.message?.includes('record_cycle_payout') ?? false) ||
    (error.message?.includes('Could not find the function') ?? false)
  );
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

  const raw = await res.text();
  let json: { error?: string; data?: unknown } = {};
  try {
    json = raw ? (JSON.parse(raw) as { error?: string; data?: unknown }) : {};
  } catch {
    if (res.status === 404) {
      throw new Error('Edge function not deployed');
    }
    throw new Error(`Request failed (${res.status})`);
  }

  if (!res.ok) {
    throw new Error(mapPaystackFunctionError(json.error ?? `Request failed (${res.status})`));
  }

  return json.data;
}

async function recordCyclePayoutDirect(cycleId: string) {
  const { data: cycle, error: cycleErr } = await supabase
    .from('cycles')
    .select('id, status, recipient_id, group_id, groups(admin_id, admin_fee_percent)')
    .eq('id', cycleId)
    .single();

  if (cycleErr || !cycle) throw cycleErr ?? new Error('Cycle not found');

  const group = (Array.isArray(cycle.groups) ? cycle.groups[0] : cycle.groups) as {
    admin_id: string;
    admin_fee_percent: number;
  } | null;
  if (!group) throw new Error('Group not found');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || group.admin_id !== user.id) {
    throw new Error('Only admin can record payout');
  }

  if (cycle.status !== 'completed') {
    throw new Error('All members must pay before payout');
  }

  const { data: contributions, error: contribErr } = await supabase
    .from('contributions')
    .select('amount, status')
    .eq('cycle_id', cycleId);

  if (contribErr) throw contribErr;
  if (!contributions?.length || contributions.some((c) => c.status !== 'paid')) {
    throw new Error('Not all contributions are paid');
  }

  const total = contributions.reduce((sum, c) => sum + c.amount, 0);
  const payoutAmount = Math.floor(total * (1 - (group.admin_fee_percent ?? 0) / 100));

  const { error: payoutErr } = await supabase.from('payouts').upsert(
    {
      cycle_id: cycleId,
      recipient_id: cycle.recipient_id,
      amount: payoutAmount,
      status: 'completed',
      paystack_transfer_code: 'manual',
    },
    { onConflict: 'cycle_id' }
  );
  if (payoutErr) throw payoutErr;

  const { error: cycleUpdateErr } = await supabase
    .from('cycles')
    .update({ status: 'paid_out' })
    .eq('id', cycleId);
  if (cycleUpdateErr) throw cycleUpdateErr;

  const { error: memberErr } = await supabase
    .from('group_members')
    .update({ has_collected: true })
    .eq('group_id', cycle.group_id)
    .eq('user_id', cycle.recipient_id);
  if (memberErr) throw memberErr;
}

/** Mark payout sent without Paystack (manual transfer / testing). */
export async function recordCyclePayout(cycleId: string) {
  const { error } = await supabase.rpc('record_cycle_payout', { p_cycle_id: cycleId });
  if (!error) return;

  if (isMissingRpc(error) || error.code === '42501') {
    await recordCyclePayoutDirect(cycleId);
    return;
  }

  throw error;
}

/** Paystack transfer when configured; otherwise record manual payout. */
export async function sendCyclePayout(cycleId: string): Promise<{ transfer_code: string }> {
  if (!isPaystackConfigured()) {
    await recordCyclePayout(cycleId);
    return { transfer_code: 'manual' };
  }

  try {
    const data = (await authedFunctionPost('trigger-payout', { cycle_id: cycleId })) as {
      transfer_code: string;
    };
    return data;
  } catch (e) {
    const msg = (e as Error).message;
    if (
      msg.includes('Edge function not deployed') ||
      msg.includes('Paystack not configured') ||
      msg.includes('Request failed (404)')
    ) {
      await recordCyclePayout(cycleId);
      return { transfer_code: 'manual' };
    }
    throw e;
  }
}
