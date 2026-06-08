import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AdminActivityFeed } from '@/components/admin/AdminActivityFeed';
import { AdminKpiGrid } from '@/components/admin/AdminKpiGrid';
import { GroupHealthBadge } from '@/components/admin/GroupHealthBadge';
import { HomeSectionTitle } from '@/components/home/HomeSectionTitle';
import { Button, Card, Text } from '@/components/ui';
import { useTranslation } from '@/contexts/LanguageContext';
import { fetchAdminDashboard, type AdminDashboardData } from '@/lib/admin/admin-dashboard';
import { formatDate, formatNaira } from '@/lib/format';
import { spacing } from '@/theme';

interface Props {
  userId: string;
}

const MAX_HEALTH_CARDS = 3;

export function HomeManagingSection({ userId }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const [data, setData] = useState<AdminDashboardData | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await fetchAdminDashboard(userId));
    } catch {
      setData(null);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const stats = data?.stats;
  const groups = data?.groups ?? [];

  return (
    <View style={styles.wrap}>
      <HomeSectionTitle title={t('admin.dashboardTitle')} />

      {stats ? (
        <AdminKpiGrid
          items={[
            {
              label: t('admin.kpiReceived'),
              value: formatNaira(stats.contributionsReceived),
              accent: 'success',
              onPress: () => router.push('/(tabs)/ledger?status=paid' as Href),
            },
            {
              label: t('admin.kpiOutstanding'),
              value: formatNaira(stats.contributionsOutstanding),
              accent: stats.contributionsOutstanding > 0 ? 'warning' : 'default',
              onPress: () => router.push('/(tabs)/ledger?status=pending' as Href),
            },
            {
              label: t('admin.kpiPending'),
              value: String(stats.pendingConfirmations),
              accent: stats.pendingConfirmations > 0 ? 'warning' : 'default',
              onPress: () => router.push('/(tabs)/ledger?status=pending' as Href),
            },
            {
              label: t('admin.kpiPayouts'),
              value: String(stats.upcomingPayouts),
              onPress: () => router.push('/(tabs)/payouts' as Href),
            },
          ]}
        />
      ) : null}

      {groups.length ? (
        <View style={styles.health}>
          {groups.slice(0, MAX_HEALTH_CARDS).map((item) => (
            <Pressable
              key={item.group.id}
              onPress={() => router.push(`/group/${item.group.id}/admin` as Href)}
              style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}>
              <Card variant="standard" style={styles.groupCard}>
                <View style={styles.groupHeader}>
                  <Text variant="bodyLarge" style={styles.groupName}>
                    {item.group.name}
                  </Text>
                  <GroupHealthBadge health={item.health} />
                </View>
                <Text variant="bodySmall" color="secondary">
                  {t('admin.groupProgress', { paid: item.paidCount, total: item.memberCount })}
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
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button
          title={t('admin.viewLedger')}
          variant="secondary"
          onPress={() => router.push('/(tabs)/ledger' as Href)}
          style={styles.actionBtn}
        />
        <Button
          title={t('nav.payouts')}
          variant="secondary"
          onPress={() => router.push('/(tabs)/payouts' as Href)}
          style={styles.actionBtn}
        />
      </View>

      {data?.recentActivity?.length ? (
        <AdminActivityFeed
          activities={data.recentActivity}
          title={t('admin.recentActivity')}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  health: { marginTop: spacing.md, gap: spacing.sm },
  groupCard: { marginBottom: 0 },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  groupName: { flex: 1, fontWeight: '700' },
  meta: { marginTop: 4 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  actionBtn: { flex: 1, marginVertical: 0 },
});
