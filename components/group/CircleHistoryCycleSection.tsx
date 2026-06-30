import { StyleSheet, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { CycleHistoryRow } from '@/components/group/CycleHistoryRow';
import { Card, StatusBadge, Text } from '@/components/ui';
import { formatDayAndTime, formatNaira } from '@/lib/format';
import type { GroupHistoryCycle } from '@/lib/group-cycle-detail';
import type { CycleContributionRow } from '@/lib/group-cycle-detail';
import { spacing, useThemeTokens } from '@/theme';

interface Props {
  cycle: GroupHistoryCycle;
  adminId: string;
  adminFeePercent: number;
  currentUserId?: string;
  youLabel: string;
  perMemberLabel: string;
}

export function CircleHistoryCycleSection({
  cycle,
  adminId,
  adminFeePercent,
  currentUserId,
  youLabel,
  perMemberLabel,
}: Props) {
  const { colors } = useThemeTokens();

  return (
    <Card variant="standard" style={styles.card}>
      <CycleHistoryRow cycle={cycle} adminId={adminId} adminFeePercent={adminFeePercent} isLast />
      {cycle.contributions.length ? (
        <View style={[styles.contribBlock, { borderTopColor: colors.border }]}>
          <Text variant="caption" color="secondary" style={styles.contribLabel}>
            {formatNaira(cycle.contributions[0]?.amount ?? 0)} {perMemberLabel}
          </Text>
          {cycle.contributions.map((row, i) => (
            <ContributionRow
              key={row.id}
              row={row}
              isYou={row.userId === currentUserId}
              isLast={i === cycle.contributions.length - 1}
              youLabel={youLabel}
            />
          ))}
        </View>
      ) : null}
    </Card>
  );
}

function ContributionRow({
  row,
  isYou,
  isLast,
  youLabel,
}: {
  row: CycleContributionRow;
  isYou: boolean;
  isLast: boolean;
  youLabel: string;
}) {
  const { colors } = useThemeTokens();

  return (
    <View
      style={[
        styles.contribRow,
        !isLast && {
          borderBottomColor: colors.border,
          borderBottomWidth: StyleSheet.hairlineWidth,
        },
      ]}>
      <Avatar name={row.memberName} uri={row.memberAvatarUrl} size={36} />
      <View style={styles.contribBody}>
        <Text variant="bodyMedium" style={styles.contribName}>
          {row.memberName}
          {isYou ? ` (${youLabel})` : ''}
        </Text>
        <Text variant="caption" color="secondary">
          {row.status === 'paid' && row.paidAt
            ? formatDayAndTime(row.paidAt)
            : formatDayAndTime(row.createdAt)}
        </Text>
      </View>
      <View style={styles.contribRight}>
        <Text variant="bodyMedium" style={styles.contribAmount}>
          {formatNaira(row.amount)}
        </Text>
        <StatusBadge status={row.status} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm, paddingVertical: spacing.xs },
  contribBlock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  contribLabel: { marginBottom: spacing.sm, fontWeight: '600' },
  contribRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  contribBody: { flex: 1, gap: 2 },
  contribName: { fontWeight: '600' },
  contribRight: { alignItems: 'flex-end', gap: 4 },
  contribAmount: { fontWeight: '700' },
});
