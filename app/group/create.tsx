import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import { AuthActionBanner } from '@/components/AuthActionBanner';
import { Button, Card } from '@/components/ui';
import { GroupCreatedSuccess } from '@/components/GroupCreatedSuccess';
import { GroupFrequencyPicker } from '@/components/GroupFrequencyPicker';
import { Input } from '@/components/Input';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminMode } from '@/contexts/AdminModeContext';
import { messageFromGroupError } from '@/lib/group-errors';
import { alertProfileDatabaseFix, isProfileDatabaseFixError } from '@/lib/profile';
import { poolSummary, validateCreateGroupInput } from '@/lib/group-validation';
import { createGroup } from '@/lib/groups';
import { promptSaveAuth } from '@/lib/prompt-save-auth';
import type { AjoGroup, GroupFrequency } from '@/lib/types';
import { spacing, useThemeTokens } from '@/theme';

export default function CreateGroupScreen() {
  const { user, canSave, exitBuildMode, signInAsGuest } = useAuth();
  const { refreshAdminAccess } = useAdminMode();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [maxMembers, setMaxMembers] = useState('10');
  const [adminFee, setAdminFee] = useState('0');
  const [adminParticipates, setAdminParticipates] = useState(true);
  const [frequency, setFrequency] = useState<GroupFrequency>('week:1');
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<AjoGroup | null>(null);
  const [formHint, setFormHint] = useState('');
  const router = useRouter();
  const { colors } = useThemeTokens();

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

  const summary =
    validation.ok
      ? poolSummary(
          validation.data.contributionAmount,
          validation.data.maxMembers,
          frequency,
          validation.data.adminFeePercent
        )
      : null;

  const handleCreate = async () => {
    setFormHint('');

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
        onGuest: async () => {
          setLoading(true);
          try {
            const guest = await signInAsGuest();
            const group = await createGroup({
              name: validation.data.name,
              contributionAmount: validation.data.contributionAmount,
              frequency,
              maxMembers: validation.data.maxMembers,
              adminFeePercent: validation.data.adminFeePercent,
              adminUser: guest,
              adminParticipates,
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
        },
      });
      return;
    }

    if (!user) {
      Alert.alert('Sign in required', 'Enter the app from Profile to create a group.');
      return;
    }

    setLoading(true);
    try {
      const group = await createGroup({
        name: validation.data.name,
        contributionAmount: validation.data.contributionAmount,
        frequency,
        maxMembers: validation.data.maxMembers,
        adminFeePercent: validation.data.adminFeePercent,
        adminUser: user,
        adminParticipates,
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
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen keyboard safeArea={false} contentStyle={styles.content}>
      <Text style={[styles.lead, { color: colors.textSecondary }]}>
        Set the rules for your Ajo. Everyone must join before the admin starts cycle 1.
      </Text>

      <AuthActionBanner action="create a group" />
      <Card>
        <Text style={[styles.section, { color: colors.textPrimary }]}>Basics</Text>
        <Input label="Group name" value={name} onChangeText={setName} placeholder="e.g. Office Ajo" />
        <Input
          label="Contribution per member (₦)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="number-pad"
          placeholder="50000"
        />

        <Text style={[styles.label, { color: colors.textPrimary }]}>How often?</Text>
        <GroupFrequencyPicker value={frequency} onChange={setFrequency} />
      </Card>

      <Card>
        <Text style={[styles.section, { color: colors.textPrimary }]}>Size & fees</Text>
        <Input label="Max members" value={maxMembers} onChangeText={setMaxMembers} keyboardType="number-pad" />
        <Input
          label="Admin fee (%)"
          value={adminFee}
          onChangeText={setAdminFee}
          keyboardType="decimal-pad"
          placeholder="0"
        />
        <Text style={[styles.feeHint, { color: colors.textSecondary }]}>
          Optional fee taken from the pool when a member collects. Use 0 for no fee.
        </Text>
      </Card>

      <Card>
        <View style={styles.participationRow}>
          <View style={styles.participationCopy}>
            <Text style={[styles.section, { color: colors.textPrimary, marginBottom: 4 }]}>Your role</Text>
            <Text style={[styles.feeHint, { color: colors.textSecondary, marginTop: 0 }]}>
              {adminParticipates
                ? 'You will contribute and collect on your turn like other members.'
                : 'Organizer only — you manage the group but are not in the rotation.'}
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
          {adminParticipates ? 'I will contribute' : 'Organizer only'}
        </Text>
      </Card>

      {summary ? (
        <Card>
          <Text style={[styles.section, { color: colors.textPrimary }]}>Summary</Text>
          <Text style={[styles.summary, { color: colors.textPrimary }]}>{summary}</Text>
        </Card>
      ) : (
        <Text style={[styles.formHint, { color: colors.textSecondary }]}>
          Enter a group name and contribution amount (e.g. 50000) to see a summary.
        </Text>
      )}

      {formHint ? <Text style={[styles.formHint, { color: colors.error }]}>{formHint}</Text> : null}

      <Button title={buttonTitle} onPress={handleCreate} loading={loading} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.sm },
  lead: { fontSize: 15, lineHeight: 22, marginBottom: spacing.md },
  section: { fontSize: 16, fontWeight: '700', marginBottom: spacing.md },
  label: { fontSize: 14, fontWeight: '500', marginBottom: spacing.sm },
  freqHint: { fontSize: 12, lineHeight: 17, marginTop: -spacing.xs, marginBottom: spacing.sm },
  feeHint: { fontSize: 12, lineHeight: 17, marginTop: -spacing.xs },
  summary: { fontSize: 15, lineHeight: 22 },
  formHint: { fontSize: 13, lineHeight: 18, marginBottom: spacing.sm, textAlign: 'center' },
  participationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  participationCopy: { flex: 1 },
  participationLabel: { fontSize: 14, fontWeight: '600', marginTop: spacing.sm },
});
