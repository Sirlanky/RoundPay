/**
 * Backfill missing TranslationKey entries in non-en catalogs from en.ts.
 * Run: node scripts/backfill-i18n.mjs
 */
import fs from 'fs';
import path from 'path';

const ROOT = path.join(import.meta.dirname, '..');
const LANGS = ['ha', 'yo', 'ig', 'pcm', 'ff', 'kr', 'tiv', 'ijc', 'ibb', 'bin'];

function parseEntries(src) {
  const entries = new Map();
  const re = /^\s*'([^']+)':\s*([\s\S]*?)(?=,\s*\n\s*'|\n};)/gm;
  for (const m of src.matchAll(re)) {
    entries.set(m[1], m[2].trim().replace(/,\s*$/, ''));
  }
  return entries;
}

function hasKey(src, key) {
  return new RegExp(`^\\s*'${key.replace(/\./g, '\\.')}':`, 'm').test(src);
}

const enEntries = parseEntries(fs.readFileSync(path.join(ROOT, 'lib/i18n/en.ts'), 'utf8'));

for (const lang of LANGS) {
  const file = path.join(ROOT, 'lib/i18n', `${lang}.ts`);
  let src = fs.readFileSync(file, 'utf8');
  let added = 0;

  for (const [key, value] of enEntries) {
    if (hasKey(src, key)) continue;
    src = src.replace(/\n};\s*$/, `\n  '${key}': ${value},\n};\n`);
    added++;
  }

  fs.writeFileSync(file, src);
  console.log(lang, 'added', added);
}
