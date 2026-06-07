import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/Card';
import { useColorScheme } from '@/components/useColorScheme';
import Colors, { brand } from '@/constants/Colors';
import type { HomeDashboardData } from '@/lib/home-dashboard';
import { spacing } from '@/constants/theme';

interface Props {
  data: HomeDashboardData;
  onViewPayments: () => void;
}

export function HomeStatusStrip({ data, onViewPayments }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
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
          borderColor: brand.primary + '44',
          backgroundColor: brand.primary + '08',
        }}>
        {lines.map((line) => (
          <Text key={line} style={[styles.line, { color: colors.text }]}>
            {line}
          </Text>
        ))}
        <Text style={[styles.link, { color: brand.primary }]}>View payments →</Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md, padding: spacing.md },
  line: { fontSize: 14, fontWeight: '500', lineHeight: 20 },
  link: { fontSize: 13, fontWeight: '600', marginTop: spacing.xs },
});
