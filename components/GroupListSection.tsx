import { StyleSheet, Text, View } from 'react-native';
import { GroupCard } from './GroupCard';
import type { GroupBucket } from '@/lib/group-sections';
import { groupBucketHint, groupBucketLabel } from '@/lib/group-sections';
import type { AjoGroup } from '@/lib/types';
import { spacing, useThemeTokens } from '@/theme';

interface Props {
  bucket: GroupBucket;
  groups: AjoGroup[];
  /** Minimal header — no hint text or count badge */
  compact?: boolean;
}

export function GroupListSection({ bucket, groups, compact = false }: Props) {
  const { colors } = useThemeTokens();

  if (groups.length === 0) return null;

  const isHistory = bucket === 'completed';

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <Text style={[styles.title, compact && styles.titleCompact, { color: colors.textPrimary }]}>
        {groupBucketLabel(bucket)}
      </Text>
      {!compact ? (
        <>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>{groupBucketHint(bucket)}</Text>
        </>
      ) : null}
      {groups.map((group) => (
        <GroupCard
          key={group.id}
          group={group}
          variant={isHistory ? 'history' : 'default'}
          compact={compact}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  wrapCompact: { marginBottom: spacing.md },
  title: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  titleCompact: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: spacing.sm },
  hint: { fontSize: 13, lineHeight: 18, marginBottom: spacing.sm },
});
