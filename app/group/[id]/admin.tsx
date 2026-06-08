import { useLocalSearchParams, useNavigation, useRouter, type Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useLayoutEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { AdminKpiGrid } from '@/components/admin/AdminKpiGrid';
import { GroupHealthBadge } from '@/components/admin/GroupHealthBadge';
import { CyclePaymentsPanel } from '@/components/CyclePaymentsPanel';
import { CycleProgress } from '@/components/CycleProgress';
import { Screen } from '@/components/Screen';
import { Button, Card, StatusBadge, Text } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { useContributions } from '@/hooks/useContributions';
import { useGroup } from '@/hooks/useGroup';
import type { GroupHealth } from '@/lib/admin/admin-dashboard';
import { isGroupAdmin } from '@/lib/admin/role';
import { recordContributionPayment } from '@/lib/contributions';
import { formatNaira } from '@/lib/format';
import { messageFromGroupError } from '@/lib/group-errors';
import { advanceCycle } from '@/lib/groups';
import { memberDisplayName, type MemberWithProfile } from '@/lib/members';
import { isPaystackConfigured } from '@/lib/paystack';
import { sendCyclePayout } from '@/lib/payouts';
import { resolveRouteParam } from '@/lib/route-params';
import { primaryAlpha, spacing, useThemeTokens } from '@/theme';

function AdminLinkRow({
  icon,
  label,
  onPress,
  isLast,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  const { colors, scheme } = useThemeTokens();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.linkRow,
        !isLast && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
        { opacity: pressed ? 0.85 : 1 },
      ]}>
      <View style={[styles.linkIcon, { backgroundColor: primaryAlpha(scheme, 12) }]}>
        <SymbolView name={icon as never} tintColor={colors.primary} size={18} />
      </View>
      <Text variant="bodyMedium" style={styles.linkLabel}>
        {label}
      </Text>
      <SymbolView name={'chevron.right' as never} tintColor={colors.textSecondary} size={14} />
    </Pressable>
  );
}

export default function GroupAdminScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const groupId = resolveRouteParam(params.id) ?? '';
  const { user } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const { colors } = useThemeTokens();

  const { group, members, currentCycle, loading, refetch } = useGroup(groupId);
  const { contributions, paidCount, refetch: refetchContributions } = useContributions(currentCycle?.id);
  const [actionLoading, setActionLoading] = useState(false);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const memberByUserId = useMemo(() => {
    const map = new Map<string, MemberWithProfile>();
    (members as MemberWithProfile[]).forEach((m) => map.set(m.user_id, m));
    return map;
  }, [members]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('admin.groupAdminTitle') });
  }, [navigation, t]);

  const isAdmin = group ? isGroupAdmin(group, user?.id) : false;

  if (loading || !group) {
    return (
      <Screen contentStyle={styles.content}>
        <ActivityIndicator color={colors.primary} size="large" style={styles.loader} />
      </Screen>
    );
  }

  if (!isAdmin) {
    return (
      <Screen contentStyle={styles.content}>
        <Text variant="bodyMedium">{t('admin.groupAdminDenied')}</Text>
      </Screen>
    );
  }

  const amount = group.contribution_amount;
  const totalCount = contributions.length;
  const pendingCount = Math.max(0, totalCount - paidCount);
  const allPaid = totalCount > 0 && pendingCount === 0;
  const isActive = group.status === 'active';
  const isDraft = group.status === 'draft';
  const paystackReady = isPaystackConfigured();

  const overdue = !!(currentCycle?.due_date && new Date(currentCycle.due_date) < new Date() && pendingCount > 0);
  const health: GroupHealth = !isActive
    ? 'healthy'
    : overdue
      ? 'critical'
      : pendingCount > 0
        ? 'attention'
        : 'healthy';

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchContributions()]);
    setRefreshing(false);
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

  const handlePayout = () => {
    if (!currentCycle) return;
    Alert.alert(
      paystackReady ? 'Send payout?' : 'Record payout sent?',
      paystackReady
        ? 'Send this cycle’s pot to the collector via Paystack. They need a verified bank account in Profile.'
        : 'Mark this cycle as paid out to the collector (use when you sent cash or bank transfer).',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: paystackReady ? 'Send payout' : 'Record sent',
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
    setActionLoading(true);
    try {
      const next = await advanceCycle(groupId);
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

  const cycleActionLabel =
    currentCycle?.status === 'paid_out'
      ? 'Advance to next cycle'
      : allPaid
        ? paystackReady
          ? 'Send payout'
          : 'Record payout sent'
        : null;
  const onCycleAction = currentCycle?.status === 'paid_out' ? handleAdvance : handlePayout;

  return (
    <Screen contentStyle={styles.content} refreshing={refreshing} onRefresh={refresh}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text variant="headingMedium" style={styles.title}>
            {group.name}
          </Text>
          <StatusBadge status={group.status} />
        </View>
        <View style={styles.badgeRow}>
          {isActive ? <GroupHealthBadge health={health} /> : null}
          <Text variant="bodySmall" color="secondary">
            {formatNaira(amount)} · {members.length}/{group.max_members} members
          </Text>
        </View>
      </View>

      <AdminKpiGrid
        items={[
          {
            label: t('admin.kpiReceived'),
            value: formatNaira(paidCount * amount),
            accent: 'success',
          },
          {
            label: t('admin.kpiOutstanding'),
            value: formatNaira(pendingCount * amount),
            accent: pendingCount > 0 ? 'warning' : 'default',
            onPress: () => router.push(`/(tabs)/ledger?groupId=${groupId}&status=pending` as Href),
          },
          {
            label: t('admin.kpiMembers'),
            value: `${members.length}/${group.max_members}`,
          },
          {
            label: isActive ? t('admin.cycleLabel', { n: group.current_cycle }) : t('admin.cycleLabel', { n: 0 }),
            value: isActive ? `of ${group.max_members}` : '—',
          },
        ]}
      />

      {isDraft ? (
        <Card variant="standard" style={styles.draftCard}>
          <Text variant="bodyLarge" style={styles.draftTitle}>
            Group not started yet
          </Text>
          <Text variant="bodySmall" color="secondary" style={styles.draftBody}>
            Invite members and start cycle 1 from the group setup screen.
          </Text>
          <Button title={t('admin.manageGroup')} onPress={() => router.push(`/group/${groupId}` as Href)} />
        </Card>
      ) : null}

      {isActive && currentCycle ? (
        <View style={styles.cycleBlock}>
          <CycleProgress paidCount={paidCount} totalCount={totalCount} cycle={currentCycle} />
          {cycleActionLabel ? (
            <Button title={cycleActionLabel} onPress={onCycleAction} loading={actionLoading} />
          ) : null}
          <CyclePaymentsPanel
            cycle={currentCycle}
            contributions={contributions}
            memberByUserId={memberByUserId}
            currentUserId={user?.id}
            isAdmin={isAdmin}
            paidCount={paidCount}
            onPay={(cid) => router.push(`/group/${groupId}/pay?contributionId=${cid}` as Href)}
            onRecordPayment={handleRecordPayment}
            recordingId={recordingId}
          />
        </View>
      ) : null}

      <Card variant="standard" style={styles.linksCard}>
        <AdminLinkRow
          icon="slider.horizontal.3"
          label={t('admin.manageGroup')}
          onPress={() => router.push(`/group/${groupId}` as Href)}
        />
        <AdminLinkRow
          icon="list.bullet.rectangle"
          label={t('admin.viewLedger')}
          onPress={() => router.push(`/(tabs)/ledger?groupId=${groupId}` as Href)}
        />
        <AdminLinkRow
          icon="arrow.up.circle.fill"
          label={t('nav.payouts')}
          onPress={() => router.push(`/(tabs)/payouts?groupId=${groupId}` as Href)}
        />
        <AdminLinkRow
          icon="person.badge.plus"
          label={t('admin.inviteMembers')}
          onPress={() => router.push(`/group/${groupId}/invite` as Href)}
        />
        <AdminLinkRow
          icon="calendar"
          label={t('admin.viewSchedule')}
          onPress={() => router.push(`/group/${groupId}/schedule` as Href)}
          isLast
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  loader: { marginTop: spacing.xl },
  header: { marginBottom: spacing.md },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  title: { flex: 1, fontWeight: '800' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  draftCard: { marginTop: spacing.md },
  draftTitle: { fontWeight: '700', marginBottom: 4 },
  draftBody: { marginBottom: spacing.md, lineHeight: 20 },
  cycleBlock: { marginTop: spacing.md },
  linksCard: { marginTop: spacing.md, paddingVertical: spacing.xs },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkLabel: { flex: 1, fontWeight: '600' },
});
