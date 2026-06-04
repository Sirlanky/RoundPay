import { StyleSheet, Text, View } from 'react-native';
import Colors, { brand } from '@/constants/Colors';
import { formatDate } from '@/lib/format';
import type { Cycle } from '@/lib/types';
import { useColorScheme } from './useColorScheme';

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
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>Current Cycle</Text>
      {cycle ? (
        <>
          <Text style={[styles.recipient, { color: colors.textSecondary }]}>
            Collector: {cycle.recipient?.full_name ?? 'Member'} · Due {formatDate(cycle.due_date)}
          </Text>
          <View style={[styles.barBg, { backgroundColor: colors.border }]}>
            <View style={[styles.barFill, { width: `${progress * 100}%`, backgroundColor: brand.primary }]} />
          </View>
          <Text style={[styles.progressText, { color: colors.text }]}>
            {paidCount} of {totalCount} contributions paid
          </Text>
        </>
      ) : (
        <Text style={{ color: colors.textSecondary }}>No active cycle</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 12, padding: 16, borderWidth: 1, marginBottom: 16 },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  recipient: { fontSize: 13, marginBottom: 12 },
  barBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: 13, marginTop: 8 },
});
