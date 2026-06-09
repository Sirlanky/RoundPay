import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { translate, translatePlural } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n/keys';
import type { PluralFn } from '@/lib/i18n/plural';
import { getLanguageLabel, type AppLanguage } from '@/lib/languages';
import { loadPreferredLanguage, savePreferredLanguage } from '@/lib/language-preference';

interface LanguageContextValue {
  language: AppLanguage;
  languageLabel: string;
  loading: boolean;
  setLanguage: (code: AppLanguage) => Promise<void>;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  tp: PluralFn;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>('en');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadPreferredLanguage().then((code) => {
      setLanguageState(code);
      setLoading(false);
    });
  }, []);

  const setLanguage = async (code: AppLanguage) => {
    setLanguageState(code);
    await savePreferredLanguage(code);
  };

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => translate(language, key, vars),
    [language]
  );

  const tp = useCallback(
    (count: number, oneKey: TranslationKey, otherKey: TranslationKey, vars?: Record<string, string | number>) =>
      translatePlural(language, count, oneKey, otherKey, vars),
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      languageLabel: getLanguageLabel(language),
      loading,
      setLanguage,
      t,
      tp,
    }),
    [language, loading, t, tp]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

export function useTranslation() {
  const { language, t, tp, setLanguage, languageLabel, loading } = useLanguage();
  return { language, t, tp, setLanguage, languageLabel, loading };
}
