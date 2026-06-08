import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
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
      setItems(await fetchPayoutQueue(user.id));
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

  if (loading && !items.length) {
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
        {t('admin.payoutsIntro')}
      </Text>

      {!items.length ? (
        <Card variant="standard">
          <Text variant="bodyMedium">{t('admin.payoutsEmpty')}</Text>
        </Card>
      ) : (
        items.map((item) => (
          <Pressable
            key={item.cycleId}
            onPress={() => router.push(`/group/${item.groupId}`)}
            style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}>
            <Card variant="elevated" style={styles.card}>
              <View style={styles.header}>
                <Text variant="bodyLarge" style={styles.group}>
                  {item.groupName}
                </Text>
                <Badge
                  label={item.allPaid ? t('admin.readyPayout') : t('admin.collecting')}
                  variant={item.allPaid ? 'success' : 'warning'}
                />
              </View>
              <Text variant="bodyMedium" style={styles.recipient}>
                {item.recipientName}
              </Text>
              <Text variant="caption" color="secondary">
                {t('admin.cycleLabel', { n: item.cycleNumber })}
                {item.dueDate ? ` · ${formatDate(item.dueDate)}` : ''}
              </Text>
              <Text variant="headingMedium" style={styles.amount}>
                {formatNaira(item.amount)}
              </Text>
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
  intro: { marginBottom: spacing.lg, lineHeight: 22 },
  card: { marginBottom: spacing.sm },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  group: { fontWeight: '700', flex: 1 },
  recipient: { fontWeight: '600', marginBottom: 4 },
  amount: { marginTop: spacing.sm, fontWeight: '800' },
});
