import { Pressable, StyleSheet, View } from 'react-native';
import { Card, StatusBadge, Text } from '@/components/ui';
import { formatNaira, frequencyLabel } from '@/lib/format';
import type { HomeDashboardData } from '@/lib/home-dashboard';
import { primaryAlpha, spacing, useThemeTokens } from '@/theme';

interface Props {
  data: HomeDashboardData;
  onPress: () => void;
}

export function HomeHeroCard({ data, onPress }: Props) {
  const { colors, scheme, radius } = useThemeTokens();
  const { primaryGroup, memberCount, totalPot, paidCount, contributions, isOverdue } = data;

  if (!primaryGroup) return null;

  const isDraft = primaryGroup.status === 'draft';
  const isActive = primaryGroup.status === 'active';
  const roundLabel =
    primaryGroup.current_cycle > 0
      ? `Round ${primaryGroup.current_cycle}`
      : isDraft
        ? 'Not started yet'
        : 'Not available yet';

  const pendingCount = contributions.filter((c) => c.status === 'pending').length;
  const progress = contributions.length > 0 ? paidCount / contributions.length : 0;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.96 : 1 }]}>
      <Card variant="elevated" style={styles.card}>
        <View style={styles.topRow}>
          <Text variant="headingMedium" numberOfLines={1} style={styles.groupName}>
            {primaryGroup.name}
          </Text>
          <StatusBadge status={primaryGroup.status} />
        </View>

        <Text variant="display" color="accent" style={styles.amount}>
          {formatNaira(primaryGroup.contribution_amount)}
        </Text>
        <Text variant="bodySmall" color="secondary" style={styles.frequency}>
          {frequencyLabel(primaryGroup.frequency)} · {memberCount}/{primaryGroup.max_members} members ·{' '}
          {roundLabel}
        </Text>

        {totalPot != null ? (
          <View style={[styles.potRow, { backgroundColor: primaryAlpha(scheme, 12), borderRadius: radius.md }]}>
            <Text variant="caption" color="secondary">
              Total pot
            </Text>
            <Text variant="headingSmall" color="accent">
              {formatNaira(totalPot)}
            </Text>
          </View>
        ) : null}

        {isActive && contributions.length > 0 ? (
          <View style={styles.progressWrap}>
            <View style={[styles.barBg, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.barFill,
                  { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: colors.primary },
                ]}
              />
            </View>
            <Text variant="caption" color="secondary" style={styles.progressText}>
              {paidCount} of {contributions.length} paid this round
              {isOverdue && pendingCount > 0 ? ' · Overdue' : ''}
            </Text>
          </View>
        ) : null}

        {isDraft ? (
          <Text variant="caption" color="secondary" style={styles.draftHint}>
            {memberCount} of {primaryGroup.max_members} members joined · Tap for details
          </Text>
        ) : null}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  groupName: { flex: 1 },
  amount: { marginTop: spacing.sm },
  frequency: { marginTop: 4 },
  potRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    padding: spacing.md,
  },
  progressWrap: { marginTop: spacing.md },
  barBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  progressText: { marginTop: spacing.sm },
  draftHint: { marginTop: spacing.md },
});
