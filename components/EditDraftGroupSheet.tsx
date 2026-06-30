import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '@/components/ui';
import { GroupSchedulePickers } from '@/components/group/GroupSchedulePickers';
import { Input } from '@/components/Input';
import { useTranslation } from '@/contexts/LanguageContext';
import { poolSummary, validateCreateGroupInput } from '@/lib/group-validation';
import {
  parseCustomCollectionDays,
  resolveGroupSchedule,
  scheduleFromGroup,
  scheduleSummaryLine,
  validateGroupSchedule,
  type GroupScheduleInput,
} from '@/lib/group-schedule';
import type { AjoGroup } from '@/lib/types';
import { spacing, useThemeTokens } from '@/theme';

export interface DraftGroupFormValues {
  name: string;
  amount: string;
  maxMembers: string;
  schedule: GroupScheduleInput;
  customDaysRaw: string;
}

interface Props {
  visible: boolean;
  group: AjoGroup;
  memberCount: number;
  adminParticipates: boolean;
  saving: boolean;
  error?: string;
  values: DraftGroupFormValues;
  onChange: (patch: Partial<DraftGroupFormValues>) => void;
  onSave: () => void;
  onClose: () => void;
}

export function draftFormValuesFromGroup(group: AjoGroup): DraftGroupFormValues {
  const schedule = scheduleFromGroup(group);
  return {
    name: group.name,
    amount: String(group.contribution_amount),
    maxMembers: String(group.max_members),
    schedule,
    customDaysRaw:
      schedule.collectionFrequency === 'custom'
        ? String(schedule.customCollectionDays ?? 5)
        : '5',
  };
}

export function EditDraftGroupSheet({
  visible,
  group,
  memberCount,
  adminParticipates,
  saving,
  error,
  values,
  onChange,
  onSave,
  onClose,
}: Props) {
  const { tp, t } = useTranslation();
  const { colors } = useThemeTokens();

  const scheduleInput =
    values.schedule.collectionFrequency === 'custom'
      ? {
          ...values.schedule,
          customCollectionDays:
            parseCustomCollectionDays(values.customDaysRaw) ??
            values.schedule.customCollectionDays ??
            5,
        }
      : values.schedule;

  const validation = validateCreateGroupInput({
    name: values.name,
    amountRaw: values.amount,
    maxMembersRaw: values.maxMembers,
    adminFeeRaw: String(group.admin_fee_percent),
  });

  const scheduleValidation = validateGroupSchedule(scheduleInput);
  const resolved = scheduleValidation.ok ? resolveGroupSchedule(scheduleInput) : null;

  const maxMembersNum = parseInt(values.maxMembers.replace(/\D/g, ''), 10);
  const maxMembersTooLow = Number.isFinite(maxMembersNum) && maxMembersNum < memberCount;

  const summary =
    validation.ok && scheduleValidation.ok && resolved && !maxMembersTooLow
      ? poolSummary(
          validation.data.contributionAmount,
          validation.data.maxMembers,
          resolved.frequency,
          group.admin_fee_percent,
          {
            adminParticipates,
            payInsPerCycle: resolved.payInsPerCycle,
            payInFrequency: resolved.frequency,
            memberWord: tp(
              validation.data.maxMembers,
              'plural.memberNoun_one',
              'plural.memberNoun_other'
            ),
          }
        )
      : null;

  const canSave = validation.ok && scheduleValidation.ok && !maxMembersTooLow && !saving;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.flex, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{t('create.editDraftTitle')}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={[styles.close, { color: colors.textSecondary }]}>{t('common.cancel')}</Text>
            </Pressable>
          </View>

          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            {t('group.editDraftLockedHint')}
          </Text>

          {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

          <Input label={t('create.groupNameLabel')} value={values.name} onChangeText={(name) => onChange({ name })} />
          <Input
            label={t('create.payInPerMember')}
            value={values.amount}
            onChangeText={(amount) => onChange({ amount })}
            keyboardType="number-pad"
          />

          <GroupSchedulePickers
            value={scheduleInput}
            customDaysRaw={values.customDaysRaw}
            onChange={(patch) =>
              onChange({ schedule: { ...values.schedule, ...patch } })
            }
            onCustomDaysChange={(customDaysRaw) => {
              const days = parseCustomCollectionDays(customDaysRaw);
              onChange({
                customDaysRaw,
                schedule: {
                  ...values.schedule,
                  customCollectionDays: days ?? values.schedule.customCollectionDays,
                },
              });
            }}
          />

          {scheduleValidation.ok ? (
            <Text style={[styles.scheduleLine, { color: colors.textSecondary }]}>
              {scheduleSummaryLine(scheduleInput, t)}
            </Text>
          ) : null}

          <Input
            label={t('create.maxMembersLabel')}
            value={values.maxMembers}
            onChangeText={(maxMembers) => onChange({ maxMembers })}
            keyboardType="number-pad"
          />
          {maxMembersTooLow ? (
            <Text style={[styles.error, { color: colors.error }]}>
              {t('create.maxMembersTooLow', { count: memberCount })}
            </Text>
          ) : null}

          {summary ? (
            <Text style={[styles.summary, { color: colors.textPrimary }]}>{summary}</Text>
          ) : null}

          <Button title={t('create.saveDraftChanges')} onPress={onSave} loading={saving} disabled={!canSave} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  title: { fontSize: 20, fontWeight: '700' },
  close: { fontSize: 16 },
  hint: { fontSize: 14, lineHeight: 20, marginBottom: spacing.md },
  scheduleLine: { fontSize: 13, lineHeight: 18, marginBottom: spacing.md },
  error: { fontSize: 13, marginBottom: spacing.sm },
  summary: { fontSize: 14, lineHeight: 20, marginVertical: spacing.md },
});
