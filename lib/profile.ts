import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function profileSetupMessage(cause: string): string {
  if (__DEV__) {
    return `${cause} Run supabase/migrations/RUN_IN_SQL_EDITOR.sql in Supabase SQL Editor, then try Enter app again.`;
  }
  return 'Could not set up your profile. Run the SQL fix in Supabase (see docs/SUPABASE_SETUP.md), then sign in again.';
}

/** Ensures a profiles row exists (needed before creating groups). */
export async function ensureProfile(user: User): Promise<void> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const { data: existing, error: selectError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (existing) return;
    if (selectError && !selectError.message.includes('JWT')) {
      throw new Error(profileSetupMessage(selectError.message));
    }

    if (attempt > 0) await sleep(250 * attempt);
  }

  const { error: rpcError } = await supabase.rpc('ensure_my_profile');
  if (!rpcError) {
    const { data: afterRpc } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle();
    if (afterRpc) return;
  }

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

  if (!insertError) return;

  if (insertError.message.includes('duplicate') || insertError.code === '23505') {
    return;
  }

  if (/row-level security|42501/i.test(insertError.message)) {
    throw new Error(
      profileSetupMessage(
        'Profile insert blocked by database security (RLS).'
      )
    );
  }

  throw new Error(profileSetupMessage(insertError.message));
}
