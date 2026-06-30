import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { MyMoneySummaryCard } from '@/components/MyMoneySummaryCard';
import { PlatformIcon } from '@/components/navigation/PlatformIcon';
import { Button, Card, Input, StatusBadge, Text } from '@/components/ui';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminMode } from '@/contexts/AdminModeContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { formatDay, formatDayAndTime, formatNaira } from '@/lib/format';
import {
  fetchMemberMoneySummary,
  type MemberMoneySummary,
} from '@/lib/money-summary';
import {
  getUserContributions,
  type UserContributionRow,
} from '@/lib/user-contributions';
import { primaryAlpha, spacing, useThemeTokens } from '@/theme';

export default function ContributionsScreen() {
  const { user, profile, canSave } = useAuth();
  const { loading: adminLoading } = useAdminMode();
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ groupId?: string }>();
  const filterGroupId = typeof params.groupId === 'string' ? params.groupId : undefined;
  const { colors, scheme, radius } = useThemeTokens();

  const [rows, setRows] = useState<UserContributionRow[]>([]);
  const [moneySummary, setMoneySummary] = useState<MemberMoneySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) {
      setRows([]);
      setMoneySummary(null);
      setLoadError('');
      setLoading(false);
      return;
    }
    try {
      setLoadError('');
      const [data, summary] = await Promise.all([
        getUserContributions(user.id),
        fetchMemberMoneySummary(user.id),
      ]);

      setRows(data);
      setMoneySummary(summary);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not load contributions');
      setRows([]);
      setMoneySummary(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Reload when the signed-in account changes (not only when the tab regains focus).
  useEffect(() => {
    setRows([]);
    setLoading(true);
    void load();
  }, [user?.id, load]);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) void load();
    }, [user?.id, load])
  );

  const accountName =
    profile?.full_name?.trim() ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim() ||
    'You';
  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (filterGroupId && row.groupId !== filterGroupId) return false;
      if (!q) return true;
      if (row.groupName.toLowerCase().includes(q)) return true;
      if (`cycle ${row.cycleNumber}`.includes(q) || String(row.cycleNumber).includes(q)) return true;
      if (row.status.includes(q)) return true;
      if (formatNaira(row.amount).toLowerCase().includes(q)) return true;
      return false;
    });
  }, [rows, query, filterGroupId]);

  const filterGroupName = useMemo(
    () => (filterGroupId ? rows.find((r) => r.groupId === filterGroupId)?.groupName : undefined),
    [rows, filterGroupId]
  );

  const searchActive = searchOpen || query.trim().length > 0;

  const toggleSearch = () => {
    setSearchOpen((open) => !open);
  };

  if (loading || adminLoading) {
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
      onRefresh={onRefresh}
      contentStyle={styles.content}>
      {!canSave ? (
        <Card variant="standard" style={styles.controlCard}>
          <Text variant="bodyMedium" style={{ fontWeight: '700' }}>
            {t('groups.notInApp')}
          </Text>
          <Text variant="bodySmall" color="secondary" style={styles.controlBody}>
            {t('contributions.notInAppBody')}
          </Text>
          <Button
            title={t('common.goToProfile')}
            onPress={() => router.push('/(tabs)/profile')}
            style={styles.controlBtn}
          />
        </Card>
      ) : null}

      {filterGroupName ? (
        <Text variant="bodyMedium" color="secondary" style={styles.filterTitle}>
          {t('contributions.filteredTitle', { group: filterGroupName })}
        </Text>
      ) : null}

      {moneySummary ? (
        <MyMoneySummaryCard accountName={accountName} summary={moneySummary} />
      ) : null}

      {rows.length > 0 ? (
        <>
          <View style={styles.listHeader}>
            <Text variant="bodyMedium" style={styles.listTitle}>
              Payments
            </Text>
            <Pressable
              onPress={toggleSearch}
              accessibilityRole="button"
              accessibilityLabel={t('admin.searchLabel')}
              style={({ pressed }) => [
                styles.searchBtn,
                {
                  backgroundColor: primaryAlpha(scheme, searchActive ? 16 : 8),
                  borderColor: searchActive ? colors.primary : colors.border,
                  borderRadius: radius.md,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}>
              <PlatformIcon
                name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
                size={22}
                color={searchActive ? colors.primary : colors.textPrimary}
              />
              {query.trim() ? (
                <View style={[styles.searchDot, { backgroundColor: colors.primary }]} />
              ) : null}
            </Pressable>
          </View>
          {searchOpen ? (
            <Input
              variant="search"
              placeholder={t('contributions.searchPlaceholder')}
              value={query}
              onChangeText={setQuery}
              containerStyle={styles.search}
              autoFocus
            />
          ) : null}
        </>
      ) : null}

      {loadError ? (
        <Text variant="bodySmall" color="error" style={styles.error}>
          {loadError}
        </Text>
      ) : null}

      {rows.length === 0 && !loadError ? (
        <EmptyState title={t('contributions.empty')} message={t('contributions.emptyMessage')} />
      ) : filteredRows.length === 0 ? (
        <EmptyState title={t('contributions.empty')} message={t('contributions.searchEmpty')} />
      ) : (
        <View style={styles.list}>
          {filteredRows.map((row) => (
            <Card key={row.id} variant="elevated" style={styles.rowCard}>
              <View style={styles.rowTop}>
                <View style={styles.rowMain}>
                  <Text variant="bodyLarge" style={{ fontWeight: '600' }}>
                    {row.groupName}
                  </Text>
                  <Text variant="caption" color="secondary">
                    {accountName} · Cycle {row.cycleNumber}
                    {row.dueDate ? ` · Due ${formatDay(row.dueDate)}` : ''}
                  </Text>
                </View>
                <StatusBadge status={row.status} />
              </View>
              <View style={styles.rowBottom}>
                <Text variant="headingSmall">{formatNaira(row.amount)}</Text>
                <Text variant="caption" color="secondary">
                  {row.status === 'paid' && row.paid_at
                    ? `Paid ${formatDayAndTime(row.paid_at)}`
                    : `Created ${formatDayAndTime(row.created_at)}`}
                </Text>
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingTop: 8, paddingBottom: spacing.xl },
  controlCard: { marginBottom: spacing.md },
  controlBody: { marginBottom: spacing.sm, lineHeight: 20 },
  controlBtn: { marginBottom: 0 },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  listTitle: { fontWeight: '700', flex: 1 },
  searchBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  search: { marginBottom: spacing.md },
  filterTitle: { marginBottom: spacing.md, lineHeight: 20 },
  error: { marginBottom: spacing.md, lineHeight: 20 },
  list: { gap: spacing.xs },
  rowCard: { marginBottom: spacing.sm },
  rowTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  rowMain: { flex: 1 },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
});
