import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { Card, Input, StatusBadge, Text } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { fetchAdminLedger, type LedgerRow } from '@/lib/admin/ledger';
import { formatDate, formatNaira } from '@/lib/format';
import type { ContributionStatus } from '@/lib/types';
import { spacing, useThemeTokens } from '@/theme';

type Filter = ContributionStatus | 'all';

function isFilter(value: string | undefined): value is Filter {
  return value === 'all' || value === 'pending' || value === 'paid' || value === 'failed';
}

export default function AdminLedgerScreen() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useThemeTokens();
  const params = useLocalSearchParams<{ groupId?: string; status?: string }>();
  const groupId = typeof params.groupId === 'string' ? params.groupId : undefined;
  const [allRows, setAllRows] = useState<LedgerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>(isFilter(params.status) ? params.status : 'all');
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    if (!user?.id) {
      setAllRows([]);
      setLoading(false);
      return;
    }
    try {
      setAllRows(await fetchAdminLedger(user.id, { status: 'all', groupId }));
    } catch {
      setAllRows([]);
    } finally {
      setLoading(false);
    }
  }, [groupId, user?.id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load])
  );

  const totals = useMemo(() => {
    let collected = 0;
    let outstanding = 0;
    for (const row of allRows) {
      if (row.status === 'paid') collected += row.amount;
      else if (row.status === 'pending') outstanding += row.amount;
    }
    return { collected, outstanding };
  }, [allRows]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allRows.filter((row) => {
      if (filter !== 'all' && row.status !== filter) return false;
      if (q && !row.memberName.toLowerCase().includes(q) && !row.groupName.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [allRows, filter, query]);

  const filters: { id: Filter; label: string }[] = useMemo(
    () => [
      { id: 'all', label: t('admin.filterAll') },
      { id: 'pending', label: t('admin.filterPending') },
      { id: 'paid', label: t('admin.filterPaid') },
      { id: 'failed', label: t('admin.filterFailed') },
    ],
    [t]
  );

  if (loading && !allRows.length) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <Screen
      safeArea={false}
      tabBarInset
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
      }}
      contentStyle={styles.content}>
      <Card variant="elevated" style={styles.summary}>
        <View style={styles.summaryCell}>
          <Text variant="caption" color="secondary">
            {t('admin.kpiReceived')}
          </Text>
          <Text variant="headingMedium" color="success" style={styles.summaryValue}>
            {formatNaira(totals.collected)}
          </Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryCell}>
          <Text variant="caption" color="secondary">
            {t('admin.kpiOutstanding')}
          </Text>
          <Text variant="headingMedium" style={styles.summaryValue}>
            {formatNaira(totals.outstanding)}
          </Text>
        </View>
      </Card>

      <Input
        label={t('admin.searchLabel')}
        placeholder={t('admin.searchPlaceholder')}
        value={query}
        onChangeText={setQuery}
      />

      <View style={styles.filters}>
        {filters.map((item) => {
          const active = filter === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => setFilter(item.id)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.primary : colors.surface,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}>
              <Text variant="caption" style={{ color: active ? colors.textInverse : colors.textPrimary }}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {!rows.length ? (
        <EmptyState title={t('nav.ledger')} message={t('admin.ledgerEmpty')} />
      ) : (
        rows.map((row) => (
          <Pressable
            key={row.id}
            onPress={() => router.push(`/group/${row.groupId}`)}
            style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}>
            <Card variant="standard" style={styles.row}>
              <Avatar name={row.memberName} uri={row.memberAvatarUrl} />
              <View style={styles.rowBody}>
                <Text variant="bodyMedium" style={styles.member} numberOfLines={1}>
                  {row.memberName}
                </Text>
                <Text variant="caption" color="secondary" numberOfLines={1}>
                  {row.groupName} · {t('admin.cycleLabel', { n: row.cycleNumber })}
                </Text>
              </View>
              <View style={styles.rowRight}>
                <Text variant="bodyLarge" style={styles.amount}>
                  {formatNaira(row.amount)}
                </Text>
                <StatusBadge status={row.status} />
                <Text variant="caption" color="muted" style={styles.date}>
                  {row.status === 'paid' && row.paidAt
                    ? formatDate(row.paidAt)
                    : row.dueDate
                      ? formatDate(row.dueDate)
                      : '—'}
                </Text>
              </View>
            </Card>
          </Pressable>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingTop: spacing.sm, paddingBottom: spacing.xl },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  summaryCell: { flex: 1, alignItems: 'center', gap: 2 },
  summaryValue: { fontWeight: '800' },
  summaryDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', marginVertical: 2 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  rowBody: { flex: 1, gap: 2 },
  member: { fontWeight: '700' },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  amount: { fontWeight: '800' },
  date: { marginTop: 0 },
});
