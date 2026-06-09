import type { AppLanguage } from '@/lib/languages';
import type { TranslationKey } from './keys';
import { translate } from './index';

export type PluralFn = (
  count: number,
  oneKey: TranslationKey,
  otherKey: TranslationKey,
  vars?: Record<string, string | number>
) => string;

export function createPluralFn(language: AppLanguage): PluralFn {
  return (count, oneKey, otherKey, vars) => {
    const key = count === 1 ? oneKey : otherKey;
    return translate(language, key, { count, ...vars });
  };
}

/** e.g. "1 group · 2 active" or "3 groups · 1 active" */
export function formatWalletGroupLine(total: number, active: number, tp: PluralFn): string {
  const groups = tp(total, 'plural.group_one', 'plural.group_other', { count: total });
  const activePart = tp(active, 'plural.activeCount_one', 'plural.activeCount_other', { count: active });
  return `${groups} · ${activePart}`;
}

/** e.g. "2 groups · 1 finished" */
export function formatGroupsFinishedLine(total: number, finished: number, tp: PluralFn): string {
  const groups = tp(total, 'plural.group_one', 'plural.group_other', { count: total });
  const done = tp(finished, 'plural.finished_one', 'plural.finished_other', { count: finished });
  return `${groups} · ${done}`;
}
