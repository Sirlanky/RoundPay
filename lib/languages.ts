/** Major languages spoken in Nigeria (plus English as official language). */
export type AppLanguage =
  | 'en'
  | 'ha'
  | 'yo'
  | 'ig'
  | 'pcm'
  | 'ff'
  | 'kr'
  | 'tiv'
  | 'ijc'
  | 'ibb'
  | 'bin';

export interface LanguageOption {
  code: AppLanguage;
  label: string;
  nativeLabel: string;
}

export const NIGERIAN_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'ha', label: 'Hausa', nativeLabel: 'Hausa' },
  { code: 'yo', label: 'Yoruba', nativeLabel: 'Yorùbá' },
  { code: 'ig', label: 'Igbo', nativeLabel: 'Asụsụ Igbo' },
  { code: 'pcm', label: 'Nigerian Pidgin', nativeLabel: 'Naija' },
  { code: 'ff', label: 'Fulfulde', nativeLabel: 'Fulfulde' },
  { code: 'kr', label: 'Kanuri', nativeLabel: 'Kanuri' },
  { code: 'tiv', label: 'Tiv', nativeLabel: 'Tiv' },
  { code: 'ijc', label: 'Ijaw', nativeLabel: 'Izon' },
  { code: 'ibb', label: 'Ibibio', nativeLabel: 'Ibibio' },
  { code: 'bin', label: 'Edo', nativeLabel: 'Ẹ̀dó' },
];

export const DEFAULT_LANGUAGE: AppLanguage = 'en';

const languageByCode = new Map(NIGERIAN_LANGUAGES.map((l) => [l.code, l]));

export function getLanguageOption(code: AppLanguage | string | null | undefined): LanguageOption {
  return languageByCode.get(code as AppLanguage) ?? languageByCode.get(DEFAULT_LANGUAGE)!;
}

export function getLanguageLabel(code: AppLanguage | string | null | undefined): string {
  return getLanguageOption(code).label;
}

/** Label shown in settings — prefers native name when it differs from English label. */
export function getLanguageDisplayLabel(code: AppLanguage | string | null | undefined): string {
  const option = getLanguageOption(code);
  return option.nativeLabel !== option.label ? option.nativeLabel : option.label;
}

export function isAppLanguage(value: string): value is AppLanguage {
  return languageByCode.has(value as AppLanguage);
}
