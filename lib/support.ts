import type { TranslationKey } from '@/lib/i18n/keys';

/** Placeholder support contact — replace with your real inbox before launch. */
export const SUPPORT_EMAIL = 'support@roundpay.app';

export const HELP_FAQ_KEYS: { question: TranslationKey; answer: TranslationKey }[] = [
  { question: 'help.faq1q', answer: 'help.faq1a' },
  { question: 'help.faq2q', answer: 'help.faq2a' },
  { question: 'help.faq3q', answer: 'help.faq3a' },
  { question: 'help.faq4q', answer: 'help.faq4a' },
  { question: 'help.faq5q', answer: 'help.faq5a' },
] as const;
