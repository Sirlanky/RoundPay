import { useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import {
  ProfileAccountActions,
  ProfileHero,
  ProfileQuickActions,
  ProfileSettingsRow,
  ProfileSheets,
} from '@/components/profile';
import { ProfileSetupBanner } from '@/components/ProfileSetupBanner';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/ui';
import { useTranslation } from '@/contexts/LanguageContext';
import { useProfileScreen } from '@/hooks/useProfileScreen';
import { spacing, useThemeTokens } from '@/theme';

export default function ProfileScreen() {
  const state = useProfileScreen();
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useThemeTokens();

  const {
    profile,
    user,
    canSave,
    accountMode,
    identityStatus,
    photoLoading,
    refreshing,
    openEdit,
    handleChangePhoto,
    requireSave,
    onRefresh,
  } = state;

  return (
    <Screen safeArea={false} tabBarInset contentStyle={styles.content} refreshing={refreshing} onRefresh={onRefresh}>
      <ProfileHero
        profile={profile}
        user={user}
        accountMode={accountMode}
        canSave={canSave}
        identityStatus={identityStatus}
        onPress={openEdit}
        onChangePhoto={handleChangePhoto}
        photoLoading={photoLoading}
      />

      <ProfileQuickActions
        canSave={canSave}
        identityStatus={identityStatus}
        onRequireSave={requireSave}
      />

      <ProfileAccountActions />

      <ProfileSetupBanner profile={profile} />

      <Card variant="elevated" style={styles.settingsCard}>
        <ProfileSettingsRow
          compact
          icon={{ ios: 'gearshape.fill', android: 'settings', web: 'settings' }}
          label={t('profile.settingsTitle')}
          onPress={() => router.push('/profile/settings')}
          isLast
        />
      </Card>

      <Text style={[styles.footer, { color: colors.textSecondary }]}>{t('profile.footer')}</Text>

      <ProfileSheets {...state} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 8, paddingBottom: spacing.xl },
  settingsCard: { marginHorizontal: spacing.md, marginBottom: spacing.sm, paddingVertical: 4 },
  footer: { fontSize: 13, textAlign: 'center', lineHeight: 18, marginTop: spacing.md, marginBottom: spacing.lg },
});
