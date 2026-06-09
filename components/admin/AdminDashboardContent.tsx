import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AdminActivityFeed } from '@/components/admin/AdminActivityFeed';
import { AdminDashboardOverview } from '@/components/admin/AdminDashboardOverview';
import { AdminGroupList } from '@/components/admin/AdminGroupList';
import { AdminQuickActions } from '@/components/admin/AdminQuickActions';
import { AdminWalletCard } from '@/components/admin/AdminWalletCard';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { Button, Section, Text } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminMode } from '@/contexts/AdminModeContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { fetchAdminDashboard, type AdminDashboardData } from '@/lib/admin/admin-dashboard';
import { getProfileNameParts } from '@/lib/profile-setup';
import { fetchAdminFeeSummary, type AdminFeeSummary } from '@/lib/money-summary';
import { spacing, useThemeTokens } from '@/theme';

interface Props {
  userId: string;
  standalone?: boolean;
}

export function AdminDashboardContent({ userId, standalone = false }: Props) {
  const { profile } = useAuth();
  const { adminGroupCount } = useAdminMode();
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useThemeTokens();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [feeSummary, setFeeSummary] = useState<AdminFeeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      const dashboard = await fetchAdminDashboard(userId);
      setData(dashboard);
    } catch {
      setData(null);
      setLoadError(true);
    }

    try {
      setFeeSummary(await fetchAdminFeeSummary(userId));
    } catch {
      setFeeSummary({ totalEarned: 0, byGroup: [] });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const stats = data?.stats;
  const groups = data?.groups ?? [];
  const managedGroupCount = Math.max(stats?.totalGroups ?? 0, adminGroupCount, groups.length);
  const hasAdminGroups = managedGroupCount > 0;
  const completedGroups = groups.filter((g) => g.group.status === 'completed').length;
  const inactiveOnly = hasAdminGroups && (stats?.activeGroups ?? 0) === 0;
  const { firstName, lastName } = getProfileNameParts(profile);
  const holderName = [firstName, lastName].filter(Boolean).join(' ').toUpperCase() || undefined;

  const body = loading && !data ? (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  ) : loadError && !data ? (
    <View style={styles.emptyWrap}>
      <EmptyState
        title={t('admin.dashboardLoadErrorTitle')}
        message={t('admin.dashboardLoadErrorMessage')}
      />
      <Button title={t('admin.tryAgain')} onPress={() => void load()} style={styles.emptyBtn} />
    </View>
  ) : !hasAdminGroups ? (
    <View style={styles.emptyWrap}>
      <EmptyState title={t('admin.noGroupsYet')} message={t('admin.noGroupsHint')} />
      <Button
        title={t('admin.createGroup')}
        onPress={() => router.push('/group/create' as Href)}
        style={styles.emptyBtn}
      />
    </View>
  ) : (
    <View style={standalone ? styles.standalone : styles.wrap}>
      {standalone && stats ? (
        <AdminDashboardOverview
          stats={stats}
          inactiveOnly={inactiveOnly}
          earningsTotal={feeSummary?.totalEarned ?? 0}
          completedGroups={completedGroups}
        />
      ) : (
        <AdminWalletCard
          stats={{
            groupCount: stats?.totalGroups ?? adminGroupCount,
            activeGroups: stats?.activeGroups ?? 0,
            pendingCount: stats?.pendingConfirmations ?? 0,
            outstanding: stats?.contributionsOutstanding ?? 0,
            received: stats?.contributionsReceived ?? 0,
            adminFeesEarned: feeSummary?.totalEarned ?? 0,
            completedGroups,
            holderName,
          }}
        />
      )}

      <Section title={t('admin.moreOperations')} compact>
        <AdminQuickActions earningsTotal={feeSummary?.totalEarned} />
      </Section>

      {groups.length ? (
        <AdminGroupList groups={groups} showInactiveBadge={!standalone} />
      ) : (
        <Text variant="bodySmall" color="secondary" style={styles.noActiveGroups}>
          {t('admin.noActiveGroupsHint')}
        </Text>
      )}

      {data?.recentActivity?.length ? (
        <AdminActivityFeed activities={data.recentActivity} title={t('admin.recentActivity')} />
      ) : null}
    </View>
  );

  if (standalone) {
    return (
      <Screen
        safeArea={false}
        tabBarInset
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentStyle={styles.screenContent}>
        {body}
      </Screen>
    );
  }

  return body;
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  standalone: { gap: spacing.md },
  screenContent: { paddingTop: spacing.sm, paddingBottom: spacing.xl },
  center: { paddingVertical: spacing.xl, alignItems: 'center' },
  emptyWrap: { gap: spacing.md },
  emptyBtn: { marginVertical: 0 },
  noActiveGroups: { marginBottom: spacing.md, lineHeight: 20 },
});
