import { StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { useColorScheme } from './useColorScheme';
import Colors, { brand } from '@/constants/Colors';
import { formatDate } from '@/lib/format';
import type { Cycle } from '@/lib/types';
import { spacing } from '@/constants/theme';

interface Props {
  paidCount: number;
  totalCount: number;
  cycle: Cycle | null;
}

export function CycleProgress({ paidCount, totalCount, cycle }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const progress = totalCount > 0 ? paidCount / totalCount : 0;

  return (
    <Card>
      <Text style={[styles.title, { color: colors.text }]}>Current cycle</Text>
      {cycle ? (
        <>
          <Text style={[styles.recipient, { color: colors.textSecondary }]}>
            Collector: {cycle.recipient?.full_name ?? 'Member'}
          </Text>
          <Text style={[styles.due, { color: colors.textSecondary }]}>Due {formatDate(cycle.due_date)}</Text>
          <View style={[styles.barBg, { backgroundColor: colors.border }]}>
            <View style={[styles.barFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
          </View>
          <Text style={[styles.progressText, { color: colors.text }]}>
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
  barFill: { height: '100%', borderRadius: 4, backgroundColor: brand.primary },
  progressText: { fontSize: 13, marginTop: spacing.sm, fontWeight: '500' },
});
