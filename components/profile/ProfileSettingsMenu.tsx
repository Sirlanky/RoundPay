import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ProfileSection } from '@/components/profile/ProfileSection';
import { ProfileSettingsRow } from '@/components/profile/ProfileSettingsRow';
import { APP_VERSION, type ProfileScreenState } from '@/hooks/useProfileScreen';
import { spacing, useThemeTokens } from '@/theme';

type Props = Pick<
  ProfileScreenState,
  | 't'
  | 'router'
  | 'canSave'
  | 'profile'
  | 'accountMode'
  | 'requireSave'
  | 'openEdit'
  | 'bankSubtitle'
  | 'identityLabel'
  | 'pushLabel'
  | 'reminderSettingsLabel'
  | 'reminderTimeLabel'
  | 'appLockOn'
  | 'transactionPinOn'
  | 'accountPasswordSet'
  | 'selectedLanguageLabel'
  | 'selectedThemeLabel'
  | 'handlePushNotifications'
  | 'setReminderSettingsOpen'
  | 'setReminderTimeOpen'
  | 'setAppLockOpen'
  | 'setTransactionPinOpen'
  | 'setAccountPasswordOpen'
  | 'setActiveDevicesOpen'
  | 'setLanguageOpen'
  | 'setThemeOpen'
  | 'handleSignOut'
> & {
  showLogout?: boolean;
};

export function ProfileSettingsMenu({
  t,
  router,
  canSave,
  profile,
  accountMode,
  requireSave,
  openEdit,
  bankSubtitle,
  identityLabel,
  pushLabel,
  reminderSettingsLabel,
  reminderTimeLabel,
  appLockOn,
  transactionPinOn,
  accountPasswordSet,
  selectedLanguageLabel,
  selectedThemeLabel,
  handlePushNotifications,
  setReminderSettingsOpen,
  setReminderTimeOpen,
  setAppLockOpen,
  setTransactionPinOpen,
  setAccountPasswordOpen,
  setActiveDevicesOpen,
  setLanguageOpen,
  setThemeOpen,
  handleSignOut,
  showLogout = true,
}: Props) {
  const { colors } = useThemeTokens();

  return (
    <View style={styles.wrap}>
      <ProfileSection title={t('profile.section.account')}>
        <ProfileSettingsRow
          compact
          icon={{ ios: 'person.fill', android: 'person', web: 'person' }}
          label={t('profile.personalInfo')}
          onPress={() => requireSave('edit your profile', openEdit)}
        />
        <ProfileSettingsRow
          compact
          icon={{ ios: 'building.columns.fill', android: 'account_balance', web: 'account_balance' }}
          label={t('profile.bank')}
          value={bankSubtitle}
          onPress={() => requireSave('add a bank account', () => router.push('/profile/bank'))}
        />
        <ProfileSettingsRow
          compact
          icon={{ ios: 'checkmark.shield.fill', android: 'verified_user', web: 'verified_user' }}
          label={t('profile.identity')}
          value={identityLabel}
          onPress={() => requireSave('verify your identity', () => router.push('/profile/identity'))}
          isLast
        />
      </ProfileSection>

      <ProfileSection title={t('profile.section.savings')}>
        <ProfileSettingsRow
          compact
          icon={{ ios: 'banknote.fill', android: 'payments', web: 'payments' }}
          label={t('profile.contributionHistory')}
          onPress={() => router.push('/(tabs)/contributions')}
        />
        <ProfileSettingsRow
          compact
          icon={{ ios: 'arrow.down.circle.fill', android: 'south', web: 'south' }}
          label={t('profile.payoutHistory')}
          onPress={() => router.push('/profile/payouts')}
          isLast
        />
      </ProfileSection>

      <ProfileSection title={t('profile.section.notifications')}>
        <ProfileSettingsRow
          compact
          icon={{ ios: 'bell.fill', android: 'notifications', web: 'notifications' }}
          label={t('profile.groupAlerts')}
          onPress={() => router.push('/(tabs)/notifications')}
        />
        <ProfileSettingsRow
          compact
          icon={{ ios: 'iphone.radiowaves.left.and.right', android: 'settings', web: 'settings' }}
          label={t('profile.pushNotifications')}
          value={pushLabel}
          onPress={handlePushNotifications}
        />
        <ProfileSettingsRow
          compact
          icon={{ ios: 'clock.fill', android: 'schedule', web: 'schedule' }}
          label={t('profile.reminderSettings')}
          value={reminderSettingsLabel}
          onPress={() => requireSave('change reminder settings', () => setReminderSettingsOpen(true))}
          isLast
        />
      </ProfileSection>

      <ProfileSection title={t('profile.section.security')}>
        <ProfileSettingsRow
          compact
          icon={{ ios: 'faceid', android: 'fingerprint', web: 'fingerprint' }}
          label={t('profile.appLock')}
          value={appLockOn ? t('security.appLock.on') : t('security.appLock.off')}
          onPress={() => requireSave('manage app lock', () => setAppLockOpen(true))}
        />
        <ProfileSettingsRow
          compact
          icon={{ ios: 'lock.fill', android: 'lock', web: 'lock' }}
          label={t('profile.transactionPin')}
          value={transactionPinOn ? t('security.pin.on') : t('security.pin.off')}
          onPress={() => requireSave('set a transaction PIN', () => setTransactionPinOpen(true))}
        />
        <ProfileSettingsRow
          compact
          icon={{ ios: 'key.fill', android: 'vpn_key', web: 'vpn_key' }}
          label={t('profile.changePassword')}
          value={
            accountMode === 'guest'
              ? t('security.signIn.guestTitle')
              : accountPasswordSet
                ? t('profile.accountPasswordSet')
                : t('profile.accountPasswordNotSet')
          }
          onPress={() => requireSave('set an account password', () => setAccountPasswordOpen(true))}
        />
        <ProfileSettingsRow
          compact
          icon={{ ios: 'desktopcomputer', android: 'devices', web: 'devices' }}
          label={t('profile.activeDevices')}
          onPress={() => requireSave('manage active devices', () => setActiveDevicesOpen(true))}
          isLast
        />
      </ProfileSection>

      <ProfileSection title={t('profile.section.preferences')}>
        <ProfileSettingsRow
          compact
          icon={{ ios: 'globe', android: 'language', web: 'language' }}
          label={t('profile.language')}
          value={selectedLanguageLabel}
          onPress={() => setLanguageOpen(true)}
        />
        <ProfileSettingsRow
          compact
          icon={{ ios: 'moon.fill', android: 'dark_mode', web: 'dark_mode' }}
          label={t('profile.theme')}
          value={selectedThemeLabel}
          onPress={() => setThemeOpen(true)}
        />
        <ProfileSettingsRow
          compact
          icon={{ ios: 'alarm.fill', android: 'alarm', web: 'alarm' }}
          label={t('profile.reminderTime')}
          value={reminderTimeLabel}
          onPress={() => requireSave('change reminder time', () => setReminderTimeOpen(true))}
        />
        <ProfileSettingsRow
          compact
          icon={{ ios: 'nairasign.circle.fill', android: 'currency_exchange', web: 'currency_exchange' }}
          label={t('profile.currency')}
          value={t('profile.currencyValue')}
          isLast
        />
      </ProfileSection>

      <ProfileSection title={t('profile.section.support')}>
        <ProfileSettingsRow
          compact
          icon={{ ios: 'questionmark.circle.fill', android: 'help', web: 'help' }}
          label={t('profile.helpCenter')}
          onPress={() => router.push('/profile/help')}
        />
        <ProfileSettingsRow
          compact
          icon={{ ios: 'bubble.left.fill', android: 'chat', web: 'chat' }}
          label={t('profile.contactSupport')}
          onPress={() => router.push('/profile/support')}
        />
        <ProfileSettingsRow
          compact
          icon={{ ios: 'doc.text.fill', android: 'description', web: 'description' }}
          label={t('profile.termsPrivacy')}
          onPress={() => router.push('/profile/terms')}
        />
        <ProfileSettingsRow
          compact
          icon={{ ios: 'info.circle.fill', android: 'info', web: 'info' }}
          label={t('profile.about')}
          value={`v${APP_VERSION}`}
          onPress={() => router.push('/profile/about')}
          isLast
        />
      </ProfileSection>

      {showLogout && canSave && profile ? (
        <Pressable onPress={handleSignOut} style={styles.logout}>
          <Text style={[styles.logoutText, { color: colors.error }]}>{t('profile.logout')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingBottom: spacing.xl },
  logout: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginTop: spacing.sm,
  },
  logoutText: { fontSize: 16, fontWeight: '600' },
});
