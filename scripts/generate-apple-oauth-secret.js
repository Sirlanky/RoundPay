#!/usr/bin/env node
/**
 * Generate the Apple OAuth "Secret Key" (JWT) for Supabase → Auth → Apple provider.
 *
 * Apple does NOT give you a permanent secret string. You create a .p8 signing key once,
 * then run this script every ~6 months to paste a new JWT into Supabase.
 *
 * Usage:
 *   node scripts/generate-apple-oauth-secret.js \
 *     --team-id YOUR_TEAM_ID \
 *     --key-id YOUR_KEY_ID \
 *     --services-id com.roundpay.ajoesusu.auth \
 *     --p8 ./AuthKey_XXXXXXXXXX.p8
 *
 * Supabase → Authentication → Providers → Apple:
 *   Client IDs: com.roundpay.ajoesusu,com.roundpay.ajoesusu.auth
 *   Secret Key: (paste JWT output from this script)
 */

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--team-id') out.teamId = argv[++i];
    else if (arg === '--key-id') out.keyId = argv[++i];
    else if (arg === '--services-id') out.servicesId = argv[++i];
    else if (arg === '--p8') out.p8Path = argv[++i];
    else if (arg === '--help' || arg === '-h') out.help = true;
  }
  return out;
}

function base64Url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function main() {
  const args = parseArgs(process.argv);

  if (args.help || !args.teamId || !args.keyId || !args.servicesId || !args.p8Path) {
    console.log(`Generate Apple OAuth secret (JWT) for Supabase

Required:
  --team-id       Apple Developer Team ID (Membership page)
  --key-id        Key ID from Keys → Sign in with Apple key
  --services-id   Services ID identifier (e.g. com.roundpay.ajoesusu.auth)
  --p8            Path to AuthKey_XXXXXXXXXX.p8 file

Example:
  node scripts/generate-apple-oauth-secret.js \\
    --team-id ABCDE12345 \\
    --key-id XYZ9876543 \\
    --services-id com.roundpay.ajoesusu.auth \\
    --p8 ~/Downloads/AuthKey_XYZ9876543.p8
`);
    process.exit(args.help ? 0 : 1);
  }

  const p8Full = path.resolve(args.p8Path);
  if (!fs.existsSync(p8Full)) {
    console.error(`❌ .p8 file not found: ${p8Full}`);
    process.exit(1);
  }

  const privateKey = fs.readFileSync(p8Full, 'utf8');
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 86400 * 180; // max ~6 months

  const header = base64Url(JSON.stringify({ alg: 'ES256', kid: args.keyId, typ: 'JWT' }));
  const payload = base64Url(
    JSON.stringify({
      iss: args.teamId,
      iat,
      exp,
      aud: 'https://appleid.apple.com',
      sub: args.servicesId,
    })
  );

  const signingInput = `${header}.${payload}`;
  const sign = crypto.createSign('SHA256');
  sign.update(signingInput);
  sign.end();
  const signature = sign.sign({ key: privateKey, dsaEncoding: 'ieee-p1363' });
  const jwt = `${signingInput}.${base64Url(signature)}`;

  const expires = new Date(exp * 1000).toISOString().slice(0, 10);

  console.log('\n✅ Paste this into Supabase → Authentication → Providers → Apple → Secret Key:\n');
  console.log(jwt);
  console.log(`\nExpires around: ${expires} — regenerate before then.\n`);
  console.log('Client IDs field (comma-separated, no spaces):');
  console.log(`  com.roundpay.ajoesusu,${args.servicesId}\n`);
}

main();
