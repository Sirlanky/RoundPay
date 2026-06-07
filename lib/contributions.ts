import { supabase } from './supabase';

function isMissingRpc(error: { code?: string; message?: string }): boolean {
  return (
    error.code === 'PGRST202' ||
    (error.message?.includes('record_contribution_payment') ?? false) ||
    (error.message?.includes('Could not find the function') ?? false)
  );
}

async function assertAdminForContribution(contributionId: string) {
  const { data: row, error } = await supabase
    .from('contributions')
    .select('id, cycles(groups(admin_id))')
    .eq('id', contributionId)
    .single();

  if (error || !row) throw error ?? new Error('Contribution not found');

  const cycle = row.cycles as { groups?: { admin_id?: string } } | null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || cycle?.groups?.admin_id !== user.id) {
    throw new Error('Only admin can record payments');
  }
}

async function completeCycleIfAllPaid(cycleId: string) {
  const { data: pending } = await supabase
    .from('contributions')
    .select('id')
    .eq('cycle_id', cycleId)
    .neq('status', 'paid');

  if (pending && pending.length === 0) {
    const { error } = await supabase.from('cycles').update({ status: 'completed' }).eq('id', cycleId);
    if (error) throw error;
  }
}

/** Direct update when RPC is missing (admin only — requires Admin can update contributions policy). */
async function recordContributionPaymentDirect(contributionId: string) {
  await assertAdminForContribution(contributionId);

  const { data: row, error: fetchErr } = await supabase
    .from('contributions')
    .select('id, status, cycle_id, cycles(id, status)')
    .eq('id', contributionId)
    .single();

  if (fetchErr) throw fetchErr;
  if (row.status === 'paid') return;

  const cycle = (Array.isArray(row.cycles) ? row.cycles[0] : row.cycles) as {
    id: string;
    status: string;
  } | null;
  if (!cycle || !['collecting', 'open'].includes(cycle.status)) {
    throw new Error('This cycle is not accepting payments');
  }

  const ref = `manual_${contributionId.replace(/-/g, '').slice(0, 12)}`;
  const { data: updated, error: updateErr } = await supabase
    .from('contributions')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      paystack_reference: ref,
    })
    .eq('id', contributionId)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle();

  if (updateErr) throw updateErr;
  if (!updated) throw new Error('Could not mark payment — admin access required');

  await completeCycleIfAllPaid(row.cycle_id);
}

/** Admin-only: mark a member's contribution as paid (cash / bank transfer). */
export async function recordContributionPayment(contributionId: string) {
  await assertAdminForContribution(contributionId);

  const { error } = await supabase.rpc('record_contribution_payment', {
    p_contribution_id: contributionId,
  });

  if (!error) return;

  if (isMissingRpc(error) || error.code === '42501') {
    await recordContributionPaymentDirect(contributionId);
    return;
  }

  throw error;
}

export async function getContribution(contributionId: string) {
  const { data, error } = await supabase
    .from('contributions')
    .select('*, cycles(cycle_number, due_date, groups(id, name, contribution_amount))')
    .eq('id', contributionId)
    .single();
  if (error) throw error;
  return data;
}
