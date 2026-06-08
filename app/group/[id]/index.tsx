import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { Button, Card } from '@/components/ui';
import { CycleProgress } from '@/components/CycleProgress';
import { CyclePaymentsPanel } from '@/components/CyclePaymentsPanel';
import { DeleteDraftGroupCard } from '@/components/DeleteDraftGroupCard';
import { DraftGroupPanel } from '@/components/DraftGroupPanel';
import { EditDraftGroupSheet, type DraftGroupFormValues } from '@/components/EditDraftGroupSheet';
import { InviteCodeCard } from '@/components/InviteCodeCard';
import { Screen } from '@/components/Screen';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { formatNaira, frequencyLabel } from '@/lib/format';
import { messageFromGroupError } from '@/lib/group-errors';
import { promptProfileSetupForTransfer } from '@/lib/prompt-profile-setup';
import { promptSaveAuth } from '@/lib/prompt-save-auth';
import { memberDisplayName, type MemberWithProfile } from '@/lib/members';
import { advanceCycle, deleteDraftGroup, setAdminParticipation, startGroup, updateDraftGroupSettings } from '@/lib/groups';
import { sendCyclePayout } from '@/lib/payouts';
import { isPaystackConfigured } from '@/lib/paystack';
import { resolveRouteParam } from '@/lib/route-params';
import { useContributions } from '@/hooks/useContributions';
import { useGroup } from '@/hooks/useGroup';
import { recordContributionPayment } from '@/lib/contributions';
import { membersStillNeeded, rosterIsComplete, validateCreateGroupInput } from '@/lib/group-validation';
import { primaryAlpha, spacing, useThemeTokens } from '@/theme';

export default function GroupDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = resolveRouteParam(params.id);
  const { user, profile, canSave, signInAsGuest, exitBuildMode } = useAuth();
  const { group, members, currentCycle, loading, error, refetch } = useGroup(id);
  const { contributions, paidCount, loading: contribLoading, refetch: refetchContributions } =
    useContributions(currentCycle?.id);
  const [actionLoading, setActionLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [editValues, setEditValues] = useState<DraftGroupFormValues | null>(null);
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, scheme } = useThemeTokens();

  const memberByUserId = useMemo(() => {
    const map = new Map<string, MemberWithProfile>();
    (members as MemberWithProfile[]).forEach((m) => map.set(m.user_id, m));
    return map;
  }, [members]);

  const isAdmin = group?.admin_id === user?.id;
  const isDraft = group?.status === 'draft';
  const adminInRotation = members.some((m) => m.user_id === user?.id);
  const rosterComplete = group ? rosterIsComplete(members.length, group.max_members) : false;
  const canStartDraft = isDraft && isAdmin && rosterComplete;

  const handlePay = (contributionId: string) => {
    if (!promptProfileSetupForTransfer(profile, router, t)) return;
    router.push(`/group/${id}/pay?contributionId=${contributionId}`);
  };

  const handleRecordPayment = (contributionId: string) => {
    const contribution = contributions.find((c) => c.id === contributionId);
    const member = contribution ? memberByUserId.get(contribution.user_id) : null;
    const name = member ? memberDisplayName(member) : 'Member';

    Alert.alert(
      'Record payment?',
      `Mark ${name}'s ${contribution ? formatNaira(contribution.amount) : ''} contribution as paid?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Record paid',
          onPress: async () => {
            setRecordingId(contributionId);
            try {
              await recordContributionPayment(contributionId);
              await Promise.all([refetch(), refetchContributions()]);
            } catch (e) {
              Alert.alert('Could not record', messageFromGroupError(e));
            }
            setRecordingId(null);
          },
        },
      ]
    );
  };

  const handleStart = async () => {
    if (!id || !group) return;
    if (!rosterIsComplete(members.length, group.max_members)) return;

    if (!canSave) {
      promptSaveAuth({
        action: 'start this group',
        onSignIn: () => {
          exitBuildMode();
          router.replace('/(auth)/login');
        },
        onGuest: async () => {
          await signInAsGuest();
          await runStartAfterAuth();
        },
      });
      return;
    }

    await runStartAfterAuth();
  };

  const runStartAfterAuth = async () => {
    if (!id || !group) return;
    if (!group || !rosterIsComplete(members.length, group.max_members)) {
      const need = group ? membersStillNeeded(members.length, group.max_members) : 0;
      Alert.alert(
        'Roster not complete',
        need > 0
          ? `All ${group!.max_members} members must join before starting. ${need} more spot${need === 1 ? '' : 's'} left — share the invite code below.`
          : 'All members must join before starting. Share the invite code below.'
      );
      return;
    }

    Alert.alert(
      'Start group?',
      `Cycle 1 will begin. Each member pays ${formatNaira(group!.contribution_amount)} ${frequencyLabel(group!.frequency).toLowerCase()}. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: async () => {
            setActionLoading(true);
            try {
              await startGroup(id);
              await refetch();
              Alert.alert('Group started', 'Cycle 1 is live. Members can pay their contributions.');
            } catch (e) {
              Alert.alert('Could not start', messageFromGroupError(e));
            }
            setActionLoading(false);
          },
        },
      ]
    );
  };

  const handlePayout = async () => {
    if (!currentCycle) return;

    const usePaystack = isPaystackConfigured();
    Alert.alert(
      usePaystack ? 'Send payout?' : 'Record payout sent?',
      usePaystack
        ? 'Send this cycle’s pot to the collector via Paystack. They need a verified bank account in Profile.'
        : 'Mark this cycle as paid out to the collector (use when you sent cash or bank transfer).',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: usePaystack ? 'Send payout' : 'Record sent',
          onPress: async () => {
            setActionLoading(true);
            try {
              const result = await sendCyclePayout(currentCycle.id);
              await refetch();
              Alert.alert(
                result.transfer_code === 'manual' ? 'Payout recorded' : 'Payout sent',
                result.transfer_code === 'manual'
                  ? 'Cycle marked paid out. You can start the next cycle.'
                  : 'Funds sent to this cycle’s collector.'
              );
            } catch (e) {
              Alert.alert('Could not send payout', messageFromGroupError(e));
            }
            setActionLoading(false);
          },
        },
      ]
    );
  };

  const handleAdvance = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const next = await advanceCycle(id);
      await Promise.all([refetch(), refetchContributions()]);
      Alert.alert(
        next ? 'Next cycle' : 'Complete',
        next
          ? `Cycle ${next.cycle_number} started. Record payments for each member below.`
          : 'Everyone has collected. Group finished.'
      );
    } catch (e) {
      Alert.alert('Error', messageFromGroupError(e));
    }
    setActionLoading(false);
  };

  const handleDeleteDraft = () => {
    if (!id || !group || isDeleting) return;

    Alert.alert(
      'Delete group?',
      `"${group.name}" will be permanently removed. Members will lose access. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            setActionLoading(true);
            try {
              await deleteDraftGroup(id);
              router.dismissTo('/(tabs)/groups');
            } catch (e) {
              setIsDeleting(false);
              setActionLoading(false);
              Alert.alert('Could not delete', messageFromGroupError(e));
            }
          },
        },
      ]
    );
  };

  const handleSaveDraftSettings = async () => {
    if (!id || !group || !editValues) return;

    const validation = validateCreateGroupInput({
      name: editValues.name,
      amountRaw: editValues.amount,
      maxMembersRaw: editValues.maxMembers,
      adminFeeRaw: String(group.admin_fee_percent),
    });

    if (!validation.ok) {
      setEditError(validation.message);
      return;
    }

    setEditSaving(true);
    setEditError('');
    try {
      await updateDraftGroupSettings(
        id,
        {
          name: validation.data.name,
          contributionAmount: validation.data.contributionAmount,
          maxMembers: validation.data.maxMembers,
          frequency: editValues.frequency,
        },
        { currentMemberCount: members.length }
      );
      setEditOpen(false);
      await refetch();
    } catch (e) {
      setEditError(messageFromGroupError(e));
    }
    setEditSaving(false);
  };

  const openEditDraft = () => {
    if (!group) return;
    setEditError('');
    setEditValues({
      name: group.name,
      amount: String(group.contribution_amount),
      maxMembers: String(group.max_members),
      frequency: group.frequency,
    });
    setEditOpen(true);
  };

  const handleAdminParticipation = async (participates: boolean) => {
    if (!id || !user) return;
    setActionLoading(true);
    try {
      await setAdminParticipation(id, user.id, participates);
      await refetch();
      Alert.alert(
        participates ? 'Joined rotation' : 'Stepped out',
        participates
          ? 'You are now in the rotation and will pay on your turn.'
          : 'You are organizer only — not in the member list until you join again.'
      );
    } catch (e) {
      Alert.alert('Could not update', messageFromGroupError(e));
    }
    setActionLoading(false);
  };

  if (loading || isDeleting) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
        {isDeleting ? (
          <Text style={[styles.deletingText, { color: colors.textSecondary }]}>Deleting group…</Text>
        ) : null}
      </View>
    );
  }

  if (error || !group) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.error }}>{error ?? 'Group not found'}</Text>
        <Button
          title="Go to Groups"
          onPress={() => router.dismissTo('/(tabs)/groups')}
          variant="secondary"
          style={{ marginTop: spacing.lg }}
        />
      </View>
    );
  }

  const potSize = formatNaira(group.contribution_amount * members.length);
  const projectedPot = formatNaira(group.contribution_amount * group.max_members);
  const spotsLeft = membersStillNeeded(members.length, group.max_members);

  return (
    <Screen
      safeArea={false}
      contentStyle={styles.content}
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await Promise.all([refetch(), refetchContributions()]);
        setRefreshing(false);
      }}>
      <Card style={styles.hero}>
        <View style={styles.heroTop}>
          <Text style={[styles.name, { color: colors.textPrimary }]}>{group.name}</Text>
          <StatusBadge status={group.status} />
        </View>
        <Text style={[styles.amount, { color: colors.primary }]}>{formatNaira(group.contribution_amount)}</Text>
        {isAdmin ? (
          <Button
            title={t('admin.groupAdminTitle')}
            variant="secondary"
            onPress={() => router.push(`/group/${group.id}/admin` as Href)}
            style={styles.adminHubBtn}
          />
        ) : null}
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          {frequencyLabel(group.frequency)}
          {isDraft ? ` · up to ${projectedPot} pot` : ` · Pot ${potSize}`}
        </Text>
        {isDraft ? (
          <InviteCodeCard groupName={group.name} inviteCode={group.invite_code} />
        ) : null}
      </Card>

      {isDraft ? (
        <DraftGroupPanel
          memberCount={members.length}
          maxMembers={group.max_members}
          isAdmin={!!isAdmin}
          adminParticipates={adminInRotation}
        />
      ) : null}

      {isDraft && isAdmin ? (
        <Card style={{ marginBottom: spacing.md }}>
          <Text style={[styles.section, { color: colors.textPrimary, marginTop: 0 }]}>Group settings</Text>
          <Text style={[styles.actionHint, { color: colors.textSecondary, textAlign: 'left', marginTop: 0 }]}>
            {group.max_members} members · {formatNaira(group.contribution_amount)} each
          </Text>
          <Button
            title="Edit settings"
            onPress={openEditDraft}
            variant="secondary"
            style={{ marginTop: spacing.sm }}
          />
        </Card>
      ) : null}

      {isDraft && isAdmin ? (
        <Card style={{ marginBottom: spacing.md }}>
          <Text style={[styles.section, { color: colors.textPrimary, marginTop: 0 }]}>Your contribution</Text>
          <Text style={[styles.actionHint, { color: colors.textSecondary, textAlign: 'left', marginTop: 0 }]}>
            {adminInRotation
              ? 'You are in the rotation and will pay on your turn.'
              : 'You are organizing only — not paying or collecting.'}
          </Text>
          <Button
            title={adminInRotation ? 'Step out of rotation' : 'Join as contributor'}
            onPress={() => handleAdminParticipation(!adminInRotation)}
            loading={actionLoading}
            variant="secondary"
            style={{ marginTop: spacing.sm }}
          />
        </Card>
      ) : null}

      {!isDraft && !contribLoading && (
        <CycleProgress paidCount={paidCount} totalCount={contributions.length} cycle={currentCycle} />
      )}

      {!isDraft && !contribLoading && (
        <CyclePaymentsPanel
          cycle={currentCycle}
          contributions={contributions}
          memberByUserId={memberByUserId}
          currentUserId={user?.id}
          isAdmin={!!isAdmin}
          paidCount={paidCount}
          onPay={handlePay}
          onRecordPayment={handleRecordPayment}
          recordingId={recordingId}
        />
      )}

      <Text style={[styles.section, { color: colors.textPrimary }]}>
        Members ({members.length}/{group.max_members})
      </Text>
      {(members as MemberWithProfile[]).map((m) => {
        const isCollector = currentCycle?.recipient_id === m.user_id;
        const isYou = m.user_id === user?.id;
        return (
          <View key={m.id} style={[styles.memberRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.orderBadge, { backgroundColor: primaryAlpha(scheme, 32) }]}>
              <Text style={{ color: colors.primary, fontWeight: '700' }}>{m.rotation_order}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>
                {memberDisplayName(m)}
                {isYou ? ' (you)' : ''}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                {m.role === 'admin' ? 'Admin · Contributor' : 'Member'}
                {m.has_collected ? ' · Collected' : ''}
                {isCollector ? ' · Collecting this cycle' : ''}
              </Text>
            </View>
          </View>
        );
      })}

      <View style={styles.actions}>
        {isDraft && isAdmin ? (
          <>
            <Button
              title={
                rosterComplete
                  ? 'Start group'
                  : `Roster incomplete (${members.length}/${group.max_members})`
              }
              onPress={handleStart}
              loading={actionLoading}
              disabled={!canStartDraft || !canSave}
            />
            {!canStartDraft && !rosterComplete ? (
              <Text style={[styles.actionHint, { color: colors.textSecondary }]}>
                {spotsLeft} more member{spotsLeft === 1 ? '' : 's'} must join before you can start.
              </Text>
            ) : !canStartDraft && rosterComplete ? (
              <Text style={[styles.actionHint, { color: colors.textSecondary }]}>
                Enter app from Profile to start this group.
              </Text>
            ) : null}
          </>
        ) : null}

        {isDraft && !isAdmin ? (
          <Text style={[styles.actionHint, { color: colors.textSecondary }]}>
            Only the admin can start the group once all {group.max_members} members have joined.
          </Text>
        ) : null}

        {isAdmin && currentCycle?.status === 'completed' && (
          <Button
            title={isPaystackConfigured() ? 'Send payout (Paystack)' : 'Record payout sent'}
            onPress={handlePayout}
            loading={actionLoading}
          />
        )}
        {isAdmin && currentCycle?.status === 'paid_out' && group.status === 'active' && (
          <Button title="Start next cycle" onPress={handleAdvance} loading={actionLoading} variant="secondary" />
        )}
      </View>

      {isDraft && isAdmin ? (
        <DeleteDraftGroupCard
          groupName={group.name}
          onPress={handleDeleteDraft}
          loading={actionLoading}
        />
      ) : null}

      {group && editValues ? (
        <EditDraftGroupSheet
          visible={editOpen}
          group={group}
          memberCount={members.length}
          saving={editSaving}
          error={editError}
          values={editValues}
          onChange={(patch) => setEditValues((prev) => (prev ? { ...prev, ...patch } : prev))}
          onSave={handleSaveDraftSettings}
          onClose={() => setEditOpen(false)}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  deletingText: { marginTop: spacing.md, fontSize: 14 },
  content: { paddingTop: spacing.sm, paddingBottom: spacing.xl },
  hero: { marginBottom: spacing.md },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  name: { fontSize: 22, fontWeight: '700', flex: 1 },
  amount: { fontSize: 28, fontWeight: '800', marginTop: spacing.sm },
  adminHubBtn: { marginTop: spacing.sm, marginBottom: 0 },
  meta: { fontSize: 14, marginTop: 4 },
  section: { fontSize: 17, fontWeight: '600', marginBottom: spacing.sm, marginTop: spacing.sm },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  orderBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { marginTop: spacing.md, gap: spacing.xs },
  actionHint: { fontSize: 13, textAlign: 'center', lineHeight: 18, marginTop: spacing.xs },
});
