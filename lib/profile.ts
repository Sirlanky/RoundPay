import type { User } from '@supabase/supabase-js';
import { Alert } from 'react-native';
import { supabase } from './supabase';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const PROFILE_SQL_DASHBOARD_URL =
  'https://supabase.com/dashboard/project/dolcajrcjhsfpyxzwtjk/sql/new';

export const PROFILE_SETUP_FIX_MESSAGE =
  'Your Supabase project still needs a one-time SQL fix. Open SQL Editor, paste and run the file supabase/migrations/RUN_IN_SQL_EDITOR.sql from this repo, then Profile → Sign out → Enter app, and try again.';

function profileSetupMessage(cause: string): string {
  return `${cause} ${PROFILE_SETUP_FIX_MESSAGE}`;
}

async function loadProfileId(userId: string): Promise<string | null> {
  const { data, error } = await supabase.from('profiles').select('id').eq('id', userId).maybeSingle();
  if (error && !/JWT|PGRST116/i.test(error.message)) {
    throw new Error(profileSetupMessage(error.message));
  }
  return data?.id ?? null;
}

/** Ensures a profiles row exists (needed before creating groups). */
export async function ensureProfile(user: User): Promise<void> {
  const existing = await loadProfileId(user.id);
  if (existing) return;

  for (let attempt = 0; attempt < 4; attempt++) {
    await sleep(300 * (attempt + 1));
    if (await loadProfileId(user.id)) return;
  }

  const { error: rpcError } = await supabase.rpc('ensure_my_profile');
  if (!rpcError && (await loadProfileId(user.id))) return;

  const rpcMissing =
    rpcError &&
    (/function.*ensure_my_profile|schema cache|PGRST202/i.test(rpcError.message) ||
      rpcError.code === 'PGRST202');

  if (rpcError && !rpcMissing) {
    throw new Error(profileSetupMessage(rpcError.message));
  }

  const { error: insertError } = await supabase.from('profiles').insert({
    id: user.id,
    email: user.email ?? null,
    full_name: user.user_metadata?.full_name ?? null,
  });

  if (!insertError && (await loadProfileId(user.id))) return;

  if (insertError && (insertError.message.includes('duplicate') || insertError.code === '23505')) {
    if (await loadProfileId(user.id)) return;
  }

  if (insertError && /row-level security|42501/i.test(insertError.message)) {
    throw new Error(profileSetupMessage('Profile insert blocked (RLS).'));
  }

  if (rpcMissing) {
    throw new Error(profileSetupMessage('Missing ensure_my_profile function in database.'));
  }

  throw new Error(
    profileSetupMessage(insertError?.message ?? 'Profile row still missing after setup.')
  );
}

export function isProfileDatabaseFixError(message: string): boolean {
  return (
    /PROFILE_NOT_READY|ensure_my_profile|RUN_IN_SQL_EDITOR|Profile insert blocked|Missing ensure_my_profile/i.test(
      message
    ) ||
    /profiles|foreign key/i.test(message)
  );
}

export function alertProfileDatabaseFix(title = 'Database fix required') {
  Alert.alert(title, PROFILE_SETUP_FIX_MESSAGE, [{ text: 'OK' }]);
}
