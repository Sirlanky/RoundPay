import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { GroupMemberMessageRow, type GroupMessagePerson } from '@/components/group/GroupMemberMessageRow';
import { Button, Card } from '@/components/ui';
import { CycleProgress } from '@/components/CycleProgress';
import { CyclePaymentsPanel } from '@/components/CyclePaymentsPanel';
import { DeleteDraftGroupCard } from '@/components/DeleteDraftGroupCard';
import { DraftGroupPanel } from '@/components/DraftGroupPanel';
import { EditDraftGroupSheet, type DraftGroupFormValues } from '@/components/EditDraftGroupSheet';
import { GroupCycleHistory } from '@/components/GroupCycleHistory';
import { InviteCodeCard } from '@/components/InviteCodeCard';
import { Screen } from '@/components/Screen';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { formatNaira, frequencyLabel } from '@/lib/format';
import { cyclePositionLabel, isLastCycle, payoutFromContributions } from '@/lib/cycle-utils';
import { messageFromGroupError } from '@/lib/group-errors';
import { promptProfileSetupForTransfer } from '@/lib/prompt-profile-setup';
import { promptSaveAuth } from '@/lib/prompt-save-auth';
import { memberDisplayName, type MemberWithProfile } from '@/lib/members';
import { advanceCycle, deleteDraftGroup, setAdminParticipation, startGroup, updateDraftGroupSettings } from '@/lib/groups';
import { sendCyclePayout } from '@/lib/payouts';
import { isPaystackConfigured } from '@/lib/paystack';
import { fetchPublicProfile, type PublicProfile } from '@/lib/public-profile';
import { resolveRouteParam } from '@/lib/route-params';
import { fetchGroupAdminFees } from '@/lib/money-summary';
import { useContributions } from '@/hooks/useContributions';
import { useGroup } from '@/hooks/useGroup';
import { recordContributionPayment } from '@/lib/contributions';
import { membersStillNeeded, rosterIsComplete, validateCreateGroupInput } from '@/lib/group-validation';
import { spacing, useThemeTokens } from '@/theme';

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
  const [historyToken, setHistoryToken] = useState(0);
  const [groupFeesEarned, setGroupFeesEarned] = useState<number | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [editValues, setEditValues] = useState<DraftGroupFormValues | null>(null);
  const [adminProfile, setAdminProfile] = useState<PublicProfile | null>(null);
  const router = useRouter();
  const { t, tp } = useTranslation();
  const { colors } = useThemeTokens();

  const memberByUserId = useMemo(() => {
    const map = new Map<string, MemberWithProfile>();
    (members as MemberWithProfile[]).forEach((m) => map.set(m.user_id, m));
    return map;
  }, [members]);

  const isAdmin = group?.admin_id === user?.id;
  const isDraft = group?.status === 'draft';
  const canMessageInGroup = group?.status === 'active' || group?.status === 'completed';

  useEffect(() => {
    if (!group || !canMessageInGroup || !group.admin_id) {
      setAdminProfile(null);
      return;
    }
    const adminListed = members.some((m) => m.user_id === group.admin_id);
    if (adminListed) {
      setAdminProfile(null);
      return;
    }
    let active = true;
    void fetchPublicProfile(group.admin_id).then((p) => {
      if (active) setAdminProfile(p);
    });
    return () => {
      active = false;
    };
  }, [group, members, canMessageInGroup]);

  const memberPeople = useMemo((): GroupMessagePerson[] => {
    return (members as MemberWithProfile[]).map((m) => {
      const isCollector = currentCycle?.recipient_id === m.user_id;
      const subtitleParts = [
        m.role === 'admin' ? t('messages.roleAdminContributor') : t('messages.roleMember'),
        m.has_collected ? t('messages.collected') : null,
        isCollector ? t('messages.collectingThisCycle') : null,
      ].filter(Boolean);
      return {
        userId: m.user_id,
        name: memberDisplayName(m),
        avatarUrl: m.profile?.avatar_url,
        subtitle: subtitleParts.join(' · '),
        isYou: m.user_id === user?.id,
      };
    });
  }, [members, currentCycle?.recipient_id, user?.id, t]);

  const adminPerson = useMemo((): GroupMessagePerson | null => {
    if (!adminProfile || !group) return null;
    const name =
      adminProfile.full_name?.trim() ||
      [adminProfile.first_name, adminProfile.last_name].filter(Boolean).join(' ').trim() ||
      t('messages.roleAdmin');
    return {
      userId: adminProfile.id,
      name,
      avatarUrl: adminProfile.avatar_url,
      subtitle: t('messages.roleAdminOrganizer'),
      isYou: adminProfile.id === user?.id,
    };
  }, [adminProfile, group, user?.id, t]);

  const handleMemberMessage = (targetUserId: string) => {
    if (!promptProfileSetupForTransfer(profile, router, t)) return;
    if (!canSave) {
      promptSaveAuth({
        action: 'send messages',
        onSignIn: () => {
          exitBuildMode();
          router.replace('/(auth)/login');
        },
        onGuest: async () => {
          await signInAsGuest();
          router.push(`/messages/${targetUserId}` as Href);
        },
      });
      return;
    }
    router.push(`/messages/${targetUserId}` as Href);
  };

  const loadGroupFees = useCallback(async () => {
    if (!id || !group || group.admin_id !== user?.id || !group.admin_fee_percent) {
      setGroupFeesEarned(null);
      return;
    }
    try {
      setGroupFeesEarned(await fetchGroupAdminFees(id));
    } catch {
      setGroupFeesEarned(null);
    }
  }, [group, id, user?.id]);

  useEffect(() => {
    void loadGroupFees();
  }, [loadGroupFees, historyToken]);
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
          ? `All ${tp(group!.max_members, 'plural.member_one', 'plural.member_other', { count: group!.max_members })} must join before starting. ${tp(need, 'plural.spotLeft_one', 'plural.spotLeft_other', { count: need })} — share the invite code below.`
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
    if (!currentCycle || !group) return;

    const finalCycle = isLastCycle(currentCycle.cycle_number, members.length);
    const payout = payoutFromContributions({
      contributions,
      adminFeePercent: group.admin_fee_percent ?? 0,
      recipientId: currentCycle.recipient_id,
      adminId: group.admin_id,
    });

    const usePaystack = isPaystackConfigured();
    const amountLine = payout.feeAmount > 0
      ? `${formatNaira(payout.net)} to collector (${formatNaira(payout.feeAmount)} admin fee from ${formatNaira(payout.gross)} pool)`
      : `${formatNaira(payout.net)} to collector`;

    Alert.alert(
      finalCycle
        ? usePaystack
          ? 'Send final payout & end circle?'
          : 'Record final payout & end circle?'
        : usePaystack
          ? 'Send payout?'
          : 'Record payout sent?',
      finalCycle
        ? `This is the last rotation (${cyclePositionLabel(currentCycle.cycle_number, members.length)}). ${amountLine}. After payout the circle will close — everyone will have collected once.`
        : usePaystack
          ? `${amountLine}. They need a verified bank account in Profile.`
          : `${amountLine}. Use when you sent cash or bank transfer.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: finalCycle
            ? usePaystack
              ? 'Send & end circle'
              : 'Record & end circle'
            : usePaystack
              ? 'Send payout'
              : 'Record sent',
          onPress: async () => {
            setActionLoading(true);
            try {
              const result = await sendCyclePayout(currentCycle.id);
              if (finalCycle) {
                await advanceCycle(id!);
              }
              await Promise.all([refetch(), refetchContributions()]);
              setHistoryToken((t) => t + 1);
              Alert.alert(
                finalCycle
                  ? 'Circle complete'
                  : result.transfer_code === 'manual'
                    ? 'Payout recorded'
                    : 'Payout sent',
                finalCycle
                  ? 'Final payout recorded. Everyone has collected — this group is now in History.'
                  : result.transfer_code === 'manual'
                    ? 'Cycle marked paid out. You can start the next cycle when ready.'
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
      setHistoryToken((t) => t + 1);
      Alert.alert(
        next ? 'Next cycle' : 'Circle complete',
        next
          ? `${cyclePositionLabel(next.cycle_number, members.length)} started. Record payments for each member below.`
          : 'Everyone has collected. This group is now in History.'
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
  const collectorPayout =
    !isDraft && currentCycle && group.admin_fee_percent > 0
      ? payoutFromContributions({
          contributions,
          adminFeePercent: group.admin_fee_percent,
          recipientId: currentCycle.recipient_id,
          adminId: group.admin_id,
          estimateIfIncomplete: true,
        }).net
      : null;
  const feeMeta =
    group.admin_fee_percent > 0
      ? adminInRotation
        ? ` · ${group.admin_fee_percent}% fee (not on admin's turn)`
        : ` · ${group.admin_fee_percent}% admin fee`
      : '';
  const spotsLeft = membersStillNeeded(members.length, group.max_members);

  return (
    <Screen
      safeArea={false}
      contentStyle={styles.content}
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await Promise.all([refetch(), refetchContributions()]);
        setHistoryToken((t) => t + 1);
        await loadGroupFees();
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
          {!isDraft && collectorPayout != null && collectorPayout !== group.contribution_amount * members.length
            ? ` · Collector receives ${formatNaira(collectorPayout)}`
            : ''}
          {feeMeta}
        </Text>
        {isAdmin && group.admin_fee_percent > 0 && groupFeesEarned !== null ? (
          <Pressable
            onPress={() => router.push('/profile/earnings' as Href)}
            style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1, marginTop: spacing.sm }]}>
            <Text style={{ color: colors.success, fontWeight: '700', fontSize: 15 }}>
              Admin fees · {formatNaira(groupFeesEarned)}
            </Text>
          </Pressable>
        ) : null}
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
            {tp(group.max_members, 'plural.groupMeta_one', 'plural.groupMeta_other', {
              count: group.max_members,
              amount: formatNaira(group.contribution_amount),
            })}
            {group.admin_fee_percent > 0 ? ` · ${group.admin_fee_percent}% admin fee` : ''}
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
        <CycleProgress
          paidCount={paidCount}
          totalCount={contributions.length}
          cycle={currentCycle}
          memberCount={members.length}
        />
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
        {t('group.membersSection', { current: members.length, max: group.max_members })}
      </Text>
      {adminPerson ? (
        <GroupMemberMessageRow
          person={adminPerson}
          canMessage={canMessageInGroup}
          onMessage={handleMemberMessage}
        />
      ) : null}
      {memberPeople.map((person) => (
        <GroupMemberMessageRow
          key={person.userId}
          person={person}
          canMessage={canMessageInGroup}
          onMessage={handleMemberMessage}
        />
      ))}

      {!isDraft ? (
        <GroupCycleHistory
          groupId={group.id}
          adminId={group.admin_id}
          adminFeePercent={group.admin_fee_percent}
          reloadToken={historyToken}
        />
      ) : null}

      <View style={styles.actions}>
        {isDraft && isAdmin ? (
          <>
            <Button
              title={
                rosterComplete
                  ? 'Start group'
                  : t('group.rosterIncomplete', { current: members.length, max: group.max_members })
              }
              onPress={handleStart}
              loading={actionLoading}
              disabled={!canStartDraft || !canSave}
            />
            {!canStartDraft && !rosterComplete ? (
              <Text style={[styles.actionHint, { color: colors.textSecondary }]}>
                {tp(spotsLeft, 'plural.moreMember_one', 'plural.moreMember_other', { count: spotsLeft })} must join
                before you can start.
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
            {tp(group.max_members, 'group.onlyAdminStarts_one', 'group.onlyAdminStarts_other', {
              count: group.max_members,
            })}
          </Text>
        ) : null}

        {isAdmin && currentCycle?.status === 'completed' && group.status === 'active' ? (
          <>
            <Button
              title={
                isLastCycle(currentCycle.cycle_number, members.length)
                  ? isPaystackConfigured()
                    ? 'Send final payout & end circle'
                    : 'Record final payout & end circle'
                  : isPaystackConfigured()
                    ? 'Send payout (Paystack)'
                    : 'Record payout sent'
              }
              onPress={handlePayout}
              loading={actionLoading}
            />
            {isLastCycle(currentCycle.cycle_number, members.length) ? (
              <Text style={[styles.actionHint, { color: colors.textSecondary }]}>
                Last rotation — payout closes the circle for everyone.
              </Text>
            ) : null}
          </>
        ) : null}
        {isAdmin &&
        currentCycle?.status === 'paid_out' &&
        group.status === 'active' &&
        !isLastCycle(currentCycle.cycle_number, members.length) ? (
          <Button title="Start next cycle" onPress={handleAdvance} loading={actionLoading} variant="secondary" />
        ) : null}
        {isAdmin &&
        currentCycle?.status === 'paid_out' &&
        group.status === 'active' &&
        isLastCycle(currentCycle.cycle_number, members.length) ? (
          <>
            <Button title="End circle" onPress={handleAdvance} loading={actionLoading} />
            <Text style={[styles.actionHint, { color: colors.textSecondary }]}>
              Payout recorded. Tap to close the circle if you have not already.
            </Text>
          </>
        ) : null}
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
          adminParticipates={adminInRotation}
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
  actions: { marginTop: spacing.md, gap: spacing.xs },
  actionHint: { fontSize: 13, textAlign: 'center', lineHeight: 18, marginTop: spacing.xs },
});
