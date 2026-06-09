import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Card, Text } from '@/components/ui';
import { useTranslation } from '@/contexts/LanguageContext';
import type { AdminDashboardStats } from '@/lib/admin/admin-dashboard';
import { formatNaira } from '@/lib/format';
import { spacing, useThemeTokens } from '@/theme';

interface Props {
  stats: AdminDashboardStats;
  inactiveOnly: boolean;
  earningsTotal: number;
  completedGroups: number;
}

function MetaStat({
  label,
  value,
  hint,
  accent,
  onPress,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: string;
  onPress?: () => void;
}) {
  const body = (
    <View style={styles.metaCell}>
      <Text variant="caption" color="secondary" numberOfLines={1}>
        {label}
      </Text>
      <Text
        variant="bodyMedium"
        style={{ fontWeight: '700', ...(accent ? { color: accent } : null) }}
        numberOfLines={1}>
        {value}
      </Text>
      {hint ? (
        <Text variant="caption" color="muted" numberOfLines={1}>
          {hint}
        </Text>
      ) : null}
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.85 : 1 }]}>
      {body}
    </Pressable>
  );
}

export function AdminDashboardOverview({
  stats,
  inactiveOnly,
  earningsTotal,
  completedGroups,
}: Props) {
  const { t, tp } = useTranslation();
  const router = useRouter();
  const { colors } = useThemeTokens();

  const primaryLabel = inactiveOnly ? t('admin.totalCollected') : t('admin.kpiReceived');
  const secondaryLabel = inactiveOnly ? t('admin.kpiEarnings') : t('admin.kpiOutstanding');

  return (
    <Card variant="elevated" style={styles.card}>
      {inactiveOnly ? (
        <View style={[styles.statusBanner, { backgroundColor: colors.surfaceSecondary }]}>
          <Text variant="caption" color="secondary" style={styles.statusText}>
            {t('admin.noActiveGroupsShort')}
          </Text>
        </View>
      ) : null}

      <View style={styles.summaryRow}>
        <View style={styles.summaryCell}>
          <Text variant="caption" color="secondary">
            {primaryLabel}
          </Text>
          <Text variant="headingMedium" color="success" style={styles.summaryValue}>
            {formatNaira(stats.contributionsReceived)}
          </Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryCell}>
          <Text variant="caption" color="secondary">
            {secondaryLabel}
          </Text>
          <Text variant="headingMedium" style={styles.summaryValue}>
            {formatNaira(inactiveOnly ? earningsTotal : stats.contributionsOutstanding)}
          </Text>
        </View>
      </View>

      <View style={[styles.metaRow, { borderTopColor: colors.border }]}>
        <MetaStat
          label={t('admin.kpiGroups')}
          value={String(stats.totalGroups)}
          hint={
            inactiveOnly
              ? completedGroups > 0
                ? tp(completedGroups, 'admin.kpiCompletedCount_one', 'admin.kpiCompletedCount_other', {
                    count: completedGroups,
                  })
                : undefined
              : stats.activeGroups > 0
                ? tp(stats.activeGroups, 'admin.kpiActiveCount_one', 'admin.kpiActiveCount_other', {
                    count: stats.activeGroups,
                  })
                : undefined
          }
        />
        <MetaStat label={t('admin.kpiMembers')} value={String(stats.totalMembers)} />
        <MetaStat
          label={t('admin.kpiPending')}
          value={String(stats.pendingConfirmations)}
          accent={stats.pendingConfirmations > 0 ? colors.warning : undefined}
          onPress={() => router.push('/(tabs)/ledger?status=pending' as Href)}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { paddingVertical: 0, paddingHorizontal: 0, overflow: 'hidden', marginBottom: spacing.md },
  statusBanner: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  statusText: { fontWeight: '600' },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  summaryCell: { flex: 1, alignItems: 'center', gap: 2 },
  summaryValue: { fontWeight: '800' },
  summaryDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', marginVertical: 2 },
  metaRow: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  metaCell: { flex: 1, alignItems: 'center', gap: 2, paddingHorizontal: spacing.xs },
  metaValue: { fontWeight: '700' },
});
