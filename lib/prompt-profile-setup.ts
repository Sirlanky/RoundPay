import type { Router } from 'expo-router';
import { Alert } from 'react-native';
import type { TranslationKey } from '@/lib/i18n/keys';
import {
  getMissingProfileSetupItems,
  type ProfileSetupItem,
} from '@/lib/profile-setup';
import type { Profile } from '@/lib/types';

type TranslateFn = (key: TranslationKey, vars?: Record<string, string | number>) => string;

const MISSING_KEYS: Record<ProfileSetupItem, TranslationKey> = {
  name: 'profileSetup.missingName',
  phone: 'profileSetup.missingPhone',
  bank: 'profileSetup.missingBank',
};

/** Returns true when the user may continue to a transfer/payment flow. */
export function promptProfileSetupForTransfer(
  profile: Profile | null | undefined,
  router: Router,
  t: TranslateFn
): boolean {
  const missing = getMissingProfileSetupItems(profile);
  if (missing.length === 0) return true;

  const lines = missing.map((item) => `• ${t(MISSING_KEYS[item])}`);

  const buttons: {
    text: string;
    style?: 'cancel' | 'destructive' | 'default';
    onPress?: () => void;
  }[] = [];

  if (missing.includes('name') || missing.includes('phone')) {
    buttons.push({
      text: t('profileSetup.editProfile'),
      onPress: () =>
        router.push({
          pathname: '/(tabs)/profile',
          params: { openEdit: '1' },
        }),
    });
  }

  if (missing.includes('bank')) {
    buttons.push({
      text: t('profileSetup.addBank'),
      onPress: () => router.push('/profile/bank'),
    });
  }

  buttons.push({ text: t('common.cancel'), style: 'cancel' });

  Alert.alert(t('profileSetup.title'), `${t('profileSetup.body')}\n\n${lines.join('\n')}`, buttons);
  return false;
}
