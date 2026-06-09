import { StyleSheet, View } from 'react-native';
import { Card, Text } from '@/components/ui';
import { formatNaira } from '@/lib/format';
import type { MemberMoneySummary } from '@/lib/money-summary';
import { spacing, useThemeTokens } from '@/theme';

interface Props {
  accountName: string;
  summary: MemberMoneySummary;
}

export function MyMoneySummaryCard({ accountName, summary }: Props) {
  const { colors } = useThemeTokens();

  return (
    <Card variant="elevated" style={styles.card}>
      <Text variant="bodyMedium" style={styles.title}>
        {accountName}
      </Text>

      <View style={styles.row}>
        <View style={styles.cell}>
          <Text variant="caption" color="secondary">
            Paid in
          </Text>
          <Text variant="headingSmall" color="accent">
            {formatNaira(summary.paidIn)}
          </Text>
          <Text variant="caption" color="muted">
            {summary.paidCount}
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.cell}>
          <Text variant="caption" color="secondary">
            Collected
          </Text>
          <Text variant="headingSmall">{formatNaira(summary.collected)}</Text>
          <Text variant="caption" color="muted" style={styles.hint}>
            {String(summary.payoutCount)}
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.cell}>
          <Text variant="caption" color="secondary">
            Balance
          </Text>
          <Text
            variant="headingSmall"
            style={{ color: summary.netPosition >= 0 ? colors.textPrimary : colors.textSecondary }}>
            {summary.netPosition >= 0 ? '+' : '−'}
            {formatNaira(Math.abs(summary.netPosition))}
          </Text>
          {summary.pendingToReceive > 0 ? (
            <Text variant="caption" color="muted">
              {formatNaira(summary.pendingToReceive)} pending
            </Text>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md, paddingVertical: spacing.md },
  title: { fontWeight: '700', marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  cell: { flex: 1, alignItems: 'center', gap: 2 },
  hint: { fontSize: 10, textAlign: 'center' },
  divider: { width: 1, alignSelf: 'stretch', marginVertical: spacing.xs },
});
