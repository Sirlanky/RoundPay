import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { AdminActivityFeed } from '@/components/admin/AdminActivityFeed';
import { AdminKpiGrid } from '@/components/admin/AdminKpiGrid';
import { GroupHealthBadge } from '@/components/admin/GroupHealthBadge';
import { RoleModeSwitcher } from '@/components/layout/RoleModeSwitcher';
import { Screen } from '@/components/Screen';
import { Button, Card, Text } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { fetchAdminDashboard } from '@/lib/admin/admin-dashboard';
import type { AdminDashboardData } from '@/lib/admin/admin-dashboard';
import { formatDate, formatNaira } from '@/lib/format';
import { spacing, useThemeTokens } from '@/theme';

export default function AdminDashboardScreen() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useThemeTokens();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user?.id) {
      setData(null);
      setLoading(false);
      return;
    }
    try {
      setError('');
      setData(await fetchAdminDashboard(user.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load dashboard');
      setData(null);
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

  const stats = data?.stats;

  return (
    <Screen tabBarInset refreshing={refreshing} onRefresh={onRefresh} contentStyle={styles.content}>
      <RoleModeSwitcher />

      <Text variant="display" style={styles.title}>
        {t('admin.dashboardTitle')}
      </Text>
      <Text variant="bodyMedium" color="secondary" style={styles.subtitle}>
        {t('admin.dashboardSubtitle')}
      </Text>

      {error ? (
        <Text variant="bodySmall" color="error" style={styles.error}>
          {error}
        </Text>
      ) : null}

      {stats ? (
        <AdminKpiGrid
          items={[
            {
              label: t('admin.kpiGroups'),
              value: String(stats.totalGroups),
              hint: t('admin.kpiActiveCount', { count: stats.activeGroups }),
              onPress: () => router.push('/(tabs)/groups'),
            },
            {
              label: t('admin.kpiMembers'),
              value: String(stats.totalMembers),
            },
            {
              label: t('admin.kpiReceived'),
              value: formatNaira(stats.contributionsReceived),
              accent: 'success',
            },
            {
              label: t('admin.kpiOutstanding'),
              value: formatNaira(stats.contributionsOutstanding),
              accent: stats.contributionsOutstanding > 0 ? 'warning' : 'default',
              onPress: () => router.push('/(tabs)/ledger' as Href),
            },
            {
              label: t('admin.kpiPending'),
              value: String(stats.pendingConfirmations),
              accent: stats.pendingConfirmations > 0 ? 'warning' : 'default',
            },
            {
              label: t('admin.kpiPayouts'),
              value: String(stats.upcomingPayouts),
              onPress: () => router.push('/(tabs)/payouts' as Href),
            },
          ]}
        />
      ) : null}

      <View style={styles.actions}>
        <Button title={t('admin.createGroup')} onPress={() => router.push('/group/create')} />
        <Button
          title={t('admin.viewLedger')}
          variant="secondary"
          onPress={() => router.push('/(tabs)/ledger' as Href)}
        />
      </View>

      {data?.groups.length ? (
        <>
          <Text variant="headingSmall" style={styles.section}>
            {t('admin.groupHealth')}
          </Text>
          {data.groups.map((item) => (
            <Pressable
              key={item.group.id}
              onPress={() => router.push(`/group/${item.group.id}/admin`)}
              style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}>
              <Card variant="standard" style={styles.groupCard}>
                <View style={styles.groupHeader}>
                  <Text variant="bodyLarge" style={styles.groupName}>
                    {item.group.name}
                  </Text>
                  <GroupHealthBadge health={item.health} />
                </View>
                <Text variant="bodySmall" color="secondary">
                  {t('admin.groupProgress', {
                    paid: item.paidCount,
                    total: item.memberCount,
                  })}
                </Text>
                {item.nextPayoutName ? (
                  <Text variant="caption" color="muted" style={styles.meta}>
                    {t('admin.nextPayout', {
                      name: item.nextPayoutName,
                      date: item.dueDate ? formatDate(item.dueDate) : t('admin.dateTbd'),
                    })}
                  </Text>
                ) : null}
              </Card>
            </Pressable>
          ))}
        </>
      ) : (
        <Card variant="standard" style={styles.emptyCard}>
          <Text variant="bodyMedium">{t('admin.noGroupsYet')}</Text>
          <Text variant="bodySmall" color="secondary" style={styles.emptyHint}>
            {t('admin.noGroupsHint')}
          </Text>
          <Button
            title={t('admin.verifyIdentity')}
            variant="secondary"
            onPress={() => router.push('/profile/identity')}
            style={styles.emptyBtn}
          />
        </Card>
      )}

      <AdminActivityFeed activities={data?.recentActivity ?? []} title={t('admin.recentActivity')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingTop: spacing.sm, paddingBottom: spacing.xl },
  title: { marginBottom: spacing.xs },
  subtitle: { marginBottom: spacing.lg, lineHeight: 22 },
  error: { marginBottom: spacing.md },
  actions: { gap: spacing.sm, marginTop: spacing.lg, marginBottom: spacing.lg },
  section: { marginBottom: spacing.sm },
  groupCard: { marginBottom: spacing.sm },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  groupName: { flex: 1, fontWeight: '700' },
  meta: { marginTop: 4 },
  emptyCard: { marginTop: spacing.md, marginBottom: spacing.lg },
  emptyHint: { marginTop: spacing.sm, lineHeight: 20 },
  emptyBtn: { marginTop: spacing.md, marginBottom: 0 },
});
