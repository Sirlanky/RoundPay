import { Pressable, StyleSheet, Text } from 'react-native';
import { Card } from '@/components/ui';
import type { HomeDashboardData } from '@/lib/home-dashboard';
import { primaryAlpha, spacing, useThemeTokens } from '@/theme';

interface Props {
  data: HomeDashboardData;
  onViewPayments: () => void;
}

export function HomeStatusStrip({ data, onViewPayments }: Props) {
  const { colors, scheme } = useThemeTokens();
  const { primaryGroup, userContributionStatus, isAdmin, adminPendingCount, isOverdue } = data;

  if (!primaryGroup || primaryGroup.status !== 'active') return null;

  const lines: string[] = [];

  if (userContributionStatus === 'paid') {
    lines.push('Your payment: Paid');
  } else if (userContributionStatus === 'pending') {
    lines.push(`Your payment: Pending${isOverdue ? ' · Overdue' : ''}`);
  }

  if (isAdmin && adminPendingCount > 0) {
    lines.push(`${adminPendingCount} payment${adminPendingCount === 1 ? '' : 's'} awaiting record`);
  }

  if (!lines.length) return null;

  return (
    <Pressable onPress={onViewPayments} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
      <Card
        style={{
          ...styles.card,
          borderColor: primaryAlpha(scheme, 32),
          backgroundColor: primaryAlpha(scheme, 8),
        }}>
        {lines.map((line) => (
          <Text key={line} style={[styles.line, { color: colors.textPrimary }]}>
            {line}
          </Text>
        ))}
        <Text style={[styles.link, { color: colors.primary }]}>View payments →</Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md, padding: spacing.md },
  line: { fontSize: 14, fontWeight: '500', lineHeight: 20 },
  link: { fontSize: 13, fontWeight: '600', marginTop: spacing.xs },
});
