/**
 * Sync Ajo terminology from en.ts to other catalogs.
 * - Updates existing single-line keys under known prefixes
 * - Appends only keys that are missing entirely
 */
import fs from 'fs';
import path from 'path';

const ROOT = path.join(import.meta.dirname, '..');
const LANGS = ['ha', 'yo', 'ig', 'pcm', 'ff', 'kr', 'tiv', 'ijc', 'ibb', 'bin'];

const enSrc = fs.readFileSync(path.join(ROOT, 'lib/i18n/en.ts'), 'utf8');

function parseEntries(src) {
  const entries = new Map();
  const re = /^\s*'([^']+)':\s*([\s\S]*?)(?=,\s*\n\s*'|\n};)/gm;
  for (const m of src.matchAll(re)) {
    entries.set(m[1], m[2].trim());
  }
  return entries;
}

const enEntries = parseEntries(enSrc);

const PREFIXES = [
  'nav.',
  'plural.cycle',
  'plural.contribution',
  'plural.cyclePosition',
  'group.',
  'contributions.',
  'payouts.',
  'home.',
  'profile.payout',
  'profile.contribution',
  'profile.bank',
  'messages.collecting',
  'notifications.filterPayouts',
  'payoutOrder.',
  'admin.',
  'reminders.',
  'help.',
  'terms.',
  'about.',
  'schedule.',
  'cycle.',
  'create.',
];

const keysToSync = [...enEntries.keys()].filter((k) => PREFIXES.some((p) => k.startsWith(p)));

function hasKey(src, key) {
  return new RegExp(`^\\s*'${key.replace(/\./g, '\\.')}':`, 'm').test(src);
}

function upsertKey(src, key, value) {
  const singleLine = !value.includes('\n');
  const lineRe = new RegExp(`^(\\s*'${key.replace(/\./g, '\\.')}':\\s*).*$`, 'm');

  if (hasKey(src, key)) {
    if (!singleLine) return src;
    return src.replace(lineRe, `$1${value},`);
  }

  return src.replace(/\n};\s*$/, `\n  '${key}': ${value},\n};\n`);
}

for (const lang of LANGS) {
  const file = path.join(ROOT, 'lib/i18n', `${lang}.ts`);
  let src = fs.readFileSync(file, 'utf8');

  for (const key of keysToSync) {
    const value = enEntries.get(key)?.replace(/,\s*$/, '');
    if (!value) continue;
    src = upsertKey(src, key, value);
  }

  fs.writeFileSync(file, src);
  console.log('Synced', lang);
}
