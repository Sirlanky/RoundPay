import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Button, Card, StatusBadge, Text } from '@/components/ui';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { promptProfileSetupForTransfer } from '@/lib/prompt-profile-setup';
import { useTranslation } from '@/contexts/LanguageContext';
import { formatDate, formatNaira } from '@/lib/format';
import {
  getUserContributions,
  summarizeContributions,
  type UserContributionRow,
} from '@/lib/user-contributions';
import { spacing, useThemeTokens } from '@/theme';

export default function ContributionsScreen() {
  const { user, profile, canSave } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useThemeTokens();

  const [rows, setRows] = useState<UserContributionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setRows([]);
      setLoadError('');
      setLoading(false);
      return;
    }
    try {
      setLoadError('');
      const data = await getUserContributions(user.id);
      setRows(data);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not load contributions');
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

  const summary = summarizeContributions(rows);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const openRow = (row: UserContributionRow) => {
    if (row.status === 'pending') {
      if (!promptProfileSetupForTransfer(profile, router, t)) return;
      router.push(`/group/${row.groupId}/pay?contributionId=${row.id}`);
      return;
    }
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

      {rows.length > 0 ? (
        <Card variant="elevated" style={styles.summaryCard}>
          <Text variant="bodyMedium" style={{ fontWeight: '700', marginBottom: spacing.md }}>
            {t('contributions.summary')}
          </Text>
          <View style={styles.summaryRow}>
            <View style={styles.stat}>
              <Text variant="headingSmall" color="accent">
                {summary.paid}
              </Text>
              <Text variant="caption" color="secondary">
                {t('contributions.paid')}
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <Text variant="headingSmall">{summary.pending}</Text>
              <Text variant="caption" color="secondary">
                {t('contributions.pending')}
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <Text variant="headingSmall">{formatNaira(summary.totalPaidAmount)}</Text>
              <Text variant="caption" color="secondary">
                {t('contributions.totalPaid')}
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
        <EmptyState title={t('contributions.empty')} message={t('contributions.emptyMessage')} />
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
                      Cycle {row.cycleNumber}
                      {row.dueDate ? ` · Due ${formatDate(row.dueDate)}` : ''}
                    </Text>
                  </View>
                  <StatusBadge status={row.status} />
                </View>
                <View style={styles.rowBottom}>
                  <Text variant="headingSmall">{formatNaira(row.amount)}</Text>
                  <Text variant="caption" color="secondary">
                    {row.status === 'paid' && row.paid_at
                      ? `Paid ${formatDate(row.paid_at)}`
                      : `Created ${formatDate(row.created_at)}`}
                  </Text>
                </View>
                {row.status === 'pending' ? (
                  <Text variant="caption" color="accent" style={styles.actionHint}>
                    {t('contributions.tapToPay')}
                  </Text>
                ) : null}
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
  content: { paddingTop: 8, paddingBottom: spacing.xl },
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
  rowTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  rowMain: { flex: 1 },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  actionHint: { fontWeight: '600', marginTop: spacing.sm },
});
