import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { PlatformIcon } from '@/components/navigation/PlatformIcon';
import { useTranslation } from '@/contexts/LanguageContext';
import { getProfileDisplayName } from '@/lib/profile-display';
import type { Profile } from '@/lib/types';
import type { User } from '@supabase/supabase-js';
import Colors, { brand } from '@/constants/Colors';
import { spacing } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

interface Props {
  profile: Profile | null | undefined;
  user: User | null | undefined;
  /** Welcome-only header for empty home (no brand title). */
  variant?: 'dashboard' | 'welcome';
}

export function HomeHeader({ profile, user, variant = 'dashboard' }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const firstName =
    profile?.first_name?.trim() ||
    profile?.full_name?.trim().split(/\s+/)[0] ||
    undefined;
  const displayName = getProfileDisplayName(profile, user);
  const greeting = firstName ? t('home.welcomeBackName', { name: firstName }) : t('home.welcomeBack');

  const goToProfile = () => router.push('/(tabs)/profile');

  return (
    <Pressable
      onPress={goToProfile}
      accessibilityRole="button"
      accessibilityLabel={t('common.goToProfile')}
      style={({ pressed }) => [
        styles.wrap,
        variant === 'welcome' ? styles.welcomeWrap : null,
        { opacity: pressed ? 0.9 : 1 },
      ]}>
      <ProfileAvatar profile={profile} user={user} size={variant === 'welcome' ? 56 : 48} />
      <View style={styles.body}>
        <Text
          style={[
            variant === 'welcome' ? styles.welcomeGreeting : styles.greeting,
            { color: variant === 'welcome' ? colors.text : colors.textSecondary },
          ]}>
          {greeting}
        </Text>
        <Text
          style={[
            variant === 'welcome' ? styles.welcomeName : styles.name,
            { color: colors.text },
          ]}
          numberOfLines={1}>
          {displayName}
        </Text>
        {variant === 'dashboard' ? (
          <Text style={[styles.brand, { color: brand.primary }]}>RoundPay</Text>
        ) : null}
      </View>
      <PlatformIcon
        name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
        size={18}
        color={colors.textSecondary}
      />
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
  welcomeWrap: { marginBottom: spacing.md },
  body: { flex: 1, minWidth: 0 },
  greeting: { fontSize: 13, fontWeight: '500' },
  welcomeGreeting: { fontSize: 14, fontWeight: '500', lineHeight: 20 },
  name: { fontSize: 20, fontWeight: '700', marginTop: 2 },
  welcomeName: { fontSize: 22, fontWeight: '800', lineHeight: 28, marginTop: 2 },
  brand: { fontSize: 13, fontWeight: '600', marginTop: 2 },
});
