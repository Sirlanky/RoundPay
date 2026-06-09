import { Pressable, StyleSheet, View } from 'react-native';
import { Card, Text } from '@/components/ui';
import { formatNaira } from '@/lib/format';
import type { AdminFeeSummary } from '@/lib/money-summary';
import { spacing, useThemeTokens } from '@/theme';

interface Props {
  summary: AdminFeeSummary;
  onGroupPress?: (groupId: string) => void;
}

export function AdminFeeEarningsCard({ summary, onGroupPress }: Props) {
  const { colors } = useThemeTokens();

  if (summary.totalEarned <= 0 && !summary.byGroup.length) return null;

  return (
    <Card variant="standard" style={styles.card}>
      <View style={styles.header}>
        <Text variant="bodyMedium" style={styles.title}>
          Admin fees
        </Text>
        <Text variant="headingSmall" color="success">
          {formatNaira(summary.totalEarned)}
        </Text>
      </View>

      {summary.byGroup.map((g, i) => (
        <Pressable
          key={g.groupId}
          disabled={!onGroupPress}
          onPress={() => onGroupPress?.(g.groupId)}
          style={({ pressed }) => [
            styles.groupRow,
            i < summary.byGroup.length - 1 && {
              borderBottomColor: colors.border,
              borderBottomWidth: StyleSheet.hairlineWidth,
            },
            { opacity: pressed && onGroupPress ? 0.85 : 1 },
          ]}>
          <View style={{ flex: 1 }}>
            <Text variant="bodyMedium" style={styles.groupName}>
              {g.groupName}
            </Text>
            <Text variant="caption" color="secondary">
              {g.feePercent}% · {g.completedCycles} cycle{g.completedCycles === 1 ? '' : 's'}
            </Text>
          </View>
          <Text variant="bodyMedium" style={styles.groupAmount}>
            {formatNaira(g.earned)}
          </Text>
        </Pressable>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md, paddingVertical: spacing.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  title: { fontWeight: '700' },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  groupName: { fontWeight: '600' },
  groupAmount: { fontWeight: '700' },
});
