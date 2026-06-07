import type { AppLanguage } from '@/lib/languages';
import { DEFAULT_LANGUAGE } from '@/lib/languages';
import { bin } from './bin';
import { en } from './en';
import { ff } from './ff';
import { ha } from './ha';
import { ibb } from './ibb';
import { ig } from './ig';
import { ijc } from './ijc';
import { kr } from './kr';
import { pcm } from './pcm';
import type { TranslationKey } from './keys';
import { tiv } from './tiv';
import { yo } from './yo';

const catalogs: Record<AppLanguage, Record<TranslationKey, string>> = {
  en,
  ha,
  yo,
  ig,
  pcm,
  ff,
  kr,
  tiv,
  ijc,
  ibb,
  bin,
};

export function translate(
  language: AppLanguage,
  key: TranslationKey,
  vars?: Record<string, string | number>
): string {
  const catalog = catalogs[language] ?? catalogs[DEFAULT_LANGUAGE] ?? en;
  let text = catalog[key] ?? en[key] ?? key;

  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{${name}\\}`, 'g'), String(value));
    }
  }

  return text;
}

export function translateAccountMode(language: AppLanguage, mode: string): string {
  const key = `account.${mode}` as TranslationKey;
  return translate(language, key);
}

export function translatePushStatus(
  language: AppLanguage,
  status: 'granted' | 'denied' | 'undetermined' | 'unsupported',
  options?: { hasToken?: boolean; pushEnabled?: boolean }
): string {
  if (status === 'unsupported') return translate(language, 'push.simulator');
  if (status === 'denied') return translate(language, 'push.off');
  if (options?.pushEnabled === false) return translate(language, 'push.disabled');
  if (options?.hasToken && status === 'granted') return translate(language, 'push.enabled');
  if (status === 'granted') return translate(language, 'push.notSet');
  return translate(language, 'push.notSet');
}

export function translateGroupBucket(language: AppLanguage, bucket: 'draft' | 'active' | 'completed'): string {
  const map = {
    draft: 'groups.settingUp',
    active: 'groups.active',
    completed: 'groups.history',
  } as const;
  return translate(language, map[bucket]);
}
