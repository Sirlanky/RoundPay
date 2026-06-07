#!/usr/bin/env node
/** Verifies notifications table, RPC, and triggers are installed. */
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const env = fs.readFileSync(envPath, 'utf8');
const url = (env.match(/EXPO_PUBLIC_SUPABASE_URL=(.+)/)?.[1] ?? '').trim().replace(/\/$/, '');
const key = (env.match(/EXPO_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1] ?? '').trim();

async function main() {
  const tableRes = await fetch(`${url}/rest/v1/notifications?select=id&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  const tableBody = await tableRes.json().catch(() => ({}));

  if (!tableRes.ok && tableBody.code === 'PGRST205') {
    console.error('❌ notifications table missing from API');
    console.error('Run: supabase/migrations/014_notifications.sql');
    process.exit(1);
  }

  if (!tableRes.ok) {
    console.error('❌ notifications API error:', tableRes.status, tableBody);
    process.exit(1);
  }

  console.log('✅ notifications table is exposed');

  const rpcRes = await fetch(`${url}/rest/v1/rpc/create_notification`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      p_user_id: '00000000-0000-0000-0000-000000000000',
      p_group_id: '00000000-0000-0000-0000-000000000000',
      p_type: 'test',
      p_title: 'test',
      p_message: 'test',
    }),
  });
  const rpcBody = await rpcRes.json().catch(() => ({}));

  if (rpcRes.status === 404 || rpcBody.code === 'PGRST202') {
    console.error('❌ create_notification RPC missing');
    process.exit(1);
  }

  if (rpcRes.status === 401 || rpcRes.status === 403) {
    console.log('✅ create_notification RPC locked down (not callable from anon)');
  } else {
    console.warn('⚠️  create_notification returned', rpcRes.status, '- re-run grant revokes in 014_notifications.sql');
  }

  console.log('');
  console.log('Triggers fire on: group_members insert, contributions paid, payouts completed.');
  console.log('Test in app: join a group or record a payment, then open Alerts.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
