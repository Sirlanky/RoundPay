import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui';
import { useTranslation } from '@/contexts/LanguageContext';
import {
  formatReminderHour,
  isReminderColumnMissing,
  REMINDER_HOUR_OPTIONS,
  saveReminderHour,
} from '@/lib/reminder-settings';
import { primaryAlpha, radius, spacing, useThemeTokens } from '@/theme';

interface Props {
  visible: boolean;
  selectedHour: number;
  userId: string | undefined;
  onSelect: (hour: number) => void;
  onClose: () => void;
}

export function ReminderTimePickerSheet({
  visible,
  selectedHour,
  userId,
  onSelect,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const { colors, scheme } = useThemeTokens();
  const [active, setActive] = useState(selectedHour);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) setActive(selectedHour);
  }, [visible, selectedHour]);

  const handleSelect = async (hour: number) => {
    if (!userId) return;

    setActive(hour);
    setSaving(true);

    try {
      await saveReminderHour(userId, hour);
      onSelect(hour);
    } catch (e) {
      setActive(selectedHour);
      if (isReminderColumnMissing(e)) {
        Alert.alert(t('reminders.setupTitle'), t('reminders.setupBody'));
      } else {
        Alert.alert(
          t('reminders.saveFailedTitle'),
          e instanceof Error ? e.message : t('reminders.saveFailedBody')
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{t('reminders.timeTitle')}</Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>{t('reminders.timeHint')}</Text>

          <View style={styles.list}>
            {REMINDER_HOUR_OPTIONS.map((hour) => {
              const isSelected = active === hour;
              const label = formatReminderHour(hour);
              return (
                <Pressable
                  key={hour}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  disabled={saving}
                  onPress={() => void handleSelect(hour)}
                  style={({ pressed }) => [
                    styles.row,
                    {
                      backgroundColor: isSelected ? primaryAlpha(scheme, 12) : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}>
                  <View
                    style={[
                      styles.indicator,
                      {
                        borderColor: isSelected ? colors.primary : colors.border,
                        backgroundColor: isSelected ? colors.primary : 'transparent',
                      },
                    ]}>
                    {isSelected ? <Text style={styles.check}>✓</Text> : null}
                  </View>
                  <Text style={[styles.label, { color: isSelected ? colors.primary : colors.textPrimary }]}>
                    {label}
                  </Text>
                  {isSelected ? (
                    <View style={[styles.selectedBadge, { backgroundColor: primaryAlpha(scheme, 24) }]}>
                      <Text style={[styles.selectedBadgeText, { color: colors.primary }]}>
                        {t('reminders.timeSelected')}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
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
    borderWidth: 1.5,
  },
  indicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', lineHeight: 15 },
  label: { flex: 1, fontSize: 16, fontWeight: '600' },
  selectedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  selectedBadgeText: { fontSize: 11, fontWeight: '700' },
  done: { marginTop: spacing.lg },
});
