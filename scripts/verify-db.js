#!/usr/bin/env node
/** Checks that core Supabase tables are exposed via the Data API. */
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const env = fs.readFileSync(envPath, 'utf8');
const url = (env.match(/EXPO_PUBLIC_SUPABASE_URL=(.+)/)?.[1] ?? '').trim().replace(/\/$/, '');
const key = (env.match(/EXPO_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1] ?? '').trim();

const REQUIRED = ['profiles', 'groups', 'group_members'];

async function tableExists(table) {
  const res = await fetch(`${url}/rest/v1/${table}?select=id&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (res.status === 404) {
    const body = await res.json().catch(() => ({}));
    if (body.code === 'PGRST205') return false;
  }
  return res.ok || res.status === 401 || res.status === 406;
}

async function main() {
  const missing = [];
  for (const table of REQUIRED) {
    if (!(await tableExists(table))) missing.push(table);
  }

  if (missing.length) {
    console.error('❌ Database tables missing from API:', missing.join(', '));
    console.error('');
    console.error('The main schema was never applied. In Supabase SQL Editor, run IN ORDER:');
    console.error('  1. supabase/migrations/001_schema.sql   (full file — creates all tables)');
    console.error('  2. supabase/migrations/002_join_preview_rls.sql');
    console.error('  3. supabase/migrations/PROFILE_FIX_ONLY.sql');
    console.error('');
    console.error('https://supabase.com/dashboard/project/dolcajrcjhsfpyxzwtjk/sql/new');
    process.exit(1);
  }

  console.log('✅ Core tables exist (profiles, groups, group_members)');
}

main().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});
