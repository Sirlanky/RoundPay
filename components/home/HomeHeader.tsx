import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { Text } from '@/components/ui';
import { useTranslation } from '@/contexts/LanguageContext';
import type { Profile } from '@/lib/types';
import type { User } from '@supabase/supabase-js';
import { spacing } from '@/theme';

interface Props {
  profile: Profile | null | undefined;
  user: User | null | undefined;
}

export function HomeHeader({ profile, user }: Props) {
  const { t } = useTranslation();

  const firstName =
    profile?.first_name?.trim() ||
    profile?.full_name?.trim().split(/\s+/)[0] ||
    undefined;
  const greeting = firstName ? (
    <>
      {t('home.welcomeBack')},{' '}
      <Text variant="headingSmall" style={{ fontWeight: '700' }}>
        {firstName}
      </Text>
    </>
  ) : (
    t('home.welcomeBack')
  );

  return (
    <View style={styles.wrap}>
      <ProfileAvatar profile={profile} user={user} size={48} />
      <Text variant="bodyLarge" color="secondary" numberOfLines={2} style={styles.greeting}>
        {greeting}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
    paddingVertical: spacing.xs,
  },
  greeting: {
    flex: 1,
    minWidth: 0,
    fontWeight: '500',
  },
});
