import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { Card, StatusBadge, Text } from '@/components/ui';
import { formatDate, formatNaira } from '@/lib/format';
import { fetchGroupHistory, type GroupCycleHistory as Cycle } from '@/lib/group-history';
import { spacing, useThemeTokens } from '@/theme';

interface Props {
  groupId: string;
  adminId: string;
  adminFeePercent: number;
  reloadToken?: number;
}

export function GroupCycleHistory({ groupId, adminId, adminFeePercent, reloadToken }: Props) {
  const { colors } = useThemeTokens();
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [totalPaidOut, setTotalPaidOut] = useState(0);
  const [totalFees, setTotalFees] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetchGroupHistory(groupId);
        if (!active) return;
        setCycles(res.cycles);
        setTotalPaidOut(res.totalPaidOut);
        setTotalFees(res.totalFees);
      } catch {
        if (active) setCycles([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [groupId, reloadToken]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!cycles.length) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text variant="headingSmall">Cycle history</Text>
        <Text variant="bodySmall" color="secondary">
          {formatNaira(totalPaidOut)} paid out
          {totalFees > 0 ? ` · ${formatNaira(totalFees)} fees` : ''}
        </Text>
      </View>

      <Card variant="standard" style={styles.list}>
        {cycles.map((c, i) => {
          const collected = c.payoutBadgeStatus === 'paid_out';
          const isAdmin = c.recipientId === adminId;
          const showAmount =
            collected && c.payoutAmount != null
              ? c.payoutAmount
              : !collected && c.paidCount === c.totalCount && c.totalCount > 0
                ? c.expectedNetPayout
                : null;
          return (
            <View
              key={c.id}
              style={[
                styles.row,
                i < cycles.length - 1 && {
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
        })}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  loading: { paddingVertical: spacing.lg, alignItems: 'center' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
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
