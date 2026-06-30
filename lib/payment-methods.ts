import type { TranslationKey } from '@/lib/i18n/keys';

export type PaymentMethod = 'paystack' | 'cash' | 'bank_transfer' | 'pos' | 'other';

export const MANUAL_PAYMENT_METHODS: PaymentMethod[] = ['cash', 'bank_transfer', 'pos', 'other'];

export const PAYMENT_METHOD_LABEL_KEYS: Record<PaymentMethod, TranslationKey> = {
  paystack: 'payment.methodPaystack',
  cash: 'payment.methodCash',
  bank_transfer: 'payment.methodTransfer',
  pos: 'payment.methodPos',
  other: 'payment.methodOther',
};

export function paymentMethodLabel(method: PaymentMethod | null | undefined, t: TranslateFn): string {
  if (!method) return t('payment.methodUnknown');
  return t(PAYMENT_METHOD_LABEL_KEYS[method] ?? 'payment.methodOther');
}

type TranslateFn = (key: TranslationKey, vars?: Record<string, string | number>) => string;
