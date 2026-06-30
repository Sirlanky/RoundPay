import { Pressable, StyleSheet, View } from 'react-native';
import { Card, StatusBadge, Text } from '@/components/ui';
import { InviteCodeCard } from '@/components/InviteCodeCard';
import { useTranslation } from '@/contexts/LanguageContext';
import { formatNaira } from '@/lib/format';
import type { GroupScheduleInput } from '@/lib/group-schedule';
import { collectionFrequencyLabel, payoutFrequencyLabel } from '@/lib/group-schedule';
import type { AjoGroup } from '@/lib/types';
import { primaryAlpha, spacing, useThemeTokens } from '@/theme';

interface Props {
  group: AjoGroup;
  schedule: GroupScheduleInput;
  memberCount: number;
  payInsPerCycle: number;
  isDraft: boolean;
  isAdmin: boolean;
  potLabel: string;
  potAmount: string;
  collected?: number | null;
  outstanding?: number | null;
  adminFeesEarned?: number | null;
  onFeesPress?: () => void;
}

function ScheduleChip({ label }: { label: string }) {
  const { scheme, radius } = useThemeTokens();
  return (
    <View
      style={[
        styles.chip,
        { backgroundColor: primaryAlpha(scheme, 12), borderRadius: radius.full },
      ]}>
      <Text variant="caption" color="accent" style={styles.chipText}>
        {label}
      </Text>
    </View>
  );
}

function StatTile({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'success' | 'accent';
}) {
  const { colors, radius } = useThemeTokens();

  return (
    <View style={[styles.statTile, { backgroundColor: colors.surfaceSecondary, borderRadius: radius.md }]}>
      <Text variant="caption" color="secondary">
        {label}
      </Text>
      <Text
        variant="bodySmall"
        color={tone === 'success' ? 'success' : tone === 'accent' ? 'accent' : 'primary'}
        style={styles.statValue}
        numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export function GroupDetailHero({
  group,
  schedule,
  memberCount,
  payInsPerCycle,
  isDraft,
  isAdmin,
  potLabel,
  potAmount,
  collected,
  outstanding,
  adminFeesEarned,
  onFeesPress,
}: Props) {
  const { t, tp } = useTranslation();
  const { colors, scheme, radius } = useThemeTokens();

  const rosterLine = tp(group.max_members, 'plural.roster_one', 'plural.roster_other', {
    current: memberCount,
    max: group.max_members,
  });

  return (
    <Card variant="elevated" style={styles.card}>
      <View style={styles.topRow}>
        <Text variant="headingMedium" numberOfLines={2} style={styles.name}>
          {group.name}
        </Text>
        <StatusBadge status={group.status} />
      </View>

      <Text variant="display" color="accent">
        {formatNaira(group.contribution_amount)}
      </Text>
      <Text variant="bodySmall" color="secondary" style={styles.perDrop}>
        {payInsPerCycle > 1
          ? t('group.detail.perDropMulti', { count: payInsPerCycle })
          : t('group.detail.perDrop')}
      </Text>

      <View style={styles.chipRow}>
        <ScheduleChip label={collectionFrequencyLabel(schedule, t)} />
        <ScheduleChip label={payoutFrequencyLabel(schedule.payoutFrequency, t)} />
      </View>

      <View style={styles.statRow}>
        <StatTile label={potLabel} value={potAmount} tone="accent" />
        {!isDraft && collected != null && outstanding != null ? (
          <>
            <StatTile label={t('group.amountCollected')} value={formatNaira(collected)} tone="success" />
            <StatTile label={t('group.amountWaiting')} value={formatNaira(outstanding)} />
          </>
        ) : (
          <StatTile label={t('group.detail.roster')} value={rosterLine} />
        )}
      </View>

      {group.admin_fee_percent > 0 ? (
        <Text variant="caption" color="secondary" style={styles.feeNote}>
          {t('group.detail.adminFeeNote', { percent: group.admin_fee_percent })}
        </Text>
      ) : null}

      {isAdmin && adminFeesEarned != null && adminFeesEarned > 0 ? (
        <Pressable onPress={onFeesPress} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
          <View style={[styles.feesPill, { backgroundColor: primaryAlpha(scheme, 12), borderRadius: radius.md }]}>
            <Text variant="bodySmall" style={{ color: colors.success, fontWeight: '700' }}>
              {t('group.detail.feesEarned', { amount: formatNaira(adminFeesEarned) })}
            </Text>
          </View>
        </Pressable>
      ) : null}

      {isDraft ? <InviteCodeCard groupName={group.name} inviteCode={group.invite_code} compact /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg, marginBottom: spacing.md },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  name: { flex: 1 },
  perDrop: { marginTop: 2 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.md },
  chip: { paddingHorizontal: spacing.sm, paddingVertical: 5 },
  chipText: { fontWeight: '700' },
  statRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  statTile: { flex: 1, padding: spacing.sm, minWidth: 0 },
  statValue: { fontSize: 16, fontWeight: '800', marginTop: 2 },
  feeNote: { marginTop: spacing.sm },
  feesPill: { marginTop: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, alignSelf: 'flex-start' },
});
