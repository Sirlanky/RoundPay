import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui';
import { formatDate } from '@/lib/format';
import type { Cycle } from '@/lib/types';
import { spacing, useThemeTokens } from '@/theme';

interface Props {
  paidCount: number;
  totalCount: number;
  cycle: Cycle | null;
}

export function CycleProgress({ paidCount, totalCount, cycle }: Props) {
  const { colors } = useThemeTokens();
  const progress = totalCount > 0 ? paidCount / totalCount : 0;

  return (
    <Card>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Current cycle</Text>
      {cycle ? (
        <>
          <Text style={[styles.recipient, { color: colors.textSecondary }]}>
            Collector: {cycle.recipient?.full_name ?? 'Member'}
          </Text>
          <Text style={[styles.due, { color: colors.textSecondary }]}>Due {formatDate(cycle.due_date)}</Text>
          <View style={[styles.barBg, { backgroundColor: colors.border }]}>
            <View style={[styles.barFill, { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: colors.primary }]} />
          </View>
          <Text style={[styles.progressText, { color: colors.textPrimary }]}>
            {paidCount} of {totalCount} contributions paid
          </Text>
        </>
      ) : (
        <Text style={{ color: colors.textSecondary }}>No active cycle yet</Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: '600', marginBottom: spacing.sm },
  recipient: { fontSize: 14 },
  due: { fontSize: 13, marginTop: 2, marginBottom: spacing.md },
  barBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: 13, marginTop: spacing.sm, fontWeight: '500' },
});
