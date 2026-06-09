import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { PlatformIcon } from '@/components/navigation/PlatformIcon';
import { GroupHealthBadge } from '@/components/admin/GroupHealthBadge';
import { Badge, Card, StatusBadge, Text } from '@/components/ui';
import { useTranslation } from '@/contexts/LanguageContext';
import type { AdminGroupSummary } from '@/lib/admin/admin-dashboard';
import type { TranslationKey } from '@/lib/i18n/keys';
import { formatDate, formatNaira } from '@/lib/format';
import { spacing, useThemeTokens } from '@/theme';

interface Props {
  groups: AdminGroupSummary[];
  /** Hide section badge when the overview already shows inactive status. */
  showInactiveBadge?: boolean;
}

function groupSubtitle(
  item: AdminGroupSummary,
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string,
  tp: (
    count: number,
    oneKey: TranslationKey,
    otherKey: TranslationKey,
    vars?: Record<string, string | number>
  ) => string
): string {
  const { group } = item;

  if (group.status === 'completed') {
    const parts = [t('admin.groupCollected', { amount: formatNaira(item.totalCollected ?? 0) })];
    const earned = item.adminFeesEarned ?? 0;
    if (earned > 0) {
      parts.push(t('admin.groupEarned', { amount: formatNaira(earned) }));
    }
    const cycles = item.completedCycles ?? 0;
    if (cycles > 0) {
      parts.push(tp(cycles, 'admin.groupCycles_one', 'admin.groupCycles_other', { count: cycles }));
    }
    return parts.join(' · ');
  }

  if (group.status === 'draft') {
    return tp(item.memberCount, 'admin.groupDraftHint_one', 'admin.groupDraftHint_other', {
      count: item.memberCount,
    });
  }

  const progress = t('admin.groupProgress', { paid: item.paidCount, total: item.memberCount });
  if (item.pendingCount > 0) {
    return `${progress} · ${tp(item.pendingCount, 'admin.groupPendingCount_one', 'admin.groupPendingCount_other', {
      count: item.pendingCount,
    })}`;
  }
  if (item.nextPayoutName) {
    return `${progress} · ${t('admin.nextPayout', {
      name: item.nextPayoutName,
      date: item.dueDate ? formatDate(item.dueDate) : t('admin.dateTbd'),
    })}`;
  }
  return progress;
}

export function AdminGroupList({ groups, showInactiveBadge = true }: Props) {
  const { t, tp } = useTranslation();
  const router = useRouter();
  const { colors } = useThemeTokens();

  const completedCount = groups.filter((g) => g.group.status === 'completed').length;
  const activeCount = groups.filter((g) => g.group.status === 'active').length;

  if (!groups.length) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        <Text variant="headingSmall" style={styles.title}>
          {tp(groups.length, 'admin.managedGroups_one', 'admin.managedGroups_other')}
        </Text>
        {showInactiveBadge && activeCount === 0 && completedCount > 0 ? (
          <Badge label={t('admin.noActiveGroupsShort')} variant="neutral" />
        ) : null}
      </View>
      <Card variant="standard" style={styles.card}>
        {groups.map((item, index) => (
          <Pressable
            key={item.group.id}
            onPress={() =>
              router.push(
                (item.group.status === 'completed'
                  ? `/group/${item.group.id}`
                  : `/group/${item.group.id}/admin`) as Href
              )
            }
            style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}>
            <View
              style={[
                styles.row,
                index < groups.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.border,
                },
              ]}>
              <View style={styles.body}>
                <View style={styles.nameRow}>
                  <Text variant="bodyMedium" style={styles.name} numberOfLines={1}>
                    {item.group.name}
                  </Text>
                  {item.group.status === 'active' ? (
                    <GroupHealthBadge health={item.health} />
                  ) : (
                    <StatusBadge status={item.group.status} />
                  )}
                </View>
                <Text variant="caption" color="secondary" numberOfLines={2}>
                  {groupSubtitle(item, t, tp)}
                </Text>
              </View>
              <PlatformIcon
                name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                size={16}
                color={colors.textMuted}
              />
            </View>
          </Pressable>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  title: { fontWeight: '700', flex: 1 },
  card: { paddingVertical: 0, paddingHorizontal: 0, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  body: { flex: 1, minWidth: 0, gap: 4 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: { flex: 1, fontWeight: '600' },
});
