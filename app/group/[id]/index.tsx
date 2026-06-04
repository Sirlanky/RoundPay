import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { CycleProgress } from '@/components/CycleProgress';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import Colors, { brand } from '@/constants/Colors';
import { formatNaira, frequencyLabel } from '@/lib/format';
import { advanceCycle, startGroup } from '@/lib/groups';
import { triggerPayout } from '@/lib/paystack';
import { useContributions } from '@/hooks/useContributions';
import { useGroup } from '@/hooks/useGroup';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { group, members, currentCycle, loading, error, refetch } = useGroup(id);
  const { contributions, paidCount, allPaid, loading: contribLoading } = useContributions(currentCycle?.id);
  const [actionLoading, setActionLoading] = useState(false);
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const isAdmin = group?.admin_id === user?.id;
  const myContribution = contributions.find((c) => c.user_id === user?.id);
  const canPay = myContribution?.status === 'pending' && group?.status === 'active';

  const shareInvite = async () => {
    if (!group) return;
    const link = `ajoesusu://join/${group.invite_code}`;
    await Share.share({
      message: `Join my Ajo group "${group.name}"! Code: ${group.invite_code}\n${link}`,
    });
  };

  const handleStart = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await startGroup(id);
      await refetch();
      Alert.alert('Started', 'Cycle 1 has begun. All members can now contribute.');
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
      Alert.alert('Payout sent', 'Funds transferred to the cycle recipient.');
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
      Alert.alert(next ? 'Next cycle started' : 'Group completed', next ? 'Cycle advanced.' : 'All members have collected.');
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    }
    setActionLoading(false);
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={brand.primary} />
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

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.name, { color: colors.text }]}>{group.name}</Text>
      <Text style={[styles.amount, { color: brand.primary }]}>{formatNaira(group.contribution_amount)}</Text>
      <Text style={[styles.meta, { color: colors.textSecondary }]}>
        {frequencyLabel(group.frequency)} · {group.status} · Invite {group.invite_code}
      </Text>

      <Pressable onPress={shareInvite} style={[styles.shareBtn, { borderColor: brand.primary }]}>
        <Text style={{ color: brand.primary, fontWeight: '600' }}>Share invite code</Text>
      </Pressable>

      {!contribLoading && (
        <CycleProgress paidCount={paidCount} totalCount={contributions.length} cycle={currentCycle} />
      )}

      <Text style={[styles.section, { color: colors.text }]}>Members ({members.length}/{group.max_members})</Text>
      {members.map((m) => (
        <View key={m.id} style={[styles.memberRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.memberOrder, { color: brand.primary }]}>#{m.rotation_order}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontWeight: '500' }}>
              {(m as { profile?: { full_name?: string } }).profile?.full_name ?? 'Member'}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
              {m.role} {m.has_collected ? '· Collected' : ''}
            </Text>
          </View>
        </View>
      ))}

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
        <Button title="Send payout to collector" onPress={handlePayout} loading={actionLoading} />
      )}

      {isAdmin && currentCycle?.status === 'paid_out' && group.status === 'active' && (
        <Button title="Start next cycle" onPress={handleAdvance} loading={actionLoading} variant="secondary" />
      )}

      {contributions.length > 0 && (
        <>
          <Text style={[styles.section, { color: colors.text }]}>Contributions</Text>
          {contributions.map((c) => (
            <View key={c.id} style={[styles.memberRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={{ color: colors.text, flex: 1 }}>Member</Text>
              <Text
                style={{
                  color: c.status === 'paid' ? colors.success : colors.textSecondary,
                  fontWeight: '600',
                  textTransform: 'capitalize',
                }}>
                {c.status}
              </Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 24, fontWeight: '700' },
  amount: { fontSize: 28, fontWeight: '800', marginTop: 8 },
  meta: { fontSize: 14, marginTop: 4, marginBottom: 16 },
  shareBtn: { borderWidth: 1.5, borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 8 },
  section: { fontSize: 17, fontWeight: '600', marginTop: 20, marginBottom: 10 },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  memberOrder: { fontSize: 16, fontWeight: '700', width: 28 },
});
