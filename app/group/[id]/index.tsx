import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CycleProgress } from '@/components/CycleProgress';
import { DraftGroupPanel } from '@/components/DraftGroupPanel';
import { InviteCodeCard } from '@/components/InviteCodeCard';
import { Screen } from '@/components/Screen';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import Colors, { brand } from '@/constants/Colors';
import { formatNaira, frequencyLabel } from '@/lib/format';
import { messageFromGroupError } from '@/lib/group-errors';
import { memberDisplayName, type MemberWithProfile } from '@/lib/members';
import { advanceCycle, startGroup } from '@/lib/groups';
import { triggerPayout } from '@/lib/paystack';
import { useContributions } from '@/hooks/useContributions';
import { useGroup } from '@/hooks/useGroup';
import { spacing } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

const MIN_MEMBERS_TO_START = 2;

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, buildMode } = useAuth();
  const { group, members, currentCycle, loading, error, refetch } = useGroup(id);
  const { contributions, paidCount, loading: contribLoading } = useContributions(currentCycle?.id);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const memberByUserId = useMemo(() => {
    const map = new Map<string, MemberWithProfile>();
    (members as MemberWithProfile[]).forEach((m) => map.set(m.user_id, m));
    return map;
  }, [members]);

  const isAdmin = group?.admin_id === user?.id;
  const isDraft = group?.status === 'draft';
  const canStartDraft = isDraft && isAdmin && members.length >= MIN_MEMBERS_TO_START;
  const myContribution = contributions.find((c) => c.user_id === user?.id);
  const canPay = myContribution?.status === 'pending' && group?.status === 'active';

  const handleStart = async () => {
    if (!id) return;
    if (members.length < MIN_MEMBERS_TO_START) {
      Alert.alert(
        'Not enough members',
        `You need at least ${MIN_MEMBERS_TO_START} members to start. Share the invite code below.`
      );
      return;
    }
    if (buildMode || !user) {
      Alert.alert('Sign in required', 'Sign in to start the group and save progress.');
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
    setActionLoading(true);
    try {
      await triggerPayout(currentCycle.id);
      await refetch();
      Alert.alert('Payout sent', 'Funds sent to this cycle’s collector.');
    } catch (e) {
      Alert.alert('Error', messageFromGroupError(e));
    }
    setActionLoading(false);
  };

  const handleAdvance = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const next = await advanceCycle(id);
      await refetch();
      Alert.alert(
        next ? 'Next cycle' : 'Complete',
        next ? 'A new collection round has started.' : 'Everyone has collected. Group finished.'
      );
    } catch (e) {
      Alert.alert('Error', messageFromGroupError(e));
    }
    setActionLoading(false);
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={brand.primary} size="large" />
      </View>
    );
  }

  if (error || !group) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.error }}>{error ?? 'Group not found'}</Text>
        <Button title="Go back" onPress={() => router.back()} variant="secondary" style={{ marginTop: spacing.lg }} />
      </View>
    );
  }

  const potSize = formatNaira(group.contribution_amount * members.length);
  const projectedPot = formatNaira(group.contribution_amount * group.max_members);

  return (
    <Screen
      safeArea={false}
      contentStyle={styles.content}
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
      }}>
      <Card style={styles.hero}>
        <View style={styles.heroTop}>
          <Text style={[styles.name, { color: colors.text }]}>{group.name}</Text>
          <StatusBadge status={group.status} />
        </View>
        <Text style={[styles.amount, { color: brand.primary }]}>{formatNaira(group.contribution_amount)}</Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          {frequencyLabel(group.frequency)}
          {isDraft ? ` · up to ${projectedPot} pot` : ` · Pot ${potSize}`}
        </Text>
        {isDraft ? (
          <InviteCodeCard groupName={group.name} inviteCode={group.invite_code} />
        ) : null}
      </Card>

      {isDraft ? <DraftGroupPanel memberCount={members.length} maxMembers={group.max_members} isAdmin={!!isAdmin} /> : null}

      {!isDraft && !contribLoading && (
        <CycleProgress paidCount={paidCount} totalCount={contributions.length} cycle={currentCycle} />
      )}

      <Text style={[styles.section, { color: colors.text }]}>
        Members ({members.length}/{group.max_members})
      </Text>
      {(members as MemberWithProfile[]).map((m) => {
        const isCollector = currentCycle?.recipient_id === m.user_id;
        const isYou = m.user_id === user?.id;
        return (
          <View key={m.id} style={[styles.memberRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.orderBadge, { backgroundColor: brand.primary + '22' }]}>
              <Text style={{ color: brand.primary, fontWeight: '700' }}>{m.rotation_order}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '600' }}>
                {memberDisplayName(m)}
                {isYou ? ' (you)' : ''}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                {m.role === 'admin' ? 'Admin' : 'Member'}
                {m.has_collected ? ' · Collected' : ''}
                {isCollector ? ' · Collecting this cycle' : ''}
              </Text>
            </View>
          </View>
        );
      })}

      {!isDraft && contributions.length > 0 && (
        <>
          <Text style={[styles.section, { color: colors.text }]}>This cycle</Text>
          {contributions.map((c) => {
            const member = memberByUserId.get(c.user_id);
            return (
              <View
                key={c.id}
                style={[styles.memberRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={{ color: colors.text, flex: 1 }}>
                  {member ? memberDisplayName(member) : 'Member'}
                </Text>
                <StatusBadge status={c.status} />
              </View>
            );
          })}
        </>
      )}

      <View style={styles.actions}>
        {isDraft && isAdmin ? (
          <>
            <Button
              title="Start group"
              onPress={handleStart}
              loading={actionLoading}
              disabled={!canStartDraft || buildMode || !user}
            />
            {!canStartDraft ? (
              <Text style={[styles.actionHint, { color: colors.textSecondary }]}>
                Add {MIN_MEMBERS_TO_START - members.length} more member
                {MIN_MEMBERS_TO_START - members.length === 1 ? '' : 's'} to enable start.
              </Text>
            ) : buildMode || !user ? (
              <Text style={[styles.actionHint, { color: colors.textSecondary }]}>
                Sign in to start the group for real.
              </Text>
            ) : null}
          </>
        ) : null}

        {isDraft && !isAdmin ? (
          <Text style={[styles.actionHint, { color: colors.textSecondary }]}>
            Only the admin can start the group once enough members have joined.
          </Text>
        ) : null}

        {canPay && myContribution && (
          <Button
            title={`Pay ${formatNaira(myContribution.amount)}`}
            onPress={() => router.push(`/group/${id}/pay?contributionId=${myContribution.id}`)}
          />
        )}
        {isAdmin && currentCycle?.status === 'completed' && (
          <Button title="Send payout" onPress={handlePayout} loading={actionLoading} />
        )}
        {isAdmin && currentCycle?.status === 'paid_out' && group.status === 'active' && (
          <Button title="Start next cycle" onPress={handleAdvance} loading={actionLoading} variant="secondary" />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  content: { paddingTop: spacing.sm, paddingBottom: spacing.xl },
  hero: { marginBottom: spacing.md },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  name: { fontSize: 22, fontWeight: '700', flex: 1 },
  amount: { fontSize: 28, fontWeight: '800', marginTop: spacing.sm },
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
