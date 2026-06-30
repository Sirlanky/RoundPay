import { Alert } from 'react-native';
import {
  AccountPasswordSheet,
  ActiveDevicesSheet,
  AppLockSheet,
  LanguagePickerSheet,
  ProfileEditSheet,
  ReminderSettingsSheet,
  ReminderTimePickerSheet,
  ThemePickerSheet,
  TransactionPinSheet,
} from '@/components/profile';
import type { ProfileScreenState } from '@/hooks/useProfileScreen';
import type { ThemePreference } from '@/lib/theme';

type Props = Pick<
  ProfileScreenState,
  | 'profile'
  | 'user'
  | 't'
  | 'language'
  | 'setLanguage'
  | 'formValues'
  | 'setFormValues'
  | 'saving'
  | 'editOpen'
  | 'editError'
  | 'closeEdit'
  | 'saveProfile'
  | 'languageOpen'
  | 'setLanguageOpen'
  | 'themeOpen'
  | 'setThemeOpen'
  | 'themePreference'
  | 'backgroundPreset'
  | 'setThemePreference'
  | 'setBackgroundPreset'
  | 'reminderSettingsOpen'
  | 'setReminderSettingsOpen'
  | 'reminderTimeOpen'
  | 'setReminderTimeOpen'
  | 'reminderPrefs'
  | 'appLockOpen'
  | 'setAppLockOpen'
  | 'transactionPinOpen'
  | 'setTransactionPinOpen'
  | 'accountPasswordOpen'
  | 'setAccountPasswordOpen'
  | 'activeDevicesOpen'
  | 'setActiveDevicesOpen'
  | 'refreshProfile'
  | 'refreshSecurityStatus'
>;

export function ProfileSheets(props: Props) {
  const {
    profile,
    user,
    t,
    language,
    setLanguage,
    formValues,
    setFormValues,
    saving,
    editOpen,
    editError,
    closeEdit,
    saveProfile,
    languageOpen,
    setLanguageOpen,
    themeOpen,
    setThemeOpen,
    themePreference,
    backgroundPreset,
    setThemePreference,
    setBackgroundPreset,
    reminderSettingsOpen,
    setReminderSettingsOpen,
    reminderTimeOpen,
    setReminderTimeOpen,
    reminderPrefs,
    appLockOpen,
    setAppLockOpen,
    transactionPinOpen,
    setTransactionPinOpen,
    accountPasswordOpen,
    setAccountPasswordOpen,
    activeDevicesOpen,
    setActiveDevicesOpen,
    refreshProfile,
    refreshSecurityStatus,
  } = props;

  return (
    <>
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

      <AccountPasswordSheet
        visible={accountPasswordOpen}
        onClose={() => setAccountPasswordOpen(false)}
        onChanged={() => void refreshSecurityStatus()}
      />

      <ActiveDevicesSheet visible={activeDevicesOpen} onClose={() => setActiveDevicesOpen(false)} />
    </>
  );
}
