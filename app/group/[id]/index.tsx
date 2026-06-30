import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Share, StyleSheet, Text as RNText, View } from 'react-native';
import { GroupDetailHero } from '@/components/group/GroupDetailHero';
import { GroupMembersList } from '@/components/group/GroupMembersList';
import type { GroupMessagePerson } from '@/components/group/GroupMemberMessageRow';
import { GroupPrimaryAction } from '@/components/group/GroupPrimaryAction';
import { GroupQuickActions } from '@/components/group/GroupQuickActions';
import { PayoutOrderEditor } from '@/components/group/PayoutOrderEditor';
import { CollectorPickerSheet } from '@/components/group/CollectorPickerSheet';
import { RecordPaymentMethodSheet } from '@/components/group/RecordPaymentMethodSheet';
import { CycleSwapPanel } from '@/components/group/CycleSwapPanel';
import { Button, Card, Section, Text } from '@/components/ui';
import { CycleProgress } from '@/components/CycleProgress';
import { CyclePaymentsPanel } from '@/components/CyclePaymentsPanel';
import { DeleteDraftGroupCard } from '@/components/DeleteDraftGroupCard';
import { DraftGroupPanel } from '@/components/DraftGroupPanel';
import { EditDraftGroupSheet, draftFormValuesFromGroup, type DraftGroupFormValues } from '@/components/EditDraftGroupSheet';
import { GroupCycleHistory } from '@/components/GroupCycleHistory';
import { InviteCodeCard } from '@/components/InviteCodeCard';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { scheduleFromGroup, validateGroupSchedule } from '@/lib/group-schedule';
import { formatNaira, frequencyLabel } from '@/lib/format';
import { cyclePositionLabel, isLastCycle, payoutFromContributions } from '@/lib/cycle-utils';
import { messageFromGroupError } from '@/lib/group-errors';
import { promptProfileSetupForTransfer } from '@/lib/prompt-profile-setup';
import { promptIdentityRequired } from '@/lib/identity-gate';
import { fetchPayoutSlots, setPayoutOrder, type PayoutSlot } from '@/lib/payout-order';
import {
  fetchPendingCycleSwaps,
  requestCycleSwap,
  respondCycleSwap,
  type CycleSwapRequest,
} from '@/lib/cycle-swap';
import { cycleSwapEligibility } from '@/lib/cycle-swap-eligibility';
import type { PaymentMethod } from '@/lib/payment-methods';
import { promptSaveAuth } from '@/lib/prompt-save-auth';
import { memberDisplayName, type MemberWithProfile } from '@/lib/members';
import { advanceCycle, deleteDraftGroup, setAdminParticipation, startGroup, updateDraftGroupSettings } from '@/lib/groups';
import { sendCyclePayout } from '@/lib/payouts';
import { isPaystackConfigured } from '@/lib/paystack';
import { fetchPublicProfile, type PublicProfile } from '@/lib/public-profile';
import { resolveRouteParam } from '@/lib/route-params';
import { fetchGroupAdminFees } from '@/lib/money-summary';
import { fetchGroupCollectionTotals } from '@/lib/group-history';
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
  const [collectionTotals, setCollectionTotals] = useState<{ collected: number; outstanding: number } | null>(
    null
  );
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [editValues, setEditValues] = useState<DraftGroupFormValues | null>(null);
  const [adminProfile, setAdminProfile] = useState<PublicProfile | null>(null);
  const [payoutSlots, setPayoutSlots] = useState<PayoutSlot[]>([]);
  const [orderUserIds, setOrderUserIds] = useState<string[]>([]);
  const [payoutOrderSaving, setPayoutOrderSaving] = useState(false);
  const [collectorPickerIndex, setCollectorPickerIndex] = useState<number | null>(null);
  const payoutSaveSeq = useRef(0);
  const [swapRequests, setSwapRequests] = useState<CycleSwapRequest[]>([]);
  const [swapLoading, setSwapLoading] = useState(false);
  const [recordTarget, setRecordTarget] = useState<{
    id: string;
    name: string;
    amount: number;
  } | null>(null);
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
  const totalCycles = payoutSlots.length || members.length;
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

  const loadCollectionTotals = useCallback(async () => {
    if (!id || !group || group.status === 'draft') {
      setCollectionTotals(null);
      return;
    }
    try {
      setCollectionTotals(await fetchGroupCollectionTotals(id));
    } catch {
      setCollectionTotals(null);
    }
  }, [group, id]);

  useEffect(() => {
    void loadGroupFees();
    void loadCollectionTotals();
  }, [loadGroupFees, loadCollectionTotals, historyToken]);

  const loadPayoutData = useCallback(async () => {
    if (!id || !group) return;
    try {
      const slots = await fetchPayoutSlots(id);
      setPayoutSlots(slots);
      setOrderUserIds(slots.map((s) => s.userId));
      if (group.status !== 'draft') {
        setSwapRequests(await fetchPendingCycleSwaps(id));
      } else {
        setSwapRequests([]);
      }
    } catch {
      setPayoutSlots([]);
      setOrderUserIds([]);
      setSwapRequests([]);
    }
  }, [group, id]);

  useEffect(() => {
    void loadPayoutData();
  }, [loadPayoutData, historyToken, members.length]);

  const editorSlots = useMemo((): PayoutSlot[] => {
    const ids = orderUserIds.length ? orderUserIds : payoutSlots.map((s) => s.userId);
    if (!ids.length) return payoutSlots;
    return ids.map((userId, index) => {
      const member = memberByUserId.get(userId);
      const slotMeta = payoutSlots.find((s) => s.userId === userId);
      return {
        id: `slot-${index}-${userId}`,
        groupId: id ?? '',
        position: index + 1,
        userId,
        memberName: member ? memberDisplayName(member) : slotMeta?.memberName ?? 'Member',
        memberAvatarUrl: member?.profile?.avatar_url ?? slotMeta?.memberAvatarUrl ?? null,
      };
    });
  }, [orderUserIds, payoutSlots, memberByUserId, id]);

  const payoutOrderMembers = useMemo(
    () =>
      (members as MemberWithProfile[]).map((m) => ({
        userId: m.user_id,
        name: memberDisplayName(m),
        avatarUrl: m.profile?.avatar_url,
      })),
    [members]
  );
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
    if (!contribution) return;
    setRecordTarget({ id: contributionId, name, amount: contribution.amount });
  };

  const confirmRecordPayment = async (method: PaymentMethod, note: string) => {
    if (!recordTarget) return;
    setRecordingId(recordTarget.id);
    try {
      await recordContributionPayment(recordTarget.id, method, note || undefined);
      await Promise.all([refetch(), refetchContributions(), loadCollectionTotals()]);
      setRecordTarget(null);
    } catch (e) {
      Alert.alert('Could not record', messageFromGroupError(e));
    }
    setRecordingId(null);
  };

  const persistPayoutOrder = useCallback(
    async (next: string[]) => {
      if (!id || !next.length) return;
      const seq = ++payoutSaveSeq.current;
      setOrderUserIds(next);
      setPayoutOrderSaving(true);
      try {
        await setPayoutOrder(id, next);
        if (seq !== payoutSaveSeq.current) return;
        const slots = await fetchPayoutSlots(id);
        setPayoutSlots(slots);
        setOrderUserIds(slots.map((s) => s.userId));
      } catch (e) {
        Alert.alert('Could not save', messageFromGroupError(e));
        try {
          const slots = await fetchPayoutSlots(id);
          setPayoutSlots(slots);
          setOrderUserIds(slots.map((s) => s.userId));
        } catch {
          /* keep local state */
        }
      }
      if (seq === payoutSaveSeq.current) setPayoutOrderSaving(false);
    },
    [id]
  );

  const resolveOrderUserIds = useCallback((): string[] => {
    if (orderUserIds.length) return orderUserIds;
    return payoutSlots.map((s) => s.userId);
  }, [orderUserIds, payoutSlots]);

  const handleMoveSlotUp = (index: number) => {
    if (index <= 0) return;
    const base = resolveOrderUserIds();
    const next = [...base];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    void persistPayoutOrder(next);
  };

  const handleMoveSlotDown = (index: number) => {
    const base = resolveOrderUserIds();
    if (index >= base.length - 1) return;
    const next = [...base];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    void persistPayoutOrder(next);
  };

  const handleChangeCollector = (index: number) => {
    setCollectorPickerIndex(index);
  };

  const handleSelectCollector = (userId: string) => {
    if (collectorPickerIndex == null) return;
    const base = resolveOrderUserIds();
    const next = [...base];
    next[collectorPickerIndex] = userId;
    setCollectorPickerIndex(null);
    void persistPayoutOrder(next);
  };

  const handleAddRoundLocal = () => {
    const base = resolveOrderUserIds();
    const membersList = members as MemberWithProfile[];
    const defaultUserId = base[base.length - 1] ?? membersList[0]?.user_id;
    if (!defaultUserId) return;
    void persistPayoutOrder([...base, defaultUserId]);
  };

  const handleRequestSwap = async () => {
    if (!currentCycle) return;
    setSwapLoading(true);
    try {
      await requestCycleSwap(currentCycle.id);
      await Promise.all([loadPayoutData(), refetch()]);
      Alert.alert('Request sent', 'The scheduled collector and admin must both agree.');
    } catch (e) {
      Alert.alert('Could not request', messageFromGroupError(e));
    }
    setSwapLoading(false);
  };

  const handleRespondSwap = async (
    requestId: string,
    role: 'scheduled' | 'admin',
    approve: boolean
  ) => {
    setSwapLoading(true);
    try {
      await respondCycleSwap(requestId, role, approve);
      await Promise.all([loadPayoutData(), refetch(), refetchContributions()]);
    } catch (e) {
      Alert.alert('Could not respond', messageFromGroupError(e));
    }
    setSwapLoading(false);
  };

  const handleStart = async () => {
    if (!id || !group) return;
    if (!rosterIsComplete(members.length, group.max_members)) return;
    if (!promptIdentityRequired(profile, router, t)) return;

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
      `Round 1 will begin. Each member pays ${formatNaira(group!.contribution_amount)} ${frequencyLabel(group!.frequency).toLowerCase()}. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: async () => {
            setActionLoading(true);
            try {
              await startGroup(id);
              await refetch();
              Alert.alert('Group started', 'Round 1 is live. Members can pay in.');
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

    const finalCycle = isLastCycle(currentCycle.cycle_number, totalCycles);
    const payout = payoutFromContributions({
      contributions,
      adminFeePercent: group.admin_fee_percent ?? 0,
      recipientId: currentCycle.recipient_id,
      adminId: group.admin_id,
    });

    const usePaystack = isPaystackConfigured();
    const amountLine = payout.feeAmount > 0
      ? `${formatNaira(payout.net)} to collector (${formatNaira(payout.feeAmount)} admin fee from ${formatNaira(payout.gross)} turn money)`
      : `${formatNaira(payout.net)} to collector`;

    Alert.alert(
      finalCycle
        ? usePaystack
          ? 'Send final collection & end circle?'
          : 'Record final collection & end circle?'
        : usePaystack
          ? 'Send collection?'
          : 'Record collection sent?',
      finalCycle
        ? `This is the last turn (${cyclePositionLabel(currentCycle.cycle_number, totalCycles)}). ${amountLine}. After collection the circle will close — everyone will have collected once.`
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
              ? 'Send collection'
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
                    ? t('home.collectionRecorded')
                    : t('home.collectionSent'),
                finalCycle
                  ? 'Final collection recorded. Everyone has collected — this group is now in History.'
                  : result.transfer_code === 'manual'
                    ? 'Round marked collected. You can start the next round when ready.'
                    : 'Turn money sent to this round’s collector.'
              );
            } catch (e) {
              Alert.alert(t('home.collectionSendFailed'), messageFromGroupError(e));
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
        next ? 'Next round' : 'Circle complete',
        next
          ? `${cyclePositionLabel(next.cycle_number, members.length)} started. Record pay-ins for each member below.`
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

    const scheduleCheck = validateGroupSchedule(
      editValues.schedule.collectionFrequency === 'custom'
        ? {
            ...editValues.schedule,
            customCollectionDays:
              parseInt(editValues.customDaysRaw.replace(/\D/g, ''), 10) ||
              editValues.schedule.customCollectionDays ||
              5,
          }
        : editValues.schedule
    );
    if (!scheduleCheck.ok) {
      setEditError(t(scheduleCheck.messageKey));
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
          schedule: scheduleCheck.data,
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
    setEditValues(draftFormValuesFromGroup(group));
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
          <RNText style={[styles.deletingText, { color: colors.textSecondary }]}>Deleting group…</RNText>
        ) : null}
      </View>
    );
  }

  if (error || !group) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <RNText style={{ color: colors.error }}>{error ?? 'Group not found'}</RNText>
        <Button
          title="Go to Groups"
          onPress={() => router.dismissTo('/(tabs)/groups')}
          variant="secondary"
          style={{ marginTop: spacing.lg }}
        />
      </View>
    );
  }

  const payInsPerCycle = group.pay_ins_per_cycle ?? 1;
  const groupSchedule = scheduleFromGroup(group);
  const potSize = formatNaira(group.contribution_amount * members.length * payInsPerCycle);
  const projectedPot = formatNaira(group.contribution_amount * group.max_members * payInsPerCycle);
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
  const spotsLeft = membersStillNeeded(members.length, group.max_members);
  const swapEligibility = cycleSwapEligibility({
    groupStatus: group.status,
    isDraft,
    currentCycle,
    userId: user?.id,
    members,
    pendingRequests: swapRequests,
  });

  const shareInvite = async () => {
    const link = `roundpayajo://join/${group.invite_code}`;
    await Share.share({
      message: `Join "${group.name}" on RoundPayAjo!\n\nInvite code: ${group.invite_code}\n${link}`,
    });
  };

  return (
    <Screen
      safeArea={false}
      contentStyle={styles.content}
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await Promise.all([refetch(), refetchContributions(), loadCollectionTotals()]);
        setHistoryToken((t) => t + 1);
        await loadGroupFees();
        setRefreshing(false);
      }}>
      <GroupDetailHero
        group={group}
        schedule={groupSchedule}
        memberCount={members.length}
        payInsPerCycle={payInsPerCycle}
        isDraft={isDraft}
        isAdmin={!!isAdmin}
        potLabel={isDraft ? t('group.detail.turnMoneyUpTo') : t('group.detail.turnMoney')}
        potAmount={isDraft ? projectedPot : potSize}
        collected={collectionTotals?.collected}
        outstanding={collectionTotals?.outstanding}
        adminFeesEarned={groupFeesEarned}
        onFeesPress={() => router.push('/profile/earnings' as Href)}
      />

      <GroupQuickActions
        isDraft={isDraft}
        isAdmin={!!isAdmin}
        onSchedule={() => router.push(`/group/${group.id}/schedule` as Href)}
        onAdmin={isAdmin ? () => router.push(`/group/${group.id}/admin` as Href) : undefined}
        onEdit={isDraft && isAdmin ? openEditDraft : undefined}
        onInvite={isDraft ? shareInvite : undefined}
      />

      {isDraft ? (
        <DraftGroupPanel memberCount={members.length} maxMembers={group.max_members} isAdmin={!!isAdmin} />
      ) : null}

      {isDraft && isAdmin ? (
        <GroupPrimaryAction
          title={t('group.detail.startTitle')}
          subtitle={
            rosterComplete
              ? t('group.detail.startReady')
              : t('group.detail.startWaiting', { count: spotsLeft })
          }
          buttonTitle={
            rosterComplete ? t('group.detail.startButton') : t('group.rosterIncomplete', { current: members.length, max: group.max_members })
          }
          onPress={handleStart}
          loading={actionLoading}
          disabled={!canStartDraft || !canSave}
          hint={
            !canStartDraft && rosterComplete
              ? t('group.detail.startEnterApp')
              : !canStartDraft && !rosterComplete
                ? t('group.detail.startNeedMembers', { count: spotsLeft })
                : undefined
          }
        />
      ) : null}

      {isDraft && !isAdmin ? (
        <Card variant="summary" style={{ marginBottom: spacing.md }}>
          <Text variant="bodySmall" color="secondary" style={{ textAlign: 'center', lineHeight: 18 }}>
            {tp(group.max_members, 'group.onlyAdminStarts_one', 'group.onlyAdminStarts_other', {
              count: group.max_members,
            })}
          </Text>
        </Card>
      ) : null}

      {isAdmin && currentCycle?.status === 'completed' && group.status === 'active' ? (
        <GroupPrimaryAction
          title={
            isLastCycle(currentCycle.cycle_number, totalCycles)
              ? t('group.detail.finalCollectionTitle')
              : t('group.detail.collectionTitle')
          }
          subtitle={
            collectorPayout != null
              ? t('group.collectorReceives', { amount: formatNaira(collectorPayout) })
              : undefined
          }
          buttonTitle={
            isLastCycle(currentCycle.cycle_number, totalCycles)
              ? isPaystackConfigured()
                ? t('group.detail.sendFinalCollection')
                : t('group.detail.recordFinalCollection')
              : isPaystackConfigured()
                ? t('group.detail.sendCollection')
                : t('group.detail.recordCollection')
          }
          onPress={handlePayout}
          loading={actionLoading}
          hint={
            isLastCycle(currentCycle.cycle_number, totalCycles)
              ? t('group.detail.finalCollectionHint')
              : undefined
          }
        />
      ) : null}

      {isAdmin &&
      currentCycle?.status === 'paid_out' &&
      group.status === 'active' &&
      !isLastCycle(currentCycle.cycle_number, totalCycles) ? (
        <GroupPrimaryAction
          title={t('group.detail.nextRoundTitle')}
          subtitle={t('group.detail.nextRoundSubtitle')}
          buttonTitle={t('group.detail.nextRoundButton')}
          onPress={handleAdvance}
          loading={actionLoading}
          variant="secondary"
        />
      ) : null}

      {isAdmin &&
      currentCycle?.status === 'paid_out' &&
      group.status === 'active' &&
      isLastCycle(currentCycle.cycle_number, totalCycles) ? (
        <GroupPrimaryAction
          title={t('group.detail.endCircleTitle')}
          subtitle={t('group.detail.endCircleSubtitle')}
          buttonTitle={t('group.detail.endCircleButton')}
          onPress={handleAdvance}
          loading={actionLoading}
          hint={t('group.detail.endCircleHint')}
        />
      ) : null}

      {isDraft && editorSlots.length > 0 ? (
        <Section title={t('group.detail.collectionOrder')} compact>
          <PayoutOrderEditor
            slots={editorSlots}
            isAdmin={!!isAdmin}
            saving={payoutOrderSaving}
            onMoveUp={handleMoveSlotUp}
            onMoveDown={handleMoveSlotDown}
            onChangeCollector={handleChangeCollector}
            onAddRound={handleAddRoundLocal}
          />
        </Section>
      ) : null}

      {collectorPickerIndex != null && editorSlots[collectorPickerIndex] ? (
        <CollectorPickerSheet
          visible
          round={collectorPickerIndex + 1}
          selectedUserId={editorSlots[collectorPickerIndex]?.userId}
          options={payoutOrderMembers}
          onSelect={handleSelectCollector}
          onClose={() => setCollectorPickerIndex(null)}
        />
      ) : null}

      {isDraft && isAdmin ? (
        <Button
          title={adminInRotation ? t('group.detail.stepOut') : t('group.detail.joinRotation')}
          onPress={() => handleAdminParticipation(!adminInRotation)}
          loading={actionLoading}
          variant="secondary"
          style={{ marginBottom: spacing.md }}
        />
      ) : null}

      {!isDraft && !contribLoading ? (
        <CycleProgress
          paidCount={paidCount}
          totalCount={contributions.length}
          cycle={currentCycle}
          memberCount={members.length}
        />
      ) : null}

      {!isDraft && group.status === 'active' && currentCycle ? (
        <CycleSwapPanel
          requests={swapRequests}
          currentUserId={user?.id}
          isAdmin={!!isAdmin}
          loading={swapLoading}
          onRespond={handleRespondSwap}
          onRequestSwap={handleRequestSwap}
          canRequestSwap={swapEligibility.canRequest}
          swapBlockedReason={swapEligibility.reason}
        />
      ) : null}

      {!isDraft && !contribLoading ? (
        <CyclePaymentsPanel
          cycle={currentCycle}
          contributions={contributions}
          memberByUserId={memberByUserId}
          currentUserId={user?.id}
          isAdmin={!!isAdmin}
          paidCount={paidCount}
          payInsPerCycle={payInsPerCycle}
          onPay={handlePay}
          onRecordPayment={handleRecordPayment}
          onMessage={handleMemberMessage}
          adminUserId={group.admin_id}
          recordingId={recordingId}
        />
      ) : null}

      <GroupMembersList
        title={t('group.membersSection', { current: members.length, max: group.max_members })}
        adminPerson={adminPerson}
        members={memberPeople}
        canMessage={canMessageInGroup}
        onMessage={handleMemberMessage}
      />

      {!isDraft ? (
        <Section title={t('group.detail.history')} compact>
          <GroupCycleHistory
            groupId={group.id}
            adminId={group.admin_id}
            adminFeePercent={group.admin_fee_percent}
            reloadToken={historyToken}
          />
        </Section>
      ) : null}

      {!isDraft ? (
        <Text variant="caption" color="secondary" style={styles.footerNote}>
          {t('platform.noCustody')}
        </Text>
      ) : null}

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
      {recordTarget ? (
        <RecordPaymentMethodSheet
          visible
          memberName={recordTarget.name}
          amountLabel={formatNaira(recordTarget.amount)}
          saving={!!recordingId}
          onConfirm={confirmRecordPayment}
          onClose={() => setRecordTarget(null)}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  deletingText: { marginTop: spacing.md, fontSize: 14 },
  content: { paddingTop: spacing.sm, paddingBottom: spacing.xl },
  footerNote: { fontSize: 11, lineHeight: 15, textAlign: 'center', marginTop: spacing.md, marginBottom: spacing.sm },
});
