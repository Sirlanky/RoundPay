import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Colors, { brand } from '@/constants/Colors';
import { formatNaira, frequencyLabel } from '@/lib/format';
import type { AjoGroup } from '@/lib/types';
import { useColorScheme } from './useColorScheme';

interface Props {
  group: AjoGroup;
}

export function GroupCard({ group }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const statusColor =
    group.status === 'active' ? brand.primary : group.status === 'draft' ? colors.accent : colors.textSecondary;

  return (
    <Link href={`/group/${group.id}`} asChild>
      <Pressable style={({ pressed }) => [styles.card, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.9 : 1 }]}>
        <View style={styles.header}>
          <Text style={[styles.name, { color: colors.text }]}>{group.name}</Text>
          <View style={[styles.badge, { backgroundColor: statusColor + '22' }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>{group.status}</Text>
          </View>
        </View>
        <Text style={[styles.amount, { color: brand.primary }]}>{formatNaira(group.contribution_amount)}</Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          {frequencyLabel(group.frequency)} · Cycle {group.current_cycle || '—'} · Code {group.invite_code}
        </Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 17, fontWeight: '600', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  amount: { fontSize: 22, fontWeight: '700', marginTop: 8 },
  meta: { fontSize: 13, marginTop: 4 },
});
