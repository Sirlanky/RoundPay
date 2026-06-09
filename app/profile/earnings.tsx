import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { Card, Text } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate, formatNaira } from '@/lib/format';
import {
  fetchAdminEarningsHistory,
  type AdminEarningEntry,
  type AdminEarningsHistory,
} from '@/lib/money-summary';
import { spacing, useThemeTokens } from '@/theme';

export default function AdminEarningsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { colors } = useThemeTokens();
  const [data, setData] = useState<AdminEarningsHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) {
      setData({ totalEarned: 0, entries: [] });
      setLoading(false);
      return;
    }
    try {
      setData(await fetchAdminEarningsHistory(user.id));
    } catch {
      setData({ totalEarned: 0, entries: [] });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading && !data) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const entries = data?.entries ?? [];

  return (
    <Screen safeArea={false} refreshing={refreshing} onRefresh={onRefresh} contentStyle={styles.content}>
      <Card variant="elevated" style={styles.totalCard}>
        <Text variant="caption" color="secondary">
          Total
        </Text>
        <Text variant="headingMedium" color="success" style={styles.total}>
          {formatNaira(data?.totalEarned ?? 0)}
        </Text>
      </Card>

      {!entries.length ? (
        <EmptyState title="My earnings" message="No admin fees recorded yet." />
      ) : (
        entries.map((entry) => (
          <EarningRow
            key={entry.id}
            entry={entry}
            onPress={() => router.push(`/group/${entry.groupId}` as Href)}
          />
        ))
      )}
    </Screen>
  );
}

function EarningRow({ entry, onPress }: { entry: AdminEarningEntry; onPress: () => void }) {
  const { colors } = useThemeTokens();

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
      <Card variant="standard" style={styles.rowCard}>
        <Avatar name={entry.recipientName} size={40} />
        <View style={styles.rowBody}>
          <Text variant="bodyMedium" style={styles.rowTitle}>
            {entry.groupName}
          </Text>
          <Text variant="caption" color="secondary">
            Cycle {entry.cycleNumber} · {entry.recipientName} · {entry.feePercent}%
          </Text>
          {entry.earnedAt ? (
            <Text variant="caption" color="muted">
              {formatDate(entry.earnedAt)}
            </Text>
          ) : null}
        </View>
        <Text variant="bodyLarge" style={{ color: colors.success, fontWeight: '700' }}>
          {formatNaira(entry.feeAmount)}
        </Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingTop: spacing.sm, paddingBottom: spacing.xl },
  totalCard: { marginBottom: spacing.md, alignItems: 'center', paddingVertical: spacing.md },
  total: { fontWeight: '800', marginTop: 4 },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  rowBody: { flex: 1, gap: 2 },
  rowTitle: { fontWeight: '600' },
});
