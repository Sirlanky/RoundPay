import type { Conversation } from './messages';
import { isMessagingNotInstalled } from './public-profile';
import { supabase } from './supabase';

export function contactDisplayName(
  contactId: string,
  profileName: string | null | undefined,
  labels: Record<string, string>,
  fallback: string
): string {
  const custom = labels[contactId]?.trim();
  if (custom) return custom;
  const profile = profileName?.trim();
  if (profile) return profile;
  return fallback;
}

export function conversationDisplayName(
  conversation: Conversation,
  labels: Record<string, string>,
  fallback: string
): string {
  return contactDisplayName(conversation.otherUserId, conversation.fullName, labels, fallback);
}

export async function fetchContactLabels(): Promise<Record<string, string>> {
  const { data: auth } = await supabase.auth.getUser();
  const me = auth.user?.id;
  if (!me) return {};

  const { data, error } = await supabase
    .from('message_contact_labels')
    .select('contact_id, label')
    .eq('owner_id', me);

  if (error) {
    if (isContactLabelsNotInstalled(error)) return {};
    throw error;
  }

  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    const r = row as { contact_id: string; label: string };
    if (r.contact_id && r.label?.trim()) {
      map[r.contact_id] = r.label.trim();
    }
  }
  return map;
}

export async function saveContactLabel(contactId: string, label: string): Promise<void> {
  const trimmed = label.trim();
  if (!trimmed) throw new Error('Enter a name.');
  if (trimmed.length > 80) throw new Error('Name is too long (max 80 characters).');

  const { data: auth } = await supabase.auth.getUser();
  const me = auth.user?.id;
  if (!me) throw new Error('Sign in to save contact names.');

  const { error } = await supabase.from('message_contact_labels').upsert(
    {
      owner_id: me,
      contact_id: contactId,
      label: trimmed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'owner_id,contact_id' }
  );

  if (error) throw error;
}

export async function clearContactLabel(contactId: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const me = auth.user?.id;
  if (!me) return;

  const { error } = await supabase
    .from('message_contact_labels')
    .delete()
    .eq('owner_id', me)
    .eq('contact_id', contactId);

  if (error && !isContactLabelsNotInstalled(error)) throw error;
}

export function isContactLabelsNotInstalled(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { code?: string; message?: string };
  return (
    isMessagingNotInstalled(error) ||
    e.code === '42P01' ||
    e.code === 'PGRST205' ||
    (e.message?.includes('message_contact_labels') ?? false)
  );
}
