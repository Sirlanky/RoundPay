import { generateInviteCode } from './format';
import { supabase } from './supabase';
import type { GroupFrequency } from './types';

export async function createGroup(params: {
  name: string;
  contributionAmount: number;
  frequency: GroupFrequency;
  maxMembers: number;
  adminFeePercent: number;
  adminId: string;
}) {
  const inviteCode = generateInviteCode();
  const { data: group, error } = await supabase
    .from('groups')
    .insert({
      name: params.name,
      contribution_amount: params.contributionAmount,
      frequency: params.frequency,
      max_members: params.maxMembers,
      admin_fee_percent: params.adminFeePercent,
      admin_id: params.adminId,
      invite_code: inviteCode,
      status: 'draft',
    })
    .select()
    .single();

  if (error) throw error;

  await supabase.from('group_members').insert({
    group_id: group.id,
    user_id: params.adminId,
    rotation_order: 1,
    role: 'admin',
  });

  return group;
}

export async function joinGroup(inviteCode: string, userId: string) {
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('*')
    .eq('invite_code', inviteCode.toUpperCase())
    .eq('status', 'draft')
    .single();

  if (groupError || !group) throw new Error('Invalid invite code or group already started');

  const { count } = await supabase
    .from('group_members')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', group.id);

  if ((count ?? 0) >= group.max_members) throw new Error('Group is full');

  const { data: existing } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', group.id)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) throw new Error('You are already in this group');

  const nextOrder = (count ?? 0) + 1;
  const { error: joinError } = await supabase.from('group_members').insert({
    group_id: group.id,
    user_id: userId,
    rotation_order: nextOrder,
    role: 'member',
  });

  if (joinError) throw joinError;
  return group;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export async function startGroup(groupId: string) {
  const { data: group } = await supabase.from('groups').select('*').eq('id', groupId).single();
  if (!group || group.status !== 'draft') throw new Error('Group cannot be started');

  const { data: members } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', groupId)
    .order('rotation_order');

  if (!members || members.length < 2) throw new Error('Need at least 2 members to start');

  const recipient = members[0];
  const dueDate =
    group.frequency === 'weekly'
      ? addDays(new Date(), 7)
      : addMonths(new Date(), 1);

  const { data: cycle, error: cycleError } = await supabase
    .from('cycles')
    .insert({
      group_id: groupId,
      cycle_number: 1,
      recipient_id: recipient.user_id,
      due_date: dueDate.toISOString(),
      status: 'collecting',
    })
    .select()
    .single();

  if (cycleError) throw cycleError;

  const contributions = members.map((m) => ({
    cycle_id: cycle.id,
    member_id: m.id,
    user_id: m.user_id,
    amount: group.contribution_amount,
    status: 'pending' as const,
  }));

  await supabase.from('contributions').insert(contributions);

  await supabase
    .from('groups')
    .update({ status: 'active', current_cycle: 1 })
    .eq('id', groupId);

  return cycle;
}

export async function advanceCycle(groupId: string) {
  const { data: group } = await supabase.from('groups').select('*').eq('id', groupId).single();
  if (!group) throw new Error('Group not found');

  const { data: currentCycle } = await supabase
    .from('cycles')
    .select('*')
    .eq('group_id', groupId)
    .eq('cycle_number', group.current_cycle)
    .single();

  if (!currentCycle || currentCycle.status !== 'paid_out') {
    throw new Error('Current cycle must be paid out before advancing');
  }

  const { data: members } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', groupId)
    .order('rotation_order');

  if (!members) throw new Error('No members');

  const nextCycleNum = group.current_cycle + 1;
  if (nextCycleNum > members.length) {
    await supabase.from('groups').update({ status: 'completed' }).eq('id', groupId);
    return null;
  }

  const recipient = members[nextCycleNum - 1];
  const dueDate =
    group.frequency === 'weekly'
      ? addDays(new Date(), 7)
      : addMonths(new Date(), 1);

  const { data: cycle, error } = await supabase
    .from('cycles')
    .insert({
      group_id: groupId,
      cycle_number: nextCycleNum,
      recipient_id: recipient.user_id,
      due_date: dueDate.toISOString(),
      status: 'collecting',
    })
    .select()
    .single();

  if (error) throw error;

  const contributions = members.map((m) => ({
    cycle_id: cycle.id,
    member_id: m.id,
    user_id: m.user_id,
    amount: group.contribution_amount,
    status: 'pending' as const,
  }));

  await supabase.from('contributions').insert(contributions);
  await supabase.from('groups').update({ current_cycle: nextCycleNum }).eq('id', groupId);

  return cycle;
}

export async function getUserGroups(userId: string) {
  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId);

  if (!memberships?.length) return [];

  const groupIds = memberships.map((m) => m.group_id);
  const { data: groups } = await supabase
    .from('groups')
    .select('*')
    .in('id', groupIds)
    .order('updated_at', { ascending: false });

  return groups ?? [];
}
