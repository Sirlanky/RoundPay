import { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import Colors, { brand } from '@/constants/Colors';
import { useTranslation } from '@/contexts/LanguageContext';
import {
  isReminderColumnMissing,
  profileToReminderPreferences,
  saveReminderPreferences,
  type ReminderPreferences,
} from '@/lib/reminder-settings';
import type { Profile } from '@/lib/types';
import { radius, spacing } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

interface Props {
  visible: boolean;
  profile: Profile | null;
  userId: string | undefined;
  onSaved: () => Promise<void>;
  onClose: () => void;
}

type ToggleKey = keyof Pick<
  ReminderPreferences,
  'reminders_enabled' | 'reminder_contributions' | 'reminder_overdue' | 'reminder_payouts'
>;

const TOGGLES: { key: ToggleKey; labelKey: 'reminders.master' | 'reminders.contributions' | 'reminders.overdue' | 'reminders.payouts'; hintKey: 'reminders.masterHint' | 'reminders.contributionsHint' | 'reminders.overdueHint' | 'reminders.payoutsHint' }[] = [
  { key: 'reminders_enabled', labelKey: 'reminders.master', hintKey: 'reminders.masterHint' },
  { key: 'reminder_contributions', labelKey: 'reminders.contributions', hintKey: 'reminders.contributionsHint' },
  { key: 'reminder_overdue', labelKey: 'reminders.overdue', hintKey: 'reminders.overdueHint' },
  { key: 'reminder_payouts', labelKey: 'reminders.payouts', hintKey: 'reminders.payoutsHint' },
];

export function ReminderSettingsSheet({ visible, profile, userId, onSaved, onClose }: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [prefs, setPrefs] = useState(() => profileToReminderPreferences(profile));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) setPrefs(profileToReminderPreferences(profile));
  }, [visible, profile]);

  const updateToggle = async (key: ToggleKey, value: boolean) => {
    if (!userId) return;

    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setSaving(true);

    try {
      await saveReminderPreferences(userId, { [key]: value });
      await onSaved();
    } catch (e) {
      setPrefs(profileToReminderPreferences(profile));
      if (isReminderColumnMissing(e)) {
        Alert.alert(t('reminders.setupTitle'), t('reminders.setupBody'));
      } else {
        Alert.alert(t('reminders.saveFailedTitle'), e instanceof Error ? e.message : t('reminders.saveFailedBody'));
      }
    } finally {
      setSaving(false);
    }
  };

  const masterOff = !prefs.reminders_enabled;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={[styles.title, { color: colors.text }]}>{t('reminders.title')}</Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>{t('reminders.hint')}</Text>

          <View style={styles.list}>
            {TOGGLES.map((item) => {
              const disabled = saving || (item.key !== 'reminders_enabled' && masterOff);
              return (
                <View
                  key={item.key}
                  style={[
                    styles.row,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      opacity: disabled && item.key !== 'reminders_enabled' ? 0.55 : 1,
                    },
                  ]}>
                  <View style={styles.rowBody}>
                    <Text style={[styles.label, { color: colors.text }]}>{t(item.labelKey)}</Text>
                    <Text style={[styles.rowHint, { color: colors.textSecondary }]}>{t(item.hintKey)}</Text>
                  </View>
                  <Switch
                    value={prefs[item.key]}
                    onValueChange={(value) => void updateToggle(item.key, value)}
                    disabled={disabled}
                    trackColor={{ false: colors.border, true: brand.primary + '88' }}
                    thumbColor={prefs[item.key] ? brand.primary : '#f4f4f5'}
                  />
                </View>
              );
            })}
          </View>

          <Button title={t('common.done')} onPress={onClose} style={styles.done} disabled={saving} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xl },
  title: { fontSize: 22, fontWeight: '700', marginBottom: spacing.xs },
  hint: { fontSize: 14, lineHeight: 20, marginBottom: spacing.lg },
  list: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  rowBody: { flex: 1 },
  label: { fontSize: 16, fontWeight: '600' },
  rowHint: { fontSize: 13, lineHeight: 18, marginTop: 4 },
  done: { marginTop: spacing.lg },
});
