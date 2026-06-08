import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { PlatformIcon } from '@/components/navigation/PlatformIcon';
import { Text } from '@/components/ui';
import { useTranslation } from '@/contexts/LanguageContext';
import { getProfileDisplayName } from '@/lib/profile-display';
import type { Profile } from '@/lib/types';
import type { User } from '@supabase/supabase-js';
import { primaryAlpha, spacing, useThemeTokens } from '@/theme';

interface Props {
  profile: Profile | null | undefined;
  user: User | null | undefined;
  variant?: 'dashboard' | 'welcome';
}

export function HomeHeader({ profile, user, variant = 'dashboard' }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, scheme, radius, shadow } = useThemeTokens();

  const firstName =
    profile?.first_name?.trim() ||
    profile?.full_name?.trim().split(/\s+/)[0] ||
    undefined;
  const displayName = getProfileDisplayName(profile, user);
  const greeting = firstName ? t('home.welcomeBackName', { name: firstName }) : t('home.welcomeBack');
  const isWelcome = variant === 'welcome';

  const goToProfile = () => router.push('/(tabs)/profile');

  return (
    <Pressable
      onPress={goToProfile}
      accessibilityRole="button"
      accessibilityLabel={t('common.goToProfile')}
      style={({ pressed }) => [
        styles.wrap,
        isWelcome && styles.welcomeWrap,
        isWelcome && {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.lg,
          borderWidth: StyleSheet.hairlineWidth,
        },
        isWelcome && shadow('small'),
        { opacity: pressed ? 0.94 : 1 },
      ]}>
      <ProfileAvatar profile={profile} user={user} size={isWelcome ? 52 : 48} />
      <View style={styles.body}>
        <Text variant="bodySmall" color="secondary">
          {greeting}
        </Text>
        <Text variant="headingMedium" numberOfLines={1} style={styles.name}>
          {displayName}
        </Text>
        {!isWelcome ? (
          <View style={[styles.brandPill, { backgroundColor: primaryAlpha(scheme, 12) }]}>
            <Text variant="caption" color="accent" style={styles.brandPillText}>
              RoundPay
            </Text>
          </View>
        ) : null}
      </View>
      <View style={[styles.chevronWrap, { backgroundColor: colors.surfaceSecondary }]}>
        <PlatformIcon
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          size={16}
          color={colors.textSecondary}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  welcomeWrap: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  body: { flex: 1, minWidth: 0, gap: 2 },
  name: { marginTop: 0 },
  brandPill: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 999,
  },
  brandPillText: { fontWeight: '700' },
  chevronWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
