import { generateInviteCode } from './format';
import { isFrequencyConstraintError, refreshSupportedGroupFrequencies } from './group-frequency-support';
import { ensureProfile } from './profile';
import { supabase } from './supabase';
import type { AjoGroup, GroupFrequency } from './types';
import type { User } from '@supabase/supabase-js';

export async function createGroup(params: {
  name: string;
  contributionAmount: number;
  frequency: GroupFrequency;
  maxMembers: number;
  adminFeePercent: number;
  adminUser: User;
  /** When false, admin organizes only and is not added to the rotation. Default true. */
  adminParticipates?: boolean;
}) {
  await ensureProfile(params.adminUser);

  const inviteCode = generateInviteCode();
  const { data: group, error } = await supabase
    .from('groups')
    .insert({
      name: params.name,
      contribution_amount: params.contributionAmount,
      frequency: params.frequency,
      max_members: params.maxMembers,
      admin_fee_percent: params.adminFeePercent,
      admin_id: params.adminUser.id,
      invite_code: inviteCode,
      status: 'draft',
    })
    .select()
    .single();

  if (error) {
    if (isFrequencyConstraintError(error)) {
      await refreshSupportedGroupFrequencies();
      throw new Error('FREQUENCY_NOT_SUPPORTED');
    }
    throw error;
  }

  if (params.adminParticipates !== false) {
    const { error: memberError } = await supabase.from('group_members').insert({
      group_id: group.id,
      user_id: params.adminUser.id,
      rotation_order: 1,
      role: 'admin',
    });
    if (memberError) {
      await supabase.from('groups').delete().eq('id', group.id);
      throw memberError;
    }
  }

  return group;
}

export type GroupJoinPreview = Pick<
  AjoGroup,
  'id' | 'name' | 'contribution_amount' | 'frequency' | 'max_members' | 'status' | 'invite_code'
> & { member_count: number };

export async function previewGroupByInviteCode(inviteCode: string): Promise<GroupJoinPreview | null> {
  const code = inviteCode.trim().toUpperCase();
  const { data: group, error } = await supabase
    .from('groups')
    .select('id, name, contribution_amount, frequency, max_members, status, invite_code')
    .eq('invite_code', code)
    .eq('status', 'draft')
    .maybeSingle();

  if (error || !group) return null;

  const { count } = await supabase
    .from('group_members')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', group.id);

  return { ...(group as GroupJoinPreview), member_count: count ?? 0 };
}

export async function joinGroup(inviteCode: string, userId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== userId) {
    throw new Error('You must be signed in to join a group');
  }
  await ensureProfile(user);

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

/** Join or leave the rotation as admin while the group is still in draft. */
export async function setAdminParticipation(groupId: string, _adminUserId: string, participates: boolean) {
  const { error } = await supabase.rpc('set_admin_participation', {
    p_group_id: groupId,
    p_participates: participates,
  });
  if (error) throw error;
}

export async function startGroup(groupId: string) {
  const { data: cycleId, error } = await supabase.rpc('start_group', { p_group_id: groupId });
  if (error) throw error;

  const { data: cycle, error: cycleError } = await supabase
    .from('cycles')
    .select('*')
    .eq('id', cycleId as string)
    .single();

  if (cycleError) throw cycleError;
  return cycle;
}

export async function advanceCycle(groupId: string) {
  const { data: cycleId, error } = await supabase.rpc('advance_cycle', { p_group_id: groupId });
  if (error) throw error;

  if (cycleId == null) return null;

  const { data: cycle, error: cycleError } = await supabase
    .from('cycles')
    .select('*')
    .eq('id', cycleId as string)
    .single();

  if (cycleError) throw cycleError;
  return cycle;
}

export async function getUserGroups(userId: string) {
  const [{ data: memberships }, { data: adminGroups }] = await Promise.all([
    supabase.from('group_members').select('group_id').eq('user_id', userId),
    supabase.from('groups').select('id').eq('admin_id', userId),
  ]);

  const groupIds = [
    ...new Set([
      ...(memberships?.map((m) => m.group_id) ?? []),
      ...(adminGroups?.map((g) => g.id) ?? []),
    ]),
  ];

  if (!groupIds.length) return [];

  const { data: groups } = await supabase
    .from('groups')
    .select('*')
    .in('id', groupIds)
    .order('updated_at', { ascending: false });

  return groups ?? [];
}

function isMissingDeleteRpc(error: { code?: string; message?: string }): boolean {
  return (
    error.code === 'PGRST202' ||
    (error.message?.includes('delete_draft_group') ?? false) ||
    (error.message?.includes('Could not find the function') ?? false)
  );
}

/** Admin-only: permanently delete a group that has not started yet. */
export async function deleteDraftGroup(groupId: string) {
  const { error } = await supabase.rpc('delete_draft_group', { p_group_id: groupId });

  if (!error) return;

  if (isMissingDeleteRpc(error)) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: group, error: fetchErr } = await supabase
      .from('groups')
      .select('id, admin_id, status')
      .eq('id', groupId)
      .single();

    if (fetchErr || !group) throw fetchErr ?? new Error('Group not found');
    if (group.admin_id !== user.id) throw new Error('Only the admin can delete this group');
    if (group.status !== 'draft') throw new Error('Only draft groups can be deleted');

    const { error: deleteErr } = await supabase.from('groups').delete().eq('id', groupId);
    if (deleteErr) throw deleteErr;
    return;
  }

  throw error;
}

export async function updateDraftGroupSettings(
  groupId: string,
  patch: {
    name?: string;
    contributionAmount?: number;
    frequency?: GroupFrequency;
    maxMembers?: number;
  },
  opts?: { currentMemberCount?: number }
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: group, error: fetchErr } = await supabase
    .from('groups')
    .select('id, admin_id, status')
    .eq('id', groupId)
    .single();

  if (fetchErr || !group) throw fetchErr ?? new Error('Group not found');
  if (group.admin_id !== user.id) throw new Error('Only the admin can edit this group');
  if (group.status !== 'draft') throw new Error('Only draft groups can be edited');

  if (patch.maxMembers != null && opts?.currentMemberCount != null && patch.maxMembers < opts.currentMemberCount) {
    throw new Error(`Max members cannot be less than ${opts.currentMemberCount} (already joined)`);
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.name != null) updates.name = patch.name.trim();
  if (patch.contributionAmount != null) updates.contribution_amount = patch.contributionAmount;
  if (patch.frequency != null) updates.frequency = patch.frequency;
  if (patch.maxMembers != null) updates.max_members = patch.maxMembers;

  const { data, error } = await supabase.from('groups').update(updates).eq('id', groupId).select().single();
  if (error) {
    if (isFrequencyConstraintError(error)) {
      await refreshSupportedGroupFrequencies();
      throw new Error('FREQUENCY_NOT_SUPPORTED');
    }
    throw error;
  }
  return data as AjoGroup;
}
