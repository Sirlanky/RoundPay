import { isMessagingNotInstalled } from './public-profile';
import { supabase } from './supabase';

export { isMessagingNotInstalled };

export interface DirectMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

export interface Conversation {
  otherUserId: string;
  fullName: string | null;
  avatarUrl: string | null;
  lastBody: string;
  lastAt: string;
  lastSenderId: string;
  unreadCount: number;
}

type RawConversation = {
  other_user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  last_body: string;
  last_at: string;
  last_sender_id: string;
  unread_count: number;
};

export interface MessageableMember {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
  role?: 'admin' | 'member';
}

type GroupMemberRow = {
  user_id: string;
  profile?: { id?: string; full_name?: string | null; avatar_url?: string | null } | null;
};

function isMessageableGroupStatus(status: string): boolean {
  return status === 'active' || status === 'completed';
}

function addMessageable(
  byId: Map<string, MessageableMember>,
  id: string,
  fullName: string | null | undefined,
  avatarUrl: string | null | undefined,
  role?: 'admin' | 'member'
) {
  if (!id || byId.has(id)) return;
  byId.set(id, {
    id,
    fullName: fullName ?? null,
    avatarUrl: avatarUrl ?? null,
    role,
  });
}

async function messageableFromGroupIds(groupIds: string[], me: string): Promise<MessageableMember[]> {
  if (!groupIds.length) return [];

  const { data: groupRows, error: groupErr } = await supabase
    .from('groups')
    .select('id, status, admin_id')
    .in('id', groupIds)
    .in('status', ['active', 'completed']);
  if (groupErr) throw groupErr;

  const scopedIds = (groupRows ?? []).map((g) => (g as { id: string }).id);
  if (!scopedIds.length) return [];

  const adminIds = new Set(
    (groupRows ?? []).map((g) => (g as { admin_id: string }).admin_id).filter(Boolean)
  );

  const { data: rows, error } = await supabase
    .from('group_members')
    .select('user_id, profile:profiles(id, full_name, avatar_url)')
    .in('group_id', scopedIds)
    .neq('user_id', me);
  if (error) throw error;

  const byId = new Map<string, MessageableMember>();
  for (const r of rows ?? []) {
    const row = r as GroupMemberRow;
    const p = row.profile;
    if (!p?.id) continue;
    addMessageable(byId, p.id, p.full_name, p.avatar_url, 'member');
  }

  if (adminIds.size) {
    const { data: admins, error: adminErr } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', [...adminIds])
      .neq('id', me);
    if (adminErr) throw adminErr;
    for (const p of admins ?? []) {
      const profile = p as { id: string; full_name: string | null; avatar_url: string | null };
      addMessageable(byId, profile.id, profile.full_name, profile.avatar_url, 'admin');
    }
  }

  return Array.from(byId.values()).sort((a, b) => (a.fullName ?? '').localeCompare(b.fullName ?? ''));
}

/**
 * Everyone the current user can message — co-members and admins in active or
 * completed savings circles.
 */
export async function fetchMessageableMembers(): Promise<MessageableMember[]> {
  const { data: auth } = await supabase.auth.getUser();
  const me = auth.user?.id;
  if (!me) return [];

  const { data: mine, error: mineErr } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', me);
  if (mineErr) {
    if (isMessagingNotInstalled(mineErr)) return [];
    throw mineErr;
  }

  const groupIds = (mine ?? []).map((r) => (r as { group_id: string }).group_id);
  return messageableFromGroupIds(groupIds, me);
}

/** Members and admin for one active/completed group (for in-group messaging). */
export async function fetchGroupMessageTargets(groupId: string): Promise<MessageableMember[]> {
  const { data: auth } = await supabase.auth.getUser();
  const me = auth.user?.id;
  if (!me || !groupId) return [];

  const { data: group, error: groupErr } = await supabase
    .from('groups')
    .select('id, status')
    .eq('id', groupId)
    .maybeSingle();
  if (groupErr) throw groupErr;
  if (!group || !isMessageableGroupStatus((group as { status: string }).status)) return [];

  return messageableFromGroupIds([groupId], me);
}

export async function fetchConversations(): Promise<Conversation[]> {
  const { data, error } = await supabase.rpc('get_conversations');
  if (error) {
    if (isMessagingNotInstalled(error)) return [];
    throw error;
  }
  return ((data ?? []) as RawConversation[]).map((r) => ({
    otherUserId: r.other_user_id,
    fullName: r.full_name,
    avatarUrl: r.avatar_url,
    lastBody: r.last_body,
    lastAt: r.last_at,
    lastSenderId: r.last_sender_id,
    unreadCount: r.unread_count ?? 0,
  }));
}

export async function fetchThread(meId: string, otherUserId: string): Promise<DirectMessage[]> {
  const { data, error } = await supabase
    .from('direct_messages')
    .select('*')
    .or(
      `and(sender_id.eq.${meId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${meId})`
    )
    .order('created_at', { ascending: true });
  if (error) {
    if (isMessagingNotInstalled(error)) return [];
    throw error;
  }
  return (data ?? []) as DirectMessage[];
}

export async function sendMessage(recipientId: string, body: string): Promise<DirectMessage> {
  const trimmed = body.trim();
  const { data: auth } = await supabase.auth.getUser();
  const senderId = auth.user?.id;
  if (!senderId) throw new Error('You must be signed in to send messages.');

  const { data, error } = await supabase
    .from('direct_messages')
    .insert({ sender_id: senderId, recipient_id: recipientId, body: trimmed })
    .select('*')
    .single();
  if (error) throw error;
  return data as DirectMessage;
}

export async function markThreadRead(meId: string, otherUserId: string): Promise<void> {
  const { error } = await supabase
    .from('direct_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('recipient_id', meId)
    .eq('sender_id', otherUserId)
    .is('read_at', null);
  if (error && !isMessagingNotInstalled(error)) throw error;

  // Also clear the matching in-app notifications so the bell badge stays accurate.
  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', meId)
    .eq('type', 'direct_message')
    .eq('related_entity_id', otherUserId)
    .is('read_at', null);
}
