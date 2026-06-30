import type { Router } from 'expo-router';
import { Alert } from 'react-native';
import type { TranslationKey } from '@/lib/i18n/keys';
import type { Profile } from '@/lib/types';

type TranslateFn = (key: TranslationKey, vars?: Record<string, string | number>) => string;

export function isIdentityVerified(profile: Profile | null | undefined): boolean {
  return profile?.identity_status === 'verified';
}

/** Blocks create/join until phone, email OTP, and NIN verification are complete. */
export function promptIdentityRequired(
  profile: Profile | null | undefined,
  router: Router,
  t: TranslateFn
): boolean {
  if (isIdentityVerified(profile)) return true;

  Alert.alert(t('identityGate.title'), t('identityGate.body'), [
    { text: t('common.cancel'), style: 'cancel' },
    {
      text: t('identityGate.verifyNow'),
      onPress: () => router.push('/profile/identity'),
    },
  ]);
  return false;
}
