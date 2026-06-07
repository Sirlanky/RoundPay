import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { StatusBadge, Text } from '@/components/ui';
import { formatNaira, frequencyLabel } from '@/lib/format';
import type { AjoGroup } from '@/lib/types';
import { spacing, useThemeTokens } from '@/theme';

interface Props {
  group: AjoGroup;
  variant?: 'default' | 'history';
  compact?: boolean;
  onNavigate?: () => void;
}

export function GroupCard({ group, variant = 'default', compact = false, onNavigate }: Props) {
  const { colors, radius } = useThemeTokens();
  const isHistory = variant === 'history' || group.status === 'completed';
  const isDraft = group.status === 'draft';

  const metaLine = isHistory
    ? `${frequencyLabel(group.frequency)} · ${group.current_cycle > 0 ? `${group.current_cycle} cycles` : 'Finished'}`
    : `${frequencyLabel(group.frequency)}${group.current_cycle > 0 ? ` · Cycle ${group.current_cycle}` : ''}`;

  return (
    <Link href={`/group/${group.id}`} asChild>
      <Pressable
        onPress={onNavigate}
        style={({ pressed }) => [
          styles.card,
          compact && styles.cardCompact,
          isHistory && styles.cardHistory,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radius.md,
            opacity: pressed ? 0.92 : 1,
          },
        ]}>
        <View style={styles.header}>
          <Text
            variant={compact ? 'bodyLarge' : 'headingSmall'}
            numberOfLines={1}
            style={isHistory ? styles.nameHistory : styles.name}>
            {group.name}
          </Text>
          {!compact ? <StatusBadge status={group.status} /> : null}
        </View>
        <Text
          variant="money"
          color="accent"
          style={compact ? styles.amountCompact : styles.amount}>
          {formatNaira(group.contribution_amount)}
        </Text>
        {!compact ? (
          <Text variant="caption" color="secondary" style={styles.meta}>
            {metaLine}
          </Text>
        ) : null}

        {!compact && isDraft ? (
          <View style={[styles.codeRow, { backgroundColor: colors.surfaceSecondary, borderRadius: radius.sm }]}>
            <Text variant="caption" color="secondary">
              Invite code
            </Text>
            <Text variant="bodySmall" style={{ fontWeight: '700', letterSpacing: 1 }}>
              {group.invite_code}
            </Text>
          </View>
        ) : null}

        {!compact && isHistory ? (
          <Text variant="caption" color="secondary" style={styles.historyNote}>
            Tap to view summary
          </Text>
        ) : null}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  cardCompact: { paddingVertical: spacing.sm + 2 },
  cardHistory: { paddingVertical: spacing.sm + 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  name: { flex: 1 },
  nameHistory: { flex: 1, fontSize: 16 },
  amount: { marginTop: spacing.sm },
  amountCompact: { marginTop: 2, fontSize: 17, fontWeight: '800', lineHeight: 34 },
  meta: { marginTop: 4 },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  historyNote: { marginTop: spacing.sm },
});
