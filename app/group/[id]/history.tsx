import { useFocusEffect, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { CircleHistoryCycleSection } from '@/components/group/CircleHistoryCycleSection';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { Button, Card, Text } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { formatNaira } from '@/lib/format';
import { fetchFullGroupHistory, type FullGroupHistory } from '@/lib/group-cycle-detail';
import { resolveRouteParam } from '@/lib/route-params';
import { spacing, useThemeTokens } from '@/theme';

export default function GroupHistoryScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const groupId = resolveRouteParam(params.id);
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useThemeTokens();

  const [history, setHistory] = useState<FullGroupHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!groupId) {
      setLoading(false);
      return;
    }
    try {
      setHistory(await fetchFullGroupHistory(groupId));
    } catch {
      setHistory(null);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load])
  );

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const cycles = history?.cycles ?? [];
  const groupName = history?.groupName ?? '';

  return (
    <Screen
      safeArea={false}
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
      }}
      contentStyle={styles.content}>
      <Text variant="display" style={styles.title}>
        {t('group.fullHistoryTitle')}
      </Text>
      {groupName ? (
        <Text variant="bodyMedium" color="secondary" style={styles.subtitle}>
          {groupName}
        </Text>
      ) : null}

      {cycles.length && history ? (
        <Card variant="elevated" style={styles.summary}>
          <View style={styles.summaryCell}>
            <Text variant="caption" color="secondary">
              {t('group.historyCycles')}
            </Text>
            <Text variant="headingMedium" style={styles.summaryValue}>
              {cycles.length}
            </Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryCell}>
            <Text variant="caption" color="secondary">
              {t('group.historyPaidOut')}
            </Text>
            <Text variant="headingMedium" color="success" style={styles.summaryValue}>
              {history.completedCycles}
            </Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryCell}>
            <Text variant="caption" color="secondary">
              {t('group.historyTotal')}
            </Text>
            <Text variant="headingMedium" style={styles.summaryValue}>
              {formatNaira(history.totalPaidOut)}
            </Text>
          </View>
        </Card>
      ) : null}

      {history && history.totalFees > 0 ? (
        <Text variant="caption" color="secondary" style={styles.feeNote}>
          {t('group.historyFeesNote', { amount: formatNaira(history.totalFees) })}
        </Text>
      ) : null}

      {!cycles.length ? (
        <EmptyState title={t('group.fullHistoryTitle')} message={t('group.historyEmpty')} />
      ) : (
        <>
          {cycles.map((cycle) => (
            <CircleHistoryCycleSection
              key={cycle.id}
              cycle={cycle}
              adminId={history!.adminId}
              adminFeePercent={history!.adminFeePercent}
              currentUserId={user?.id}
              youLabel={t('group.you')}
              perMemberLabel={t('group.perMember')}
            />
          ))}
          <Button
            title={t('nav.contributions')}
            variant="secondary"
            onPress={() => router.push(`/(tabs)/contributions?groupId=${groupId}` as Href)}
            style={styles.contribBtn}
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingTop: spacing.sm, paddingBottom: spacing.xl },
  title: { marginBottom: spacing.xs },
  subtitle: { marginBottom: spacing.lg, lineHeight: 22 },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  summaryCell: { flex: 1, alignItems: 'center', gap: 2 },
  summaryValue: { fontWeight: '800' },
  summaryDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', marginVertical: 2 },
  feeNote: { marginBottom: spacing.md, lineHeight: 18 },
  contribBtn: { marginTop: spacing.sm },
});
