import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card, Input, StatusBadge, Text } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { fetchAdminLedger, type LedgerRow } from '@/lib/admin/ledger';
import { formatDate, formatNaira } from '@/lib/format';
import type { ContributionStatus } from '@/lib/types';
import { spacing, useThemeTokens } from '@/theme';

type Filter = ContributionStatus | 'all';

export default function AdminLedgerScreen() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useThemeTokens();
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    if (!user?.id) {
      setRows([]);
      setLoading(false);
      return;
    }
    try {
      setRows(await fetchAdminLedger(user.id, { status: filter, query: query.trim() || undefined }));
    } finally {
      setLoading(false);
    }
  }, [filter, query, user?.id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load])
  );

  const filters: { id: Filter; label: string }[] = useMemo(
    () => [
      { id: 'all', label: t('admin.filterAll') },
      { id: 'pending', label: t('admin.filterPending') },
      { id: 'paid', label: t('admin.filterPaid') },
      { id: 'failed', label: t('admin.filterFailed') },
    ],
    [t]
  );

  if (loading && !rows.length) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <Screen
      tabBarInset
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
      }}
      contentStyle={styles.content}>
      <Text variant="bodyMedium" color="secondary" style={styles.intro}>
        {t('admin.ledgerIntro')}
      </Text>

      <Input
        label={t('admin.searchLabel')}
        placeholder={t('admin.searchPlaceholder')}
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={() => void load()}
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
        <Card variant="standard">
          <Text variant="bodyMedium">{t('admin.ledgerEmpty')}</Text>
        </Card>
      ) : (
        rows.map((row) => (
          <Pressable
            key={row.id}
            onPress={() => router.push(`/group/${row.groupId}`)}
            style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}>
            <Card variant="standard" style={styles.row}>
              <View style={styles.rowTop}>
                <Text variant="bodyMedium" style={styles.member}>
                  {row.memberName}
                </Text>
                <StatusBadge status={row.status} />
              </View>
              <Text variant="caption" color="secondary">
                {row.groupName} · {t('admin.cycleLabel', { n: row.cycleNumber })}
              </Text>
              <View style={styles.rowBottom}>
                <Text variant="bodyLarge" style={styles.amount}>
                  {formatNaira(row.amount)}
                </Text>
                <Text variant="caption" color="muted">
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
  intro: { marginBottom: spacing.md, lineHeight: 22 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
  },
  row: { marginBottom: spacing.sm },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  member: { fontWeight: '700', flex: 1 },
  rowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  amount: { fontWeight: '800' },
});
