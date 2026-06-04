import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CycleProgress } from '@/components/CycleProgress';
import { Screen } from '@/components/Screen';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import Colors, { brand } from '@/constants/Colors';
import { formatNaira, frequencyLabel } from '@/lib/format';
import { advanceCycle, startGroup } from '@/lib/groups';
import { triggerPayout } from '@/lib/paystack';
import { useContributions } from '@/hooks/useContributions';
import { useGroup } from '@/hooks/useGroup';
import type { GroupMember } from '@/lib/types';
import { spacing } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import { Share } from 'react-native';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { group, members, currentCycle, loading, error, refetch } = useGroup(id);
  const { contributions, paidCount, loading: contribLoading } = useContributions(currentCycle?.id);
  const [actionLoading, setActionLoading] = useState(false);
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const memberByUserId = useMemo(() => {
    const map = new Map<string, GroupMember>();
    members.forEach((m) => map.set(m.user_id, m));
    return map;
  }, [members]);

  const isAdmin = group?.admin_id === user?.id;
  const myContribution = contributions.find((c) => c.user_id === user?.id);
  const canPay = myContribution?.status === 'pending' && group?.status === 'active';

  const shareInvite = async () => {
    if (!group) return;
    const link = `ajoesusu://join/${group.invite_code}`;
    await Share.share({
      message: `Join "${group.name}" on Ajo Esusu!\nCode: ${group.invite_code}\n${link}`,
    });
  };

  const handleStart = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await startGroup(id);
      await refetch();
      Alert.alert('Group started', 'Cycle 1 is live. Members can pay now.');
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    }
    setActionLoading(false);
  };

  const handlePayout = async () => {
    if (!currentCycle) return;
    setActionLoading(true);
    try {
      await triggerPayout(currentCycle.id);
      await refetch();
      Alert.alert('Payout sent', 'Funds sent to this cycle’s collector.');
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
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
      Alert.alert('Error', (e as Error).message);
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
      </View>
    );
  }

  const potSize = formatNaira(group.contribution_amount * members.length);

  return (
    <Screen contentStyle={styles.content}>
      <Card style={styles.hero}>
        <View style={styles.heroTop}>
          <Text style={[styles.name, { color: colors.text }]}>{group.name}</Text>
          <StatusBadge status={group.status} />
        </View>
        <Text style={[styles.amount, { color: brand.primary }]}>{formatNaira(group.contribution_amount)}</Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          {frequencyLabel(group.frequency)} · Pot {potSize}
        </Text>
        <View style={[styles.inviteBox, { backgroundColor: colors.background }]}>
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Invite code</Text>
          <Text style={[styles.inviteCode, { color: colors.text }]}>{group.invite_code}</Text>
        </View>
        <Button title="Share invite" onPress={shareInvite} variant="secondary" />
      </Card>

      {!contribLoading && (
        <CycleProgress paidCount={paidCount} totalCount={contributions.length} cycle={currentCycle} />
      )}

      <Text style={[styles.section, { color: colors.text }]}>
        Members ({members.length}/{group.max_members})
      </Text>
      {members.map((m) => {
        const profile = (m as GroupMember & { profile?: { full_name?: string } }).profile;
        const isCollector = currentCycle?.recipient_id === m.user_id;
        return (
          <View key={m.id} style={[styles.memberRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.orderBadge, { backgroundColor: brand.primary + '22' }]}>
              <Text style={{ color: brand.primary, fontWeight: '700' }}>{m.rotation_order}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '600' }}>{profile?.full_name ?? 'Member'}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                {m.role === 'admin' ? 'Admin' : 'Member'}
                {m.has_collected ? ' · Collected' : ''}
                {isCollector ? ' · Collecting this cycle' : ''}
              </Text>
            </View>
          </View>
        );
      })}

      {contributions.length > 0 && (
        <>
          <Text style={[styles.section, { color: colors.text }]}>This cycle</Text>
          {contributions.map((c) => {
            const member = memberByUserId.get(c.user_id);
            const profile = (member as GroupMember & { profile?: { full_name?: string } })?.profile;
            return (
              <View
                key={c.id}
                style={[styles.memberRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={{ color: colors.text, flex: 1 }}>{profile?.full_name ?? 'Member'}</Text>
                <StatusBadge status={c.status} />
              </View>
            );
          })}
        </>
      )}

      <View style={styles.actions}>
        {group.status === 'draft' && isAdmin && (
          <Button title="Start group" onPress={handleStart} loading={actionLoading} />
        )}
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingTop: spacing.sm, paddingBottom: spacing.xl },
  hero: { marginBottom: spacing.md },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  name: { fontSize: 22, fontWeight: '700', flex: 1 },
  amount: { fontSize: 28, fontWeight: '800', marginTop: spacing.sm },
  meta: { fontSize: 14, marginTop: 4 },
  inviteBox: { marginTop: spacing.md, padding: spacing.md, borderRadius: 8 },
  inviteCode: { fontSize: 20, fontWeight: '800', letterSpacing: 2, marginTop: 4 },
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
  actions: { marginTop: spacing.md },
});
