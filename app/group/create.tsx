import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import { AuthActionBanner } from '@/components/AuthActionBanner';
import { Button, Card } from '@/components/ui';
import { GroupCreatedSuccess } from '@/components/GroupCreatedSuccess';
import { GroupSchedulePickers } from '@/components/group/GroupSchedulePickers';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminMode } from '@/contexts/AdminModeContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { formatNaira } from '@/lib/format';
import { messageFromGroupError } from '@/lib/group-errors';
import { poolSummary, validateCreateGroupInput } from '@/lib/group-validation';
import {
  parseCustomCollectionDays,
  resolveGroupSchedule,
  scheduleSummaryLine,
  validateGroupSchedule,
  type GroupScheduleInput,
} from '@/lib/group-schedule';
import { createGroup } from '@/lib/groups';
import { promptSaveAuth } from '@/lib/prompt-save-auth';
import { promptIdentityRequired } from '@/lib/identity-gate';
import { alertProfileDatabaseFix, isProfileDatabaseFixError } from '@/lib/profile';
import type { AjoGroup } from '@/lib/types';
import { spacing, useThemeTokens } from '@/theme';

const DEFAULT_SCHEDULE: GroupScheduleInput = {
  collectionFrequency: 'weekly',
  customCollectionDays: null,
  payoutFrequency: 'monthly',
};

export default function CreateGroupScreen() {
  const { user, profile, canSave, exitBuildMode } = useAuth();
  const { refreshAdminAccess } = useAdminMode();
  const { tp, t } = useTranslation();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [maxMembers, setMaxMembers] = useState('4');
  const [adminFee, setAdminFee] = useState('0');
  const [adminParticipates, setAdminParticipates] = useState(true);
  const [schedule, setSchedule] = useState<GroupScheduleInput>(DEFAULT_SCHEDULE);
  const [customDaysRaw, setCustomDaysRaw] = useState('5');
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<AjoGroup | null>(null);
  const [formHint, setFormHint] = useState('');
  const router = useRouter();
  const { colors } = useThemeTokens();

  const scheduleInput = useMemo((): GroupScheduleInput => {
    if (schedule.collectionFrequency !== 'custom') return schedule;
    const days = parseCustomCollectionDays(customDaysRaw);
    return { ...schedule, customCollectionDays: days ?? schedule.customCollectionDays ?? 5 };
  }, [schedule, customDaysRaw]);

  const validation = useMemo(
    () =>
      validateCreateGroupInput({
        name,
        amountRaw: amount,
        maxMembersRaw: maxMembers,
        adminFeeRaw: adminFee,
      }),
    [name, amount, maxMembers, adminFee]
  );

  const scheduleValidation = useMemo(() => validateGroupSchedule(scheduleInput), [scheduleInput]);

  const resolvedSchedule = useMemo(
    () => (scheduleValidation.ok ? resolveGroupSchedule(scheduleInput) : null),
    [scheduleInput, scheduleValidation.ok]
  );

  const summary =
    validation.ok && scheduleValidation.ok && resolvedSchedule
      ? poolSummary(
          validation.data.contributionAmount,
          validation.data.maxMembers,
          resolvedSchedule.frequency,
          validation.data.adminFeePercent,
          {
            adminParticipates,
            payInsPerCycle: resolvedSchedule.payInsPerCycle,
            payInFrequency: resolvedSchedule.frequency,
            memberWord: tp(
              validation.data.maxMembers,
              'plural.memberNoun_one',
              'plural.memberNoun_other'
            ),
          }
        )
      : null;

  const handleScheduleChange = (patch: Partial<GroupScheduleInput>) => {
    setSchedule((prev) => ({ ...prev, ...patch }));
  };

  const handleCustomDaysChange = (raw: string) => {
    setCustomDaysRaw(raw);
    const days = parseCustomCollectionDays(raw);
    if (days != null) {
      setSchedule((prev) => ({ ...prev, customCollectionDays: days }));
    }
  };

  const handleCreate = async () => {
    setFormHint('');

    if (!scheduleValidation.ok) {
      setFormHint(t(scheduleValidation.messageKey));
      return;
    }

    if (!validation.ok) {
      setFormHint(validation.message);
      Alert.alert('Check your details', validation.message);
      return;
    }

    if (!canSave) {
      promptSaveAuth({
        action: 'create a group',
        onSignIn: () => {
          exitBuildMode();
          router.replace('/(auth)/login');
        },
        onGuest: () => {},
        showGuest: false,
      });
      return;
    }

    if (!user) {
      Alert.alert('Sign in required', 'Sign in with email to create a group.');
      return;
    }

    if (!promptIdentityRequired(profile, router, t)) return;

    setLoading(true);
    try {
      const group = await createGroup({
        name: validation.data.name,
        contributionAmount: validation.data.contributionAmount,
        maxMembers: validation.data.maxMembers,
        adminFeePercent: validation.data.adminFeePercent,
        adminUser: user,
        adminParticipates,
        schedule: scheduleInput,
      });
      setCreated(group as AjoGroup);
      void refreshAdminAccess();
    } catch (e) {
      const msg = messageFromGroupError(e);
      setFormHint(msg);
      if (isProfileDatabaseFixError(msg)) alertProfileDatabaseFix();
      else Alert.alert('Could not create group', msg);
    }
    setLoading(false);
  };

  const buttonTitle = canSave ? 'Create group' : 'Create group (enter app first)';

  if (created) {
    return (
      <Screen safeArea={false} contentStyle={styles.content}>
        <GroupCreatedSuccess
          group={created}
          onOpenGroup={() => router.replace(`/group/${created.id}`)}
          onCreateAnother={() => {
            setCreated(null);
            setName('');
            setAmount('');
            setFormHint('');
            setSchedule(DEFAULT_SCHEDULE);
            setCustomDaysRaw('5');
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen keyboard safeArea={false} contentStyle={styles.content}>
      <AuthActionBanner action="create a group" />

      <Card>
        <Text style={[styles.section, { color: colors.textPrimary }]}>{t('create.basicsSection')}</Text>
        <Input
          label={t('create.groupNameLabel')}
          value={name}
          onChangeText={setName}
          placeholder={t('create.groupNamePlaceholder')}
        />
        <Input
          label={t('create.payInPerMember')}
          value={amount}
          onChangeText={setAmount}
          keyboardType="number-pad"
          placeholder="10000"
        />
        <Input
          label={t('create.maxMembersLabel')}
          value={maxMembers}
          onChangeText={setMaxMembers}
          keyboardType="number-pad"
          placeholder="4"
        />
      </Card>

      <Card>
        <Text style={[styles.section, { color: colors.textPrimary }]}>{t('create.scheduleSection')}</Text>
        <GroupSchedulePickers
          value={scheduleInput}
          customDaysRaw={customDaysRaw}
          onChange={handleScheduleChange}
          onCustomDaysChange={handleCustomDaysChange}
        />
        {scheduleValidation.ok && resolvedSchedule ? (
          <Text style={[styles.scheduleLine, { color: colors.textSecondary }]}>
            {scheduleSummaryLine(scheduleInput, t)}
          </Text>
        ) : null}
      </Card>

      <Card>
        <Text style={[styles.section, { color: colors.textPrimary }]}>{t('create.feesSection')}</Text>
        <Input
          label={t('create.adminFeeLabel')}
          value={adminFee}
          onChangeText={setAdminFee}
          keyboardType="decimal-pad"
          placeholder="0"
        />
      </Card>

      <Card>
        <View style={styles.participationRow}>
          <View style={styles.participationCopy}>
            <Text style={[styles.section, { color: colors.textPrimary, marginBottom: 4 }]}>
              {t('create.roleSection')}
            </Text>
            <Text style={[styles.feeHint, { color: colors.textSecondary, marginTop: 0 }]}>
              {adminParticipates ? t('create.roleParticipateHint') : t('create.roleOrganizerHint')}
            </Text>
          </View>
          <Switch
            value={adminParticipates}
            onValueChange={setAdminParticipates}
            trackColor={{ false: colors.border, true: colors.primary + '88' }}
            thumbColor={adminParticipates ? colors.primary : colors.textSecondary}
          />
        </View>
        <Text style={[styles.participationLabel, { color: colors.textPrimary }]}>
          {adminParticipates ? t('create.roleParticipate') : t('create.roleOrganizer')}
        </Text>
      </Card>

      {summary ? (
        <Card>
          <Text style={[styles.section, { color: colors.textPrimary }]}>{t('create.summarySection')}</Text>
          <Text style={[styles.summary, { color: colors.textPrimary }]}>{summary}</Text>
          {resolvedSchedule && resolvedSchedule.payInsPerCycle > 1 ? (
            <Text style={[styles.scheduleLine, { color: colors.textSecondary, marginTop: spacing.sm }]}>
              {t('create.schedulePayInsNote', {
                count: resolvedSchedule.payInsPerCycle,
                amount: formatNaira(validation.ok ? validation.data.contributionAmount : 0),
              })}
            </Text>
          ) : null}
        </Card>
      ) : (
        <Text style={[styles.formHint, { color: colors.textSecondary }]}>{t('create.summaryHint')}</Text>
      )}

      {formHint ? <Text style={[styles.formHint, { color: colors.error }]}>{formHint}</Text> : null}

      <Button title={buttonTitle} onPress={handleCreate} loading={loading} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.sm },
  section: { fontSize: 16, fontWeight: '700', marginBottom: spacing.md },
  feeHint: { fontSize: 12, lineHeight: 17, marginTop: -spacing.xs },
  scheduleLine: { fontSize: 13, lineHeight: 18 },
  summary: { fontSize: 15, lineHeight: 22 },
  formHint: { fontSize: 13, lineHeight: 18, marginBottom: spacing.sm, textAlign: 'center' },
  participationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  participationCopy: { flex: 1 },
  participationLabel: { fontSize: 14, fontWeight: '600', marginTop: spacing.sm },
});
