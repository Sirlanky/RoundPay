import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui';
import { useTranslation } from '@/contexts/LanguageContext';
import { formatDate } from '@/lib/format';
import { cyclePositionLabel, isLastCycle } from '@/lib/cycle-utils';
import type { Cycle } from '@/lib/types';
import { primaryAlpha, spacing, useThemeTokens } from '@/theme';

interface Props {
  paidCount: number;
  totalCount: number;
  cycle: Cycle | null;
  memberCount?: number;
}

export function CycleProgress({ paidCount, totalCount, cycle, memberCount = totalCount }: Props) {
  const { t, tp } = useTranslation();
  const { colors, scheme } = useThemeTokens();
  const progress = totalCount > 0 ? paidCount / totalCount : 0;
  const finalRotation = cycle ? isLastCycle(cycle.cycle_number, memberCount) : false;

  return (
    <Card>
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {cycle ? cyclePositionLabel(cycle.cycle_number, memberCount) : t('cycle.currentRound')}
        </Text>
        {finalRotation ? (
          <View style={[styles.finalBadge, { backgroundColor: primaryAlpha(scheme, 12) }]}>
            <Text style={[styles.finalBadgeText, { color: colors.primary }]}>{t('cycle.finalTurn')}</Text>
          </View>
        ) : null}
      </View>
      {cycle ? (
        <>
          <Text style={[styles.recipient, { color: colors.textSecondary }]}>
            {t('cycle.collectorLine', { name: cycle.recipient?.full_name ?? t('messages.memberFallback') })}
          </Text>
          <Text style={[styles.due, { color: colors.textSecondary }]}>
            {t('cycle.dueLine', { date: formatDate(cycle.due_date) })}
          </Text>
          <View style={[styles.barBg, { backgroundColor: colors.border }]}>
            <View style={[styles.barFill, { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: colors.primary }]} />
          </View>
          <Text style={[styles.progressText, { color: colors.textPrimary }]}>
            {tp(totalCount, 'plural.contributionPaid_one', 'plural.contributionPaid_other', {
              paid: paidCount,
              total: totalCount,
            })}
          </Text>
        </>
      ) : (
        <Text style={{ color: colors.textSecondary }}>{t('cycle.noActiveRound')}</Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  title: { fontSize: 16, fontWeight: '600', flex: 1 },
  finalBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 999 },
  finalBadgeText: { fontSize: 11, fontWeight: '700' },
  recipient: { fontSize: 14 },
  due: { fontSize: 13, marginTop: 2, marginBottom: spacing.md },
  barBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: 13, marginTop: spacing.sm, fontWeight: '500' },
});
