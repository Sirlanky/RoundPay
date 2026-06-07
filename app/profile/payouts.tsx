import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import { useCallback, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Badge, Button, Card, Text } from '@/components/ui';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { formatDate, formatNaira } from '@/lib/format';
import {
  getUserPayouts,
  payoutStatusLabel,
  payoutStatusVariant,
  summarizePayouts,
  type UserPayoutRow,
} from '@/lib/user-payouts';
import { spacing, useThemeTokens } from '@/theme';

export default function PayoutHistoryScreen() {
  const { user, canSave } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const { colors } = useThemeTokens();

  const [rows, setRows] = useState<UserPayoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('profile.payoutHistory') });
  }, [navigation, t]);

  const load = useCallback(async () => {
    if (!user) {
      setRows([]);
      setLoadError('');
      setLoading(false);
      return;
    }
    try {
      setLoadError('');
      const data = await getUserPayouts(user.id);
      setRows(data);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not load payouts');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const summary = summarizePayouts(rows);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const openRow = (row: UserPayoutRow) => {
    router.push(`/group/${row.groupId}`);
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <Screen
      safeArea={false}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentStyle={styles.content}>
      {!canSave ? (
        <Card variant="standard" style={styles.controlCard}>
          <Text variant="bodyMedium" style={{ fontWeight: '700' }}>
            {t('groups.notInApp')}
          </Text>
          <Text variant="bodySmall" color="secondary" style={styles.controlBody}>
            {t('payouts.notInAppBody')}
          </Text>
          <Button
            title={t('common.goToProfile')}
            onPress={() => router.push('/(tabs)/profile')}
            style={styles.controlBtn}
          />
        </Card>
      ) : null}

      {rows.length > 0 ? (
        <Card variant="elevated" style={styles.summaryCard}>
          <Text variant="bodyMedium" style={{ fontWeight: '700', marginBottom: spacing.md }}>
            {t('payouts.summary')}
          </Text>
          <View style={styles.summaryRow}>
            <View style={styles.stat}>
              <Text variant="headingSmall" color="accent">
                {formatNaira(summary.totalReceived)}
              </Text>
              <Text variant="caption" color="secondary">
                {t('payouts.totalReceived')}
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <Text variant="headingSmall">{summary.completed}</Text>
              <Text variant="caption" color="secondary">
                {t('payouts.completed')}
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <Text variant="headingSmall">{summary.pending}</Text>
              <Text variant="caption" color="secondary">
                {t('payouts.pending')}
              </Text>
            </View>
          </View>
        </Card>
      ) : null}

      {loadError ? (
        <Text variant="bodySmall" color="error" style={styles.error}>
          {loadError}
        </Text>
      ) : null}

      {rows.length === 0 && !loadError ? (
        <EmptyState title={t('payouts.empty')} message={t('payouts.emptyMessage')} />
      ) : (
        <View style={styles.list}>
          {rows.map((row) => (
            <Pressable
              key={row.id}
              onPress={() => openRow(row)}
              style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}>
              <Card variant="elevated" style={styles.rowCard}>
                <View style={styles.rowTop}>
                  <View style={styles.rowMain}>
                    <Text variant="bodyLarge" style={{ fontWeight: '600' }}>
                      {row.groupName}
                    </Text>
                    <Text variant="caption" color="secondary">
                      {t('payouts.cycle', { n: row.cycleNumber })}
                      {row.dueDate ? ` · ${formatDate(row.dueDate)}` : ''}
                    </Text>
                  </View>
                  <Badge label={payoutStatusLabel(row.status)} variant={payoutStatusVariant(row.status)} />
                </View>
                <View style={styles.rowBottom}>
                  <Text variant="headingSmall" color="accent">
                    {formatNaira(row.amount)}
                  </Text>
                  <Text variant="caption" color="secondary">
                    {t('payouts.received', { date: formatDate(row.created_at) })}
                  </Text>
                </View>
                <Text variant="caption" color="secondary" style={styles.tapHint}>
                  {t('payouts.tapGroup')}
                </Text>
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingTop: spacing.sm, paddingBottom: spacing.xl },
  controlCard: { marginBottom: spacing.md },
  controlBody: { marginBottom: spacing.sm, lineHeight: 20 },
  controlBtn: { marginBottom: 0 },
  summaryCard: { marginBottom: spacing.md, paddingVertical: spacing.md },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 36 },
  error: { marginBottom: spacing.md, lineHeight: 20 },
  list: { gap: spacing.xs },
  rowCard: { marginBottom: spacing.sm },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  rowMain: { flex: 1 },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  tapHint: { marginTop: spacing.sm },
});
