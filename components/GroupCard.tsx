import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBadge } from './StatusBadge';
import { useColorScheme } from './useColorScheme';
import Colors, { brand } from '@/constants/Colors';
import { formatNaira, frequencyLabel } from '@/lib/format';
import type { AjoGroup } from '@/lib/types';
import { radius, spacing } from '@/constants/theme';

interface Props {
  group: AjoGroup;
}

export function GroupCard({ group }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <Link href={`/group/${group.id}`} asChild>
      <Pressable
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            opacity: pressed ? 0.92 : 1,
          },
        ]}>
        <View style={styles.header}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {group.name}
          </Text>
          <StatusBadge status={group.status} />
        </View>
        <Text style={[styles.amount, { color: brand.primary }]}>{formatNaira(group.contribution_amount)}</Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          {frequencyLabel(group.frequency)}
          {group.current_cycle > 0 ? ` · Cycle ${group.current_cycle}` : ''}
        </Text>
        <View style={[styles.codeRow, { backgroundColor: colors.background }]}>
          <Text style={[styles.codeLabel, { color: colors.textSecondary }]}>Invite code</Text>
          <Text style={[styles.code, { color: colors.text }]}>{group.invite_code}</Text>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  name: { fontSize: 17, fontWeight: '600', flex: 1 },
  amount: { fontSize: 22, fontWeight: '700', marginTop: spacing.sm },
  meta: { fontSize: 13, marginTop: 4 },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  codeLabel: { fontSize: 12 },
  code: { fontSize: 14, fontWeight: '700', letterSpacing: 1 },
});
