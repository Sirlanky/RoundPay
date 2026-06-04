#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ Missing .env — run: cp .env.example .env');
  process.exit(1);
}

const env = fs.readFileSync(envPath, 'utf8');
const required = {
  EXPO_PUBLIC_SUPABASE_URL: /EXPO_PUBLIC_SUPABASE_URL=(.+)/,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: /EXPO_PUBLIC_SUPABASE_ANON_KEY=(.+)/,
};
const optional = {
  EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY: /EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY=(.+)/,
};

let ok = true;
for (const [name, re] of Object.entries(required)) {
  const m = env.match(re);
  const val = m?.[1]?.trim() ?? '';
  const placeholder =
    !val ||
    val.includes('your-project') ||
    val.includes('your-anon') ||
    val.includes('your-anon-or-publishable') ||
    val.includes('xxxxxxxx');
  const supabaseKeyOk =
    name !== 'EXPO_PUBLIC_SUPABASE_ANON_KEY' ||
    val.startsWith('eyJ') ||
    val.startsWith('sb_publishable_');
  if (name === 'EXPO_PUBLIC_SUPABASE_ANON_KEY' && !placeholder && !supabaseKeyOk) {
    console.error(`❌ ${name} must be anon (eyJ...) or publishable (sb_publishable_...) key`);
    ok = false;
    continue;
  }
  if (placeholder) {
    console.error(`❌ ${name} not configured`);
    ok = false;
  } else {
    console.log(`✅ ${name}`);
  }
}

for (const [name, re] of Object.entries(optional)) {
  const m = env.match(re);
  const val = m?.[1]?.trim() ?? '';
  const placeholder = !val || val.includes('xxxxxxxx');
  if (placeholder) {
    console.log(`⚠️  ${name} not set (payments disabled until you add a Paystack test key)`);
  } else {
    console.log(`✅ ${name}`);
  }
}

if (ok) {
  console.log('\nApp env looks ready. Run: npx expo start --clear');
} else {
  console.log('\nSee docs/SUPABASE_SETUP.md for setup steps.');
  process.exit(1);
}
