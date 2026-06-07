import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/Card';
import { useColorScheme } from '@/components/useColorScheme';
import Colors, { brand } from '@/constants/Colors';
import { formatDate, formatNaira } from '@/lib/format';
import { nextPayoutRecipientName } from '@/lib/home-dashboard';
import type { HomeDashboardData } from '@/lib/home-dashboard';
import { spacing } from '@/constants/theme';

interface Props {
  data: HomeDashboardData;
}

export function HomeNextPayoutCard({ data }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { primaryGroup, currentCycle, totalPot } = data;

  if (!primaryGroup || primaryGroup.status !== 'active' || !currentCycle) return null;

  const payoutName = nextPayoutRecipientName(currentCycle, data.members);
  if (!payoutName) return null;

  const potAmount = totalPot ?? primaryGroup.contribution_amount * data.memberCount;

  return (
    <Card elevated style={styles.card}>
      <View style={styles.row}>
        <View style={styles.body}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Next payout</Text>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {payoutName}
          </Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {potAmount > 0 ? formatNaira(potAmount) : ''}
            {currentCycle.due_date
              ? `${potAmount > 0 ? ' · ' : ''}Due ${formatDate(currentCycle.due_date)}`
              : ''}
          </Text>
        </View>
        <Text style={styles.emoji} accessibilityLabel="Celebration">
          🎊
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.md, marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  body: { flex: 1 },
  label: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  name: { fontSize: 17, fontWeight: '700', marginTop: 2 },
  meta: { fontSize: 13, marginTop: 4 },
  emoji: { fontSize: 40, lineHeight: 44 },
});
