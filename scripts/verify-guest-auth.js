#!/usr/bin/env node
/**
 * Verifies anonymous (guest) sign-in against the configured Supabase project.
 * Does not print API keys.
 */
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ Missing .env');
  process.exit(1);
}

const env = fs.readFileSync(envPath, 'utf8');
const url = (env.match(/EXPO_PUBLIC_SUPABASE_URL=(.+)/)?.[1] ?? '').trim();
const key = (env.match(/EXPO_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1] ?? '').trim();

if (!url || !key) {
  console.error('❌ Supabase URL or anon key missing in .env');
  process.exit(1);
}

async function main() {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    console.error('❌ Guest sign-in failed:', error.message);
    if (/anonymous|disabled/i.test(error.message)) {
      console.error('   Enable Anonymous sign-ins in Supabase → Authentication → Providers.');
    }
    process.exit(1);
  }

  if (!data.session?.user?.id) {
    console.error('❌ Unexpected response from auth');
    process.exit(1);
  }

  console.log('✅ Anonymous sign-in works');
  console.log(`   User id: ${data.session.user.id.slice(0, 8)}…`);

  const { error: rpcError } = await supabase.rpc('ensure_my_profile');
  if (rpcError) {
    if (/ensure_my_profile|PGRST202/i.test(rpcError.message)) {
      console.error('❌ Profile setup RPC missing — run supabase/migrations/RUN_IN_SQL_EDITOR.sql in Supabase SQL Editor');
      process.exit(1);
    }
    console.error('❌ ensure_my_profile failed:', rpcError.message);
    process.exit(1);
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', data.session.user.id)
    .maybeSingle();

  if (profileError || !profile) {
    console.error('❌ Profile row missing after ensure_my_profile:', profileError?.message ?? 'no row');
    console.error('   Run supabase/migrations/RUN_IN_SQL_EDITOR.sql in Supabase SQL Editor');
    process.exit(1);
  }

  console.log('✅ Profile row exists');
  process.exit(0);

  console.error('❌ Unexpected response from auth');
  process.exit(1);
}

main().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});
