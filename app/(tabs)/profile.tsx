import Constants from 'expo-constants';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui';
import {
  ActiveDevicesSheet,
  AppLockSheet,
  LanguagePickerSheet,
  ProfileAccountActions,
  ProfileEditSheet,
  ProfileHeaderCard,
  ProfileHubCard,
  ProfileSection,
  ProfileSettingsRow,
  ReminderSettingsSheet,
  ReminderTimePickerSheet,
  SignInSecuritySheet,
  ThemePickerSheet,
  TransactionPinSheet,
} from '@/components/profile';
import { ProfileSetupBanner } from '@/components/ProfileSetupBanner';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { translatePushStatus } from '@/lib/i18n';
import { getLanguageDisplayLabel } from '@/lib/languages';
import type { TranslationKey } from '@/lib/i18n/keys';
import type { ThemePreference } from '@/lib/theme';
import { maskAccountNumber } from '@/lib/profile-display';
import {
  formValuesToProfileUpdate,
  isProfileDetailsColumnMissing,
  profileToFormValues,
  validateProfileForm,
  type ProfileFormValues,
} from '@/lib/profile-form';
import {
  disablePushNotifications,
  getPushPermissionStatus,
  openNotificationSettings,
  PushRegistrationError,
  registerForPushNotifications,
} from '@/lib/notifications';
import {
  isAvatarColumnMissing,
  pickAndUploadProfileAvatar,
  ProfilePhotoPermissionError,
  removeProfileAvatar,
} from '@/lib/profile-avatar';
import { isAppLockEnabled } from '@/lib/app-lock';
import {
  getIdentityStatus,
  IDENTITY_STATUS_LABEL_KEYS,
  identityStatusFromProfile,
  type IdentityStatus,
} from '@/lib/identity-verification';
import {
  formatReminderHour,
  profileToReminderPreferences,
} from '@/lib/reminder-settings';
import { isTransactionPinEnabled } from '@/lib/transaction-pin';
import { supabase } from '@/lib/supabase';
import { spacing, useThemeTokens } from '@/theme';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

export default function ProfileScreen() {
  const { profile, user, canSave, accountMode, refreshProfile, signOut } = useAuth();
  const { language, setLanguage, t } = useTranslation();
  const { preference: themePreference, backgroundPreset, setPreference: setThemePreference, setBackgroundPreset } = useTheme();
  const selectedLanguageLabel = getLanguageDisplayLabel(language);
  const selectedThemeLabel = `${t(`theme.${themePreference}` as TranslationKey)} · ${t(`theme.background.${backgroundPreset}` as TranslationKey)}`;
  const reminderPrefs = profileToReminderPreferences(profile);
  const reminderSettingsLabel = reminderPrefs.reminders_enabled ? t('reminders.on') : t('reminders.off');
  const reminderTimeLabel = formatReminderHour(reminderPrefs.reminder_hour);
  const [formValues, setFormValues] = useState<ProfileFormValues>(() =>
    profileToFormValues(profile, user?.email)
  );
  const [saving, setSaving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [reminderSettingsOpen, setReminderSettingsOpen] = useState(false);
  const [reminderTimeOpen, setReminderTimeOpen] = useState(false);
  const [appLockOpen, setAppLockOpen] = useState(false);
  const [transactionPinOpen, setTransactionPinOpen] = useState(false);
  const [signInSecurityOpen, setSignInSecurityOpen] = useState(false);
  const [activeDevicesOpen, setActiveDevicesOpen] = useState(false);
  const [appLockOn, setAppLockOn] = useState(false);
  const [transactionPinOn, setTransactionPinOn] = useState(false);
  const [identityStatus, setIdentityStatus] = useState<IdentityStatus>('not_started');
  const [photoLoading, setPhotoLoading] = useState(false);
  const [editError, setEditError] = useState<string | undefined>();
  const [refreshing, setRefreshing] = useState(false);
  const [pushStatus, setPushStatus] = useState<Awaited<ReturnType<typeof getPushPermissionStatus>>>('undetermined');
  const router = useRouter();
  const { openEdit: openEditParam } = useLocalSearchParams<{ openEdit?: string }>();
  const { colors } = useThemeTokens();

  useEffect(() => {
    setFormValues(profileToFormValues(profile, user?.email));
  }, [profile, user?.email]);

  const openEdit = () => {
    setFormValues(profileToFormValues(profile, user?.email));
    setEditError(undefined);
    setEditOpen(true);
  };

  const closeEdit = () => {
    setFormValues(profileToFormValues(profile, user?.email));
    setEditError(undefined);
    setEditOpen(false);
  };

  const refreshPushStatus = useCallback(async () => {
    const status = await getPushPermissionStatus();
    setPushStatus(status);
  }, []);

  const refreshSecurityStatus = useCallback(async () => {
    const [lock, pin] = await Promise.all([isAppLockEnabled(), isTransactionPinEnabled()]);
    setAppLockOn(lock);
    setTransactionPinOn(pin);
  }, []);

  const refreshIdentityStatus = useCallback(async () => {
    if (!user?.id) {
      setIdentityStatus('not_started');
      return;
    }
    if (profile?.identity_status) {
      setIdentityStatus(identityStatusFromProfile(profile));
      return;
    }
    setIdentityStatus(await getIdentityStatus(user.id));
  }, [profile?.identity_status, user?.id]);

  useFocusEffect(
    useCallback(() => {
      void refreshPushStatus();
      void refreshSecurityStatus();
      void refreshIdentityStatus();
    }, [refreshPushStatus, refreshSecurityStatus, refreshIdentityStatus])
  );

  useFocusEffect(
    useCallback(() => {
      if (openEditParam === '1' && canSave) {
        openEdit();
        router.setParams({ openEdit: undefined });
      }
    }, [openEditParam, canSave])
  );

  const saveProfile = async () => {
    if (!user) return;

    const validationError = validateProfileForm(formValues);
    if (validationError) {
      setEditError(validationError);
      return;
    }

    setSaving(true);
    setEditError(undefined);

    const update = formValuesToProfileUpdate(formValues);
    const newEmail = update.email;
    const authEmail = user.email?.trim() || null;
    const authEmailChanging =
      accountMode === 'email' && newEmail && newEmail.toLowerCase() !== authEmail?.toLowerCase();

    if (authEmailChanging) {
      const { error: authError } = await supabase.auth.updateUser({ email: newEmail });
      if (authError) {
        setSaving(false);
        setEditError(authError.message);
        return;
      }
    }

    const { error } = await supabase.from('profiles').update(update).eq('id', user.id);
    setSaving(false);
    if (error) {
      if (isProfileDetailsColumnMissing(error)) {
        setEditError(
          'Profile fields are not set up yet. Run supabase/migrations/017_profile_details.sql in the Supabase SQL editor, then try again.'
        );
        return;
      }
      setEditError(error.message);
      return;
    }
    await refreshProfile();
    setEditOpen(false);
    if (authEmailChanging) {
      Alert.alert(t('profile.saved'), t('profile.savedEmailConfirm'));
    } else {
      Alert.alert(t('profile.saved'), t('profile.savedBody'));
    }
  };

  const requireSave = (action: string, onOk: () => void) => {
    if (canSave) {
      onOk();
      return;
    }
    Alert.alert(t('profile.enterAppFirstTitle'), t('profile.enterAppFirst', { action }));
  };

  const handlePushNotifications = async () => {
    if (!canSave) {
      Alert.alert(
        t('profile.enterAppFirstTitle'),
        t('profile.enterAppFirst', { action: 'enable push notifications' })
      );
      return;
    }

    const permission = await getPushPermissionStatus();

    if (permission === 'unsupported') {
      Alert.alert(t('push.simulatorTitle'), t('push.simulatorBody'));
      return;
    }

    if (permission === 'denied') {
      Alert.alert(t('push.deniedTitle'), t('push.deniedBody'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('push.openSettings'), onPress: () => void openNotificationSettings() },
      ]);
      return;
    }

    const isActive =
      Boolean(profile?.expo_push_token) &&
      profile?.push_enabled !== false &&
      permission === 'granted';

    if (isActive) {
      Alert.alert(t('push.enabledTitle'), t('push.enabledBody'), [
        { text: t('common.ok'), style: 'cancel' },
        {
          text: t('push.disable'),
          style: 'destructive',
          onPress: () =>
            void disablePushNotifications().then(async () => {
              await refreshPushStatus();
              await refreshProfile();
            }),
        },
      ]);
      return;
    }

    try {
      await registerForPushNotifications({ force: true });
      await refreshPushStatus();
      await refreshProfile();
      Alert.alert(t('push.enabledAlertTitle'), t('push.enabledAlertBody'));
    } catch (e) {
      await refreshPushStatus();
      await refreshProfile();

      if (e instanceof PushRegistrationError) {
        if (e.code === 'no_project_id') {
          Alert.alert(t('push.noProjectIdTitle'), t('push.noProjectIdBody'));
          return;
        }
        if (e.code === 'permission_denied') {
          Alert.alert(t('push.deniedTitle'), t('push.deniedBody'), [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('push.openSettings'), onPress: () => void openNotificationSettings() },
          ]);
          return;
        }
        if (e.code === 'db_error') {
          Alert.alert(t('push.dbErrorTitle'), t('push.dbErrorBody'));
          return;
        }
        Alert.alert(t('push.registerFailedTitle'), e.message);
        return;
      }

      Alert.alert(t('push.registerFailedTitle'), t('push.registerFailedBody'));
    }
  };

  const runPhotoAction = async (action: 'library' | 'camera' | 'remove') => {
    if (!user) return;
    setPhotoLoading(true);
    try {
      if (action === 'remove') {
        await removeProfileAvatar(user.id);
        await refreshProfile();
        return;
      }

      const url = await pickAndUploadProfileAvatar(user.id, action);
      if (!url) return;
      await refreshProfile();
      Alert.alert(t('profile.photoUpdatedTitle'), t('profile.photoUpdatedBody'));
    } catch (e) {
      if (e instanceof ProfilePhotoPermissionError) {
        Alert.alert(t('profile.photoPermissionTitle'), t('profile.photoPermissionBody'));
        return;
      }
      if (isAvatarColumnMissing(e)) {
        Alert.alert(t('profile.photoSetupTitle'), t('profile.photoSetupBody'));
      } else {
        Alert.alert(
          t('profile.photoFailedTitle'),
          e instanceof Error ? e.message : t('profile.photoFailedBody')
        );
      }
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleChangePhoto = () => {
    if (!canSave || !user) {
      Alert.alert(t('profile.enterAppFirstTitle'), t('profile.enterAppFirst', { action: 'add a profile photo' }));
      return;
    }

    const buttons: {
      text: string;
      style?: 'cancel' | 'destructive' | 'default';
      onPress?: () => void;
    }[] = [
      { text: t('profile.photoChoose'), onPress: () => void runPhotoAction('library') },
      { text: t('profile.photoTake'), onPress: () => void runPhotoAction('camera') },
    ];

    if (profile?.avatar_url) {
      buttons.push({
        text: t('profile.photoRemove'),
        style: 'destructive',
        onPress: () => void runPhotoAction('remove'),
      });
    }

    buttons.push({ text: t('common.cancel'), style: 'cancel' });

    Alert.alert(t('profile.photoTitle'), t('profile.photoHint'), buttons);
  };

  const handleSignOut = () => {
    Alert.alert(t('profile.signOutTitle'), t('profile.signOutBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.signOut'),
        style: 'destructive',
        onPress: () => void signOut().then(() => router.replace('/(auth)/login')),
      },
    ]);
  };

  const bankSubtitle = profile?.account_number
    ? `${profile.bank_name ?? 'Bank'} ${maskAccountNumber(profile.account_number) ?? ''}`
    : t('profile.bankRequired');

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshProfile(), refreshPushStatus()]);
    setRefreshing(false);
  };

  return (
    <Screen safeArea={false} tabBarInset contentStyle={styles.content} refreshing={refreshing} onRefresh={onRefresh}>
      <ProfileHeaderCard
        profile={profile}
        user={user}
        accountMode={accountMode}
        canSave={canSave}
        onEdit={openEdit}
        onChangePhoto={handleChangePhoto}
        photoLoading={photoLoading}
      />

      <ProfileHubCard
        onEdit={() => requireSave('edit your profile', openEdit)}
        onMessages={() => requireSave('send messages', () => router.push('/(tabs)/messages'))}
      />

      <ProfileAccountActions />

      <ProfileSetupBanner profile={profile} />

      <ProfileSection title={t('profile.section.account')}>
        <ProfileSettingsRow
          icon={{ ios: 'person.fill', android: 'person', web: 'person' }}
          label={t('profile.personalInfo')}
          subtitle={t('profile.personalInfoSubtitle')}
          onPress={() => requireSave('edit your profile', openEdit)}
        />
        <ProfileSettingsRow
          icon={{ ios: 'building.columns.fill', android: 'account_balance', web: 'account_balance' }}
          label={t('profile.bank')}
          subtitle={bankSubtitle}
          onPress={() => requireSave('add a bank account', () => router.push('/profile/bank'))}
        />
        <ProfileSettingsRow
          icon={{ ios: 'checkmark.shield.fill', android: 'verified_user', web: 'verified_user' }}
          label={t('profile.identity')}
          value={t(IDENTITY_STATUS_LABEL_KEYS[identityStatus])}
          onPress={() => requireSave('verify your identity', () => router.push('/profile/identity'))}
        />
        <ProfileSettingsRow
          icon={{ ios: 'envelope.fill', android: 'mail', web: 'mail' }}
          label={t('profile.changeContact')}
          subtitle={t('profile.changeContactSubtitle')}
          onPress={() => requireSave('update contact info', openEdit)}
          isLast
        />
      </ProfileSection>

      <ProfileSection title={t('profile.section.savings')}>
        <ProfileSettingsRow
          icon={{ ios: 'person.3.fill', android: 'group', web: 'group' }}
          label={t('profile.myGroups')}
          onPress={() => router.push('/(tabs)/groups')}
        />
        <ProfileSettingsRow
          icon={{ ios: 'banknote.fill', android: 'payments', web: 'payments' }}
          label={t('profile.contributionHistory')}
          onPress={() => router.push('/(tabs)/contributions')}
        />
        <ProfileSettingsRow
          icon={{ ios: 'arrow.down.circle.fill', android: 'south', web: 'south' }}
          label={t('profile.payoutHistory')}
          onPress={() => router.push('/profile/payouts')}
        />
        <ProfileSettingsRow
          icon={{ ios: 'ticket.fill', android: 'confirmation_number', web: 'confirmation_number' }}
          label={t('profile.inviteCodes')}
          subtitle={t('profile.inviteCodesSubtitle')}
          onPress={() => router.push('/(tabs)/groups')}
          isLast
        />
      </ProfileSection>

      <ProfileSection title={t('profile.section.notifications')}>
        <ProfileSettingsRow
          icon={{ ios: 'bell.fill', android: 'notifications', web: 'notifications' }}
          label={t('profile.groupAlerts')}
          subtitle={t('profile.groupAlertsSubtitle')}
          onPress={() => router.push('/(tabs)/notifications')}
        />
        <ProfileSettingsRow
          icon={{ ios: 'iphone.radiowaves.left.and.right', android: 'settings', web: 'settings' }}
          label={t('profile.pushNotifications')}
          value={translatePushStatus(language, pushStatus, {
            hasToken: Boolean(profile?.expo_push_token),
            pushEnabled: profile?.push_enabled,
          })}
          onPress={handlePushNotifications}
        />
        <ProfileSettingsRow
          icon={{ ios: 'clock.fill', android: 'schedule', web: 'schedule' }}
          label={t('profile.reminderSettings')}
          value={reminderSettingsLabel}
          onPress={() => requireSave('change reminder settings', () => setReminderSettingsOpen(true))}
          isLast
        />
      </ProfileSection>

      <ProfileSection title={t('profile.section.security')}>
        <ProfileSettingsRow
          icon={{ ios: 'faceid', android: 'fingerprint', web: 'fingerprint' }}
          label={t('profile.appLock')}
          value={appLockOn ? t('security.appLock.on') : t('security.appLock.off')}
          onPress={() => requireSave('manage app lock', () => setAppLockOpen(true))}
        />
        <ProfileSettingsRow
          icon={{ ios: 'lock.fill', android: 'lock', web: 'lock' }}
          label={t('profile.transactionPin')}
          value={transactionPinOn ? t('security.pin.on') : t('security.pin.off')}
          onPress={() => requireSave('set a transaction PIN', () => setTransactionPinOpen(true))}
        />
        <ProfileSettingsRow
          icon={{ ios: 'key.fill', android: 'vpn_key', web: 'vpn_key' }}
          label={t('profile.changePassword')}
          onPress={() => requireSave('manage sign-in security', () => setSignInSecurityOpen(true))}
        />
        <ProfileSettingsRow
          icon={{ ios: 'desktopcomputer', android: 'devices', web: 'devices' }}
          label={t('profile.activeDevices')}
          onPress={() => requireSave('manage active devices', () => setActiveDevicesOpen(true))}
          isLast
        />
      </ProfileSection>

      <ProfileSection title={t('profile.section.preferences')}>
        <ProfileSettingsRow
          icon={{ ios: 'nairasign.circle.fill', android: 'currency_exchange', web: 'currency_exchange' }}
          label={t('profile.currency')}
          value={t('profile.currencyValue')}
        />
        <ProfileSettingsRow
          icon={{ ios: 'globe', android: 'language', web: 'language' }}
          label={t('profile.language')}
          value={selectedLanguageLabel}
          onPress={() => setLanguageOpen(true)}
        />
        <ProfileSettingsRow
          icon={{ ios: 'moon.fill', android: 'dark_mode', web: 'dark_mode' }}
          label={t('profile.theme')}
          value={selectedThemeLabel}
          onPress={() => setThemeOpen(true)}
        />
        <ProfileSettingsRow
          icon={{ ios: 'alarm.fill', android: 'alarm', web: 'alarm' }}
          label={t('profile.reminderTime')}
          value={reminderTimeLabel}
          onPress={() => requireSave('change reminder time', () => setReminderTimeOpen(true))}
          isLast
        />
      </ProfileSection>

      <ProfileSection title={t('profile.section.support')}>
        <ProfileSettingsRow
          icon={{ ios: 'questionmark.circle.fill', android: 'help', web: 'help' }}
          label={t('profile.helpCenter')}
          onPress={() => router.push('/profile/help')}
        />
        <ProfileSettingsRow
          icon={{ ios: 'bubble.left.fill', android: 'chat', web: 'chat' }}
          label={t('profile.contactSupport')}
          onPress={() => router.push('/profile/support')}
        />
        <ProfileSettingsRow
          icon={{ ios: 'doc.text.fill', android: 'description', web: 'description' }}
          label={t('profile.termsPrivacy')}
          onPress={() => router.push('/profile/terms')}
        />
        <ProfileSettingsRow
          icon={{ ios: 'info.circle.fill', android: 'info', web: 'info' }}
          label={t('profile.about')}
          value={`v${APP_VERSION}`}
          onPress={() => router.push('/profile/about')}
          isLast
        />
      </ProfileSection>

      {canSave && profile ? (
        <View style={styles.logoutWrap}>
          <Button title={t('profile.logout')} onPress={handleSignOut} variant="secondary" />
        </View>
      ) : null}

      <Text style={[styles.footer, { color: colors.textSecondary }]}>{t('profile.footer')}</Text>

      <ProfileEditSheet
        visible={editOpen}
        values={formValues}
        saving={saving}
        error={editError}
        onChange={(patch) => setFormValues((prev) => ({ ...prev, ...patch }))}
        onSave={saveProfile}
        onClose={closeEdit}
      />

      <LanguagePickerSheet
        visible={languageOpen}
        selected={language}
        onSelect={(code) => {
          void setLanguage(code).then(() => {
            Alert.alert(t('language.changed'));
          });
        }}
        onClose={() => setLanguageOpen(false)}
      />

      <ThemePickerSheet
        visible={themeOpen}
        selected={themePreference}
        selectedBackground={backgroundPreset}
        onSelect={(pref: ThemePreference) => void setThemePreference(pref)}
        onSelectBackground={(preset) => void setBackgroundPreset(preset)}
        onClose={() => setThemeOpen(false)}
      />

      <ReminderSettingsSheet
        visible={reminderSettingsOpen}
        profile={profile}
        userId={user?.id}
        onSaved={refreshProfile}
        onClose={() => setReminderSettingsOpen(false)}
      />

      <ReminderTimePickerSheet
        visible={reminderTimeOpen}
        selectedHour={reminderPrefs.reminder_hour}
        userId={user?.id}
        onSelect={() => void refreshProfile()}
        onClose={() => setReminderTimeOpen(false)}
      />

      <AppLockSheet
        visible={appLockOpen}
        onClose={() => setAppLockOpen(false)}
        onChanged={() => void refreshSecurityStatus()}
      />

      <TransactionPinSheet
        visible={transactionPinOpen}
        onClose={() => setTransactionPinOpen(false)}
        onChanged={() => void refreshSecurityStatus()}
      />

      <SignInSecuritySheet visible={signInSecurityOpen} onClose={() => setSignInSecurityOpen(false)} />

      <ActiveDevicesSheet visible={activeDevicesOpen} onClose={() => setActiveDevicesOpen(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 8, paddingBottom: spacing.xl },
  logoutWrap: { marginTop: spacing.sm, marginBottom: spacing.md },
  footer: { fontSize: 13, textAlign: 'center', lineHeight: 18, marginBottom: spacing.lg },
});
