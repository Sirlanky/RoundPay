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
import { GroupFrequencyPicker } from '@/components/GroupFrequencyPicker';
import { Input } from '@/components/Input';
import { useTranslation } from '@/contexts/LanguageContext';
import { frequencyLabel } from '@/lib/group-frequency';
import { poolSummary, validateCreateGroupInput } from '@/lib/group-validation';
import type { AjoGroup, GroupFrequency } from '@/lib/types';
import { spacing, useThemeTokens } from '@/theme';

export interface DraftGroupFormValues {
  name: string;
  amount: string;
  maxMembers: string;
  frequency: GroupFrequency;
}

interface Props {
  visible: boolean;
  group: AjoGroup;
  memberCount: number;
  adminParticipates: boolean;
  saving: boolean;
  error?: string;
  values: DraftGroupFormValues;
  supported?: GroupFrequency[];
  onChange: (patch: Partial<DraftGroupFormValues>) => void;
  onSave: () => void;
  onClose: () => void;
}

export function EditDraftGroupSheet({
  visible,
  group,
  memberCount,
  adminParticipates,
  saving,
  error,
  values,
  supported,
  onChange,
  onSave,
  onClose,
}: Props) {
  const { tp } = useTranslation();
  const { colors } = useThemeTokens();

  const validation = validateCreateGroupInput({
    name: values.name,
    amountRaw: values.amount,
    maxMembersRaw: values.maxMembers,
    adminFeeRaw: String(group.admin_fee_percent),
  });

  const maxMembersNum = parseInt(values.maxMembers.replace(/\D/g, ''), 10);
  const maxMembersTooLow = Number.isFinite(maxMembersNum) && maxMembersNum < memberCount;

  const summary =
    validation.ok && !maxMembersTooLow
      ? poolSummary(
          validation.data.contributionAmount,
          validation.data.maxMembers,
          values.frequency,
          group.admin_fee_percent,
          {
            adminParticipates,
            memberWord: tp(
              validation.data.maxMembers,
              'plural.memberNoun_one',
              'plural.memberNoun_other'
            ),
          }
        )
      : null;

  const canSave = validation.ok && !maxMembersTooLow && !saving;

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
            <Text style={[styles.title, { color: colors.textPrimary }]}>Edit group settings</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={[styles.close, { color: colors.textSecondary }]}>Cancel</Text>
            </Pressable>
          </View>

          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            You can change these while the group is still in draft. Once cycle 1 starts, settings are locked.
          </Text>

          {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

          <Input label="Group name" value={values.name} onChangeText={(name) => onChange({ name })} />
          <Input
            label="Contribution per member (₦)"
            value={values.amount}
            onChangeText={(amount) => onChange({ amount })}
            keyboardType="number-pad"
          />

          <Text style={[styles.label, { color: colors.textPrimary }]}>How often?</Text>
          <GroupFrequencyPicker
            value={values.frequency}
            onChange={(frequency) => onChange({ frequency })}
            supported={supported}
          />

          <Input
            label="Max members"
            value={values.maxMembers}
            onChangeText={(maxMembers) => onChange({ maxMembers })}
            keyboardType="number-pad"
          />
          {maxMembersTooLow ? (
            <Text style={[styles.error, { color: colors.error }]}>
              Max members cannot be less than current roster ({memberCount} joined).
            </Text>
          ) : null}

          {summary ? (
            <Text style={[styles.summary, { color: colors.textPrimary }]}>
              {summary} · {frequencyLabel(values.frequency).toLowerCase()} contributions
            </Text>
          ) : null}

          <Button title="Save changes" onPress={onSave} loading={saving} disabled={!canSave} />
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
  label: { fontSize: 14, fontWeight: '500', marginBottom: spacing.sm },
  error: { fontSize: 13, marginBottom: spacing.sm },
  summary: { fontSize: 14, lineHeight: 20, marginVertical: spacing.md },
});
