import { Pressable, StyleSheet, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { Card, StatusBadge, Text } from '@/components/ui';
import { formatDate, formatNaira } from '@/lib/format';
import type { GroupCycleHistory } from '@/lib/group-history';
import { spacing, useThemeTokens } from '@/theme';

interface Props {
  cycle: GroupCycleHistory;
  adminId: string;
  adminFeePercent: number;
  onPress?: () => void;
  isLast?: boolean;
}

export function CycleHistoryRow({ cycle: c, adminId, adminFeePercent, onPress, isLast }: Props) {
  const { colors } = useThemeTokens();
  const collected = c.payoutBadgeStatus === 'paid_out';
  const isAdmin = c.recipientId === adminId;
  const showAmount =
    collected && c.payoutAmount != null
      ? c.payoutAmount
      : !collected && c.paidCount === c.totalCount && c.totalCount > 0
        ? c.expectedNetPayout
        : null;

  const content = (
    <View
      style={[
        styles.row,
        !isLast && {
          borderBottomColor: colors.border,
          borderBottomWidth: StyleSheet.hairlineWidth,
        },
      ]}>
      <View style={[styles.cycleBadge, { backgroundColor: colors.surfaceSecondary }]}>
        <Text variant="caption" color="secondary" style={styles.cycleBadgeText}>
          #{c.cycleNumber}
        </Text>
      </View>
      <Avatar name={c.recipientName} uri={c.recipientAvatarUrl} size={36} />
      <View style={styles.body}>
        <Text variant="bodyMedium" numberOfLines={1} style={styles.name}>
          {c.recipientName}
          {isAdmin ? ' (admin)' : ''}
        </Text>
        <Text variant="caption" color="secondary">
          {c.paidCount}/{c.totalCount} paid
          {c.payoutDate ? ` · ${formatDate(c.payoutDate)}` : c.dueDate ? ` · due ${formatDate(c.dueDate)}` : ''}
          {collected && c.feeAmount > 0 ? ` · ${formatNaira(c.feeAmount)} fee` : ''}
          {collected && isAdmin && adminFeePercent > 0 && c.feeAmount === 0 ? ' · no fee (admin)' : ''}
        </Text>
      </View>
      <View style={styles.right}>
        {showAmount != null ? (
          <Text
            variant="bodyMedium"
            style={{
              ...styles.amount,
              color: collected ? colors.textPrimary : colors.textSecondary,
            }}>
            {formatNaira(showAmount)}
          </Text>
        ) : null}
        <StatusBadge status={c.payoutBadgeStatus} />
      </View>
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}>
      {content}
    </Pressable>
  );
}

export function CycleHistoryList({
  cycles,
  adminId,
  adminFeePercent,
  onCyclePress,
}: {
  cycles: GroupCycleHistory[];
  adminId: string;
  adminFeePercent: number;
  onCyclePress?: (cycleId: string) => void;
}) {
  return (
    <Card variant="standard" style={styles.list}>
      {cycles.map((c, i) => (
        <CycleHistoryRow
          key={c.id}
          cycle={c}
          adminId={adminId}
          adminFeePercent={adminFeePercent}
          isLast={i === cycles.length - 1}
          onPress={onCyclePress ? () => onCyclePress(c.id) : undefined}
        />
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  list: { paddingVertical: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  cycleBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cycleBadgeText: { fontWeight: '700' },
  body: { flex: 1, gap: 2 },
  name: { fontWeight: '600' },
  right: { alignItems: 'flex-end', gap: 4 },
  amount: { fontWeight: '700' },
});
