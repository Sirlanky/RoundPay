import { StyleSheet, View } from 'react-native';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { Badge, Button, Card, Text } from '@/components/ui';
import { useTranslation } from '@/contexts/LanguageContext';
import type { AccountMode } from '@/lib/account-status';
import { translateAccountMode } from '@/lib/i18n';
import {
  getProfileContactLine,
  getProfileDisplayName,
  getProfileMetaLine,
  maskAccountNumber,
} from '@/lib/profile-display';
import { isProfileReadyForTransfers } from '@/lib/profile-setup';
import type { Profile } from '@/lib/types';
import type { User } from '@supabase/supabase-js';
import { spacing, useThemeTokens } from '@/theme';

interface Props {
  profile: Profile | null | undefined;
  user: User | null | undefined;
  accountMode: AccountMode;
  canSave: boolean;
  onEdit: () => void;
  onChangePhoto?: () => void;
  photoLoading?: boolean;
}

export function ProfileHeaderCard({
  profile,
  user,
  accountMode,
  canSave,
  onEdit,
  onChangePhoto,
  photoLoading,
}: Props) {
  const { t, language } = useTranslation();
  const { colors } = useThemeTokens();

  const displayName = getProfileDisplayName(profile, user);
  const contact = getProfileContactLine(profile, user);
  const metaLine = getProfileMetaLine(profile);
  const hasPayoutAccount = Boolean(profile?.account_number);
  const profileReady = isProfileReadyForTransfers(profile);
  const maskedBank =
    profile?.bank_name && profile.account_number
      ? `${profile.bank_name} ${maskAccountNumber(profile.account_number)}`
      : null;
  const showEmail =
    profile?.email && profile.phone && profile.email !== contact;

  return (
    <Card variant="elevated" style={styles.card}>
      <View style={styles.top}>
        <ProfileAvatar
          profile={profile}
          user={user}
          editable={canSave}
          loading={photoLoading}
          onPress={canSave ? onChangePhoto : undefined}
        />
        <View style={styles.info}>
          <Text variant="headingMedium" numberOfLines={2}>
            {displayName}
          </Text>
          {contact ? (
            <Text variant="bodySmall" color="secondary" numberOfLines={1} style={styles.contact}>
              {contact}
            </Text>
          ) : null}
          {metaLine ? (
            <Text variant="bodySmall" color="secondary" numberOfLines={1} style={styles.contact}>
              {metaLine}
            </Text>
          ) : null}
          {showEmail ? (
            <Text variant="bodySmall" color="secondary" numberOfLines={1} style={styles.contact}>
              {profile!.email}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.badges}>
        <Badge
          label={translateAccountMode(language, accountMode)}
          variant={canSave ? 'info' : 'error'}
        />
        {hasPayoutAccount ? <Badge label={t('profile.payoutLinked')} variant="success" /> : null}
        {canSave && !profileReady ? (
          <Badge label={t('profileSetup.bannerTitle')} variant="warning" />
        ) : null}
      </View>

      {maskedBank ? (
        <Text variant="caption" color="secondary" style={styles.bankLine}>
          {maskedBank}
        </Text>
      ) : null}

      {canSave ? (
        <Button title={t('profile.editProfile')} onPress={onEdit} variant="secondary" style={styles.editBtn} />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { paddingVertical: spacing.lg },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  info: { flex: 1 },
  contact: { marginTop: 4 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  bankLine: { marginTop: spacing.sm },
  editBtn: { marginTop: spacing.md, marginBottom: 0 },
});
