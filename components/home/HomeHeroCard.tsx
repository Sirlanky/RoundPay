import { Pressable, StyleSheet, View } from 'react-native';
import { Card, StatusBadge, Text } from '@/components/ui';
import { useTranslation } from '@/contexts/LanguageContext';
import { formatNaira, frequencyLabel } from '@/lib/format';
import type { HomeDashboardData } from '@/lib/home-dashboard';
import { primaryAlpha, spacing, useThemeTokens } from '@/theme';

interface Props {
  data: HomeDashboardData;
  onPress: () => void;
}

export function HomeHeroCard({ data, onPress }: Props) {
  const { t, tp } = useTranslation();
  const { colors, scheme, radius } = useThemeTokens();
  const { primaryGroup, memberCount, totalPot } = data;

  if (!primaryGroup) return null;

  const isDraft = primaryGroup.status === 'draft';
  const isActive = primaryGroup.status === 'active';
  const roundLabel =
    primaryGroup.current_cycle > 0
      ? t('admin.cycleLabel', { n: primaryGroup.current_cycle })
      : isDraft
        ? t('home.notStartedYet')
        : t('home.notAvailableYet');

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
          {frequencyLabel(primaryGroup.frequency)} ·{' '}
          {tp(primaryGroup.max_members, 'plural.roster_one', 'plural.roster_other', {
            current: memberCount,
            max: primaryGroup.max_members,
          })}{' '}
          · {roundLabel}
        </Text>

        {totalPot != null && !isActive ? (
          <View style={[styles.potRow, { backgroundColor: primaryAlpha(scheme, 12), borderRadius: radius.md }]}>
            <Text variant="caption" color="secondary">
              {t('home.turnMoney')}
            </Text>
            <Text variant="headingSmall" color="accent">
              {formatNaira(totalPot)}
            </Text>
          </View>
        ) : null}

        {isDraft ? (
          <Text variant="caption" color="secondary" style={styles.draftHint}>
            Tap for details
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