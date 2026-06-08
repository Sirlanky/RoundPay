import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { frequencyLabel } from '@/lib/format';
import type { MemberWithProfile } from '@/lib/members';
import {
  buildPayoutSchedule,
  groupScheduleByMonth,
  scheduleDayParts,
} from '@/lib/payout-schedule';
import { supabase } from '@/lib/supabase';
import type { AjoGroup, Cycle, Profile } from '@/lib/types';
import { useGroup } from '@/hooks/useGroup';
import { primaryAlpha, spacing, useThemeTokens, type ThemeColors } from '@/theme';

type CycleWithRecipient = Cycle & { recipient?: Profile | null };

export default function PayoutScheduleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { group, members, loading, error } = useGroup(id);
  const [cycles, setCycles] = useState<CycleWithRecipient[]>([]);
  const [cyclesLoading, setCyclesLoading] = useState(true);
  const { colors, scheme } = useThemeTokens();

  const loadCycles = useCallback(async () => {
    if (!id) return;
    setCyclesLoading(true);
    const { data } = await supabase
      .from('cycles')
      .select('*, recipient:profiles(*)')
      .eq('group_id', id)
      .order('cycle_number');
    setCycles((data ?? []) as CycleWithRecipient[]);
    setCyclesLoading(false);
  }, [id]);

  useEffect(() => {
    loadCycles();
  }, [loadCycles]);

  const schedule = useMemo(() => {
    if (!group) return [];
    return buildPayoutSchedule(
      group as AjoGroup,
      members as MemberWithProfile[],
      cycles,
      user?.id
    );
  }, [group, members, cycles, user?.id]);

  const months = useMemo(() => groupScheduleByMonth(schedule), [schedule]);

  if (loading || cyclesLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error || !group) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.error }}>{error ?? 'Group not found'}</Text>
      </View>
    );
  }

  const isDraft = group.status === 'draft';

  return (
    <Screen safeArea={false} contentStyle={styles.content}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Payout calendar</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {isDraft
          ? 'Each row is a collection round. Dates are added when the group starts.'
          : `${frequencyLabel(group.frequency)} rounds · ${members.length} members · recorded dates from your group, future rounds estimated from the same schedule`}
      </Text>

      {schedule.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No members in the rotation yet.
          </Text>
        </View>
      ) : (
        months.map((month) => (
          <View key={month.key} style={styles.monthBlock}>
            <Text style={[styles.monthLabel, { color: colors.textPrimary }]}>{month.label}</Text>
            {month.entries.map((entry) => (
              <ScheduleRow key={entry.round} entry={entry} colors={colors} scheme={scheme} />
            ))}
          </View>
        ))
      )}

      {!isDraft && schedule.some((e) => e.dateSource === 'estimated') ? (
        <Text style={[styles.footnote, { color: colors.textSecondary }]}>
          Estimated dates follow your {frequencyLabel(group.frequency).toLowerCase()} interval from
          the first recorded round. Actual dates may shift when the admin advances cycles.
        </Text>
      ) : null}
    </Screen>
  );
}

function ScheduleRow({
  entry,
  colors,
  scheme,
}: {
  entry: ReturnType<typeof buildPayoutSchedule>[number];
  colors: ThemeColors;
  scheme: 'light' | 'dark';
}) {
  const parts = entry.dueDate ? scheduleDayParts(entry.dueDate) : null;

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: colors.surface,
          borderColor: entry.isCurrent ? colors.primary : colors.border,
          borderWidth: entry.isCurrent ? 2 : 1,
        },
      ]}>
      <View style={[styles.dateCol, { backgroundColor: entry.isCurrent ? primaryAlpha(scheme, 16) : colors.border + '44' }]}>
        {parts ? (
          <>
            <Text style={[styles.dayNum, { color: entry.isCurrent ? colors.primary : colors.textPrimary }]}>
              {parts.day}
            </Text>
            <Text style={[styles.weekday, { color: colors.textSecondary }]}>{parts.weekday}</Text>
          </>
        ) : (
          <Text style={[styles.tbd, { color: colors.textSecondary }]}>TBD</Text>
        )}
      </View>

      <View style={styles.body}>
        <Text style={[styles.round, { color: colors.textSecondary }]}>Round {entry.round}</Text>
        <Text style={[styles.name, { color: colors.textPrimary }]}>
          {entry.collectorName}
          {entry.isYou ? ' (you)' : ''}
        </Text>
        <Text style={[styles.status, { color: entry.isCurrent ? colors.primary : colors.textSecondary }]}>
          {entry.displayStatus}
          {entry.dateSource === 'estimated' ? ' · Estimated date' : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  content: { paddingTop: spacing.sm, paddingBottom: spacing.xl },
  title: { fontSize: 22, fontWeight: '700', marginBottom: spacing.xs },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: spacing.lg },
  monthBlock: { marginBottom: spacing.lg },
  monthLabel: { fontSize: 16, fontWeight: '700', marginBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    borderRadius: 14,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  dateCol: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  dayNum: { fontSize: 22, fontWeight: '800', lineHeight: 26 },
  weekday: { fontSize: 11, fontWeight: '600', marginTop: 2, textTransform: 'uppercase' },
  tbd: { fontSize: 12, fontWeight: '700' },
  body: { flex: 1, paddingVertical: spacing.md, paddingRight: spacing.md },
  round: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  name: { fontSize: 16, fontWeight: '700', marginTop: 2 },
  status: { fontSize: 13, marginTop: 4 },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyText: { fontSize: 14 },
  footnote: { fontSize: 12, lineHeight: 17, marginTop: spacing.sm },
});
