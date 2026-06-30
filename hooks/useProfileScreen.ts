import Constants from 'expo-constants';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { hasAccountPasswordSet } from '@/lib/account-password-preference';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getLanguageDisplayLabel } from '@/lib/languages';
import type { TranslationKey } from '@/lib/i18n/keys';
import { translatePushStatus } from '@/lib/i18n';
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
  isAvatarStorageRlsError,
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

export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

export function useProfileScreen() {
  const { profile, user, canSave, accountMode, refreshProfile, signOut } = useAuth();
  const { language, setLanguage, t } = useTranslation();
  const { preference: themePreference, backgroundPreset, setPreference: setThemePreference, setBackgroundPreset } =
    useTheme();
  const router = useRouter();
  const { openEdit: openEditParam } = useLocalSearchParams<{ openEdit?: string }>();

  const selectedLanguageLabel = getLanguageDisplayLabel(language);
  const selectedThemeLabel = `${t(`theme.${themePreference}` as TranslationKey)} · ${t(`theme.background.${backgroundPreset}` as TranslationKey)}`;
  const reminderPrefs = profileToReminderPreferences(profile);
  const reminderSettingsLabel = reminderPrefs.reminders_enabled ? t('reminders.on') : t('reminders.off');
  const reminderTimeLabel = formatReminderHour(reminderPrefs.reminder_hour);

  const [formValues, setFormValues] = useState<ProfileFormValues>(() => profileToFormValues(profile, user?.email));
  const [saving, setSaving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [reminderSettingsOpen, setReminderSettingsOpen] = useState(false);
  const [reminderTimeOpen, setReminderTimeOpen] = useState(false);
  const [appLockOpen, setAppLockOpen] = useState(false);
  const [transactionPinOpen, setTransactionPinOpen] = useState(false);
  const [accountPasswordOpen, setAccountPasswordOpen] = useState(false);
  const [accountPasswordSet, setAccountPasswordSet] = useState(false);
  const [activeDevicesOpen, setActiveDevicesOpen] = useState(false);
  const [appLockOn, setAppLockOn] = useState(false);
  const [transactionPinOn, setTransactionPinOn] = useState(false);
  const [identityStatus, setIdentityStatus] = useState<IdentityStatus>('not_started');
  const [photoLoading, setPhotoLoading] = useState(false);
  const [editError, setEditError] = useState<string | undefined>();
  const [refreshing, setRefreshing] = useState(false);
  const [pushStatus, setPushStatus] = useState<Awaited<ReturnType<typeof getPushPermissionStatus>>>('undetermined');

  useEffect(() => {
    setFormValues(profileToFormValues(profile, user?.email));
  }, [profile, user?.email]);

  const openEdit = useCallback(() => {
    setFormValues(profileToFormValues(profile, user?.email));
    setEditError(undefined);
    setEditOpen(true);
  }, [profile, user?.email]);

  const closeEdit = useCallback(() => {
    setFormValues(profileToFormValues(profile, user?.email));
    setEditError(undefined);
    setEditOpen(false);
  }, [profile, user?.email]);

  const refreshPushStatus = useCallback(async () => {
    setPushStatus(await getPushPermissionStatus());
  }, []);

  const refreshSecurityStatus = useCallback(async () => {
    const [lock, pin, passwordSet] = await Promise.all([
      isAppLockEnabled(),
      isTransactionPinEnabled(),
      hasAccountPasswordSet(user?.id),
    ]);
    setAppLockOn(lock);
    setTransactionPinOn(pin);
    setAccountPasswordSet(passwordSet);
  }, [user?.id]);

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
    }, [openEditParam, canSave, openEdit, router])
  );

  const requireSave = useCallback(
    (action: string, onOk: () => void) => {
      if (canSave) {
        onOk();
        return;
      }
      Alert.alert(t('profile.enterAppFirstTitle'), t('profile.enterAppFirst', { action }));
    },
    [canSave, t]
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
      Boolean(profile?.expo_push_token) && profile?.push_enabled !== false && permission === 'granted';

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
      } else if (isAvatarStorageRlsError(e)) {
        Alert.alert(t('profile.photoFailedTitle'), t('profile.photoRlsBody'));
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
    ? `${profile.bank_name ?? 'Bank'} · ${maskAccountNumber(profile.account_number) ?? ''}`
    : t('profile.bankRequired');

  const pushLabel = translatePushStatus(language, pushStatus, {
    hasToken: Boolean(profile?.expo_push_token),
    pushEnabled: profile?.push_enabled,
  });

  const identityLabel = t(IDENTITY_STATUS_LABEL_KEYS[identityStatus]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshProfile(), refreshPushStatus()]);
    setRefreshing(false);
  };

  return {
    profile,
    user,
    canSave,
    accountMode,
    language,
    setLanguage,
    t,
    themePreference,
    backgroundPreset,
    setThemePreference,
    setBackgroundPreset,
    router,
    formValues,
    setFormValues,
    saving,
    editOpen,
    languageOpen,
    setLanguageOpen,
    themeOpen,
    setThemeOpen,
    reminderSettingsOpen,
    setReminderSettingsOpen,
    reminderTimeOpen,
    setReminderTimeOpen,
    appLockOpen,
    setAppLockOpen,
    transactionPinOpen,
    setTransactionPinOpen,
    accountPasswordOpen,
    setAccountPasswordOpen,
    activeDevicesOpen,
    setActiveDevicesOpen,
    photoLoading,
    editError,
    refreshing,
    selectedLanguageLabel,
    selectedThemeLabel,
    reminderPrefs,
    reminderSettingsLabel,
    reminderTimeLabel,
    appLockOn,
    transactionPinOn,
    accountPasswordSet,
    identityStatus,
    identityLabel,
    bankSubtitle,
    pushLabel,
    openEdit,
    closeEdit,
    saveProfile,
    requireSave,
    handlePushNotifications,
    handleChangePhoto,
    handleSignOut,
    onRefresh,
    refreshProfile,
    refreshSecurityStatus,
  };
}

export type ProfileScreenState = ReturnType<typeof useProfileScreen>;
