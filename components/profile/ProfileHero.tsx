import type { User } from '@supabase/supabase-js';
import { Pressable, StyleSheet, View } from 'react-native';
import { PlatformIcon } from '@/components/navigation/PlatformIcon';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { Badge, Text } from '@/components/ui';
import { useTranslation } from '@/contexts/LanguageContext';
import type { AccountMode } from '@/lib/account-status';
import { translateAccountMode } from '@/lib/i18n';
import {
  IDENTITY_STATUS_LABEL_KEYS,
  type IdentityStatus,
} from '@/lib/identity-verification';
import {
  getProfileContactLine,
  getProfileDisplayName,
  maskAccountNumber,
} from '@/lib/profile-display';
import { isProfileReadyForTransfers } from '@/lib/profile-setup';
import type { Profile } from '@/lib/types';
import { spacing, useThemeTokens } from '@/theme';

interface Props {
  profile: Profile | null | undefined;
  user: User | null | undefined;
  accountMode: AccountMode;
  canSave: boolean;
  identityStatus: IdentityStatus;
  onPress: () => void;
  onChangePhoto?: () => void;
  photoLoading?: boolean;
}

export function ProfileHero({
  profile,
  user,
  accountMode,
  canSave,
  identityStatus,
  onPress,
  onChangePhoto,
  photoLoading,
}: Props) {
  const { t, language } = useTranslation();
  const { colors } = useThemeTokens();

  const displayName = getProfileDisplayName(profile, user);
  const contact = getProfileContactLine(profile, user);
  const profileReady = isProfileReadyForTransfers(profile);
  const maskedBank =
    profile?.bank_name && profile.account_number
      ? `${profile.bank_name} · ${maskAccountNumber(profile.account_number)}`
      : null;

  const identityVariant =
    identityStatus === 'verified' ? 'success' : identityStatus === 'in_review' ? 'warning' : 'neutral';

  return (
    <Pressable
      onPress={canSave ? onPress : undefined}
      style={({ pressed }) => [styles.wrap, { opacity: pressed && canSave ? 0.92 : 1 }]}>
      <ProfileAvatar
        profile={profile}
        user={user}
        size={72}
        editable={canSave}
        loading={photoLoading}
        onPress={canSave ? onChangePhoto : undefined}
      />

      <Text variant="headingMedium" style={styles.name} numberOfLines={2}>
        {displayName}
      </Text>

      {contact ? (
        <Text variant="bodySmall" color="secondary" numberOfLines={1}>
          {contact}
        </Text>
      ) : null}

      {maskedBank ? (
        <Text variant="caption" color="secondary" style={styles.bank} numberOfLines={1}>
          {maskedBank}
        </Text>
      ) : null}

      <View style={styles.badges}>
        <Badge label={translateAccountMode(language, accountMode)} variant={canSave ? 'info' : 'error'} />
        {identityStatus !== 'not_started' ? (
          <Badge label={t(IDENTITY_STATUS_LABEL_KEYS[identityStatus])} variant={identityVariant} />
        ) : null}
        {canSave && !profileReady ? (
          <Badge label={t('profileSetup.bannerTitle')} variant="warning" />
        ) : null}
      </View>

      {canSave ? (
        <View style={styles.chevronRow}>
          <Text variant="caption" color="secondary">
            {t('profile.manageAccount')}
          </Text>
          <PlatformIcon
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            color={colors.textSecondary}
            size={12}
          />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  name: {
    marginTop: spacing.md,
    textAlign: 'center',
  },
  bank: { marginTop: 4 },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  chevronRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
  },
});
