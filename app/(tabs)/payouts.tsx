import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { InitialsAvatar } from '@/components/admin/InitialsAvatar';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { Badge, Card, Text } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { fetchPayoutQueue, type PayoutQueueItem } from '@/lib/admin/payout-queue';
import { formatDate, formatNaira } from '@/lib/format';
import { spacing, useThemeTokens } from '@/theme';

export default function AdminPayoutsScreen() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useThemeTokens();
  const params = useLocalSearchParams<{ groupId?: string }>();
  const groupId = typeof params.groupId === 'string' ? params.groupId : undefined;
  const [items, setItems] = useState<PayoutQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) {
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      setItems(await fetchPayoutQueue(user.id, { groupId }));
    } catch {
      setItems([]);
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
    const ready = items.filter((i) => i.allPaid).length;
    const due = items.reduce((sum, i) => sum + i.amount, 0);
    return { ready, due };
  }, [items]);

  if (loading && !items.length) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const scopedName = groupId ? items[0]?.groupName : undefined;

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
        {scopedName ?? t('admin.payoutsIntro')}
      </Text>

      {items.length ? (
        <Card variant="elevated" style={styles.summary}>
          <View style={styles.summaryCell}>
            <Text variant="caption" color="secondary">
              {t('admin.readyPayout')}
            </Text>
            <Text variant="headingMedium" color="success" style={styles.summaryValue}>
              {totals.ready}
            </Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryCell}>
            <Text variant="caption" color="secondary">
              {t('admin.kpiPayouts')}
            </Text>
            <Text variant="headingMedium" style={styles.summaryValue}>
              {formatNaira(totals.due)}
            </Text>
          </View>
        </Card>
      ) : null}

      {!items.length ? (
        <EmptyState title={t('nav.payouts')} message={t('admin.payoutsEmpty')} />
      ) : (
        items.map((item) => (
          <Pressable
            key={item.cycleId}
            onPress={() => router.push(`/group/${item.groupId}`)}
            style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}>
            <Card variant="elevated" style={styles.card}>
              <View style={styles.header}>
                <View style={styles.recipientRow}>
                  <InitialsAvatar name={item.recipientName} size={44} />
                  <View style={styles.recipientCopy}>
                    <Text variant="bodyLarge" style={styles.recipient} numberOfLines={1}>
                      {item.recipientName}
                    </Text>
                    <Text variant="caption" color="secondary" numberOfLines={1}>
                      {item.groupName} · {t('admin.cycleLabel', { n: item.cycleNumber })}
                    </Text>
                  </View>
                </View>
                <Badge
                  label={item.allPaid ? t('admin.readyPayout') : t('admin.collecting')}
                  variant={item.allPaid ? 'success' : 'warning'}
                />
              </View>

              <View style={styles.footer}>
                <View>
                  <Text variant="caption" color="muted">
                    {t('admin.groupProgress', { paid: item.paidCount, total: item.memberCount })}
                  </Text>
                  {item.dueDate ? (
                    <Text variant="caption" color="muted">
                      {formatDate(item.dueDate)}
                    </Text>
                  ) : null}
                </View>
                <Text variant="headingMedium" style={styles.amount}>
                  {formatNaira(item.amount)}
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
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  summaryCell: { flex: 1, alignItems: 'center', gap: 2 },
  summaryValue: { fontWeight: '800' },
  summaryDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', marginVertical: 2 },
  card: { marginBottom: spacing.sm },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  recipientRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  recipientCopy: { flex: 1, gap: 2 },
  recipient: { fontWeight: '700' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  amount: { fontWeight: '800' },
});
