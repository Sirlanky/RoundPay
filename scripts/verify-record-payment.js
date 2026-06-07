#!/usr/bin/env node
/**
 * Checks record_contribution_payment RPC exists.
 * Run: node scripts/verify-record-payment.js
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

async function main() {
  const supabase = createClient(url, anon);

  const { data: auth, error: authErr } = await supabase.auth.signInAnonymously();
  if (authErr) {
    console.error('Guest sign-in failed:', authErr.message);
    console.error('Enable Anonymous sign-ins in Supabase → Authentication → Providers');
    process.exit(1);
  }

  const fakeId = '00000000-0000-0000-0000-000000000001';
  const { error } = await supabase.rpc('record_contribution_payment', {
    p_contribution_id: fakeId,
  });

  if (!error) {
    console.log('OK: record_contribution_payment RPC exists (unexpected success on fake id)');
    process.exit(0);
  }

  const msg = error.message ?? '';
  if (msg.includes('Could not find the function') || error.code === 'PGRST202') {
    console.error('MISSING: record_contribution_payment RPC');
    console.error('Run supabase/migrations/RECORD_PAYMENT_FIX.sql in Supabase SQL Editor');
    process.exit(1);
  }

  if (msg.includes('Contribution not found') || msg.includes('Not authorized')) {
    console.log('OK: record_contribution_payment RPC is installed');
    process.exit(0);
  }

  console.log('RPC response:', error.code, msg);
  process.exit(error.code === '42501' ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
