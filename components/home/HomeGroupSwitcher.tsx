import { Pressable, StyleSheet, Text, View } from 'react-native';
import Colors, { brand } from '@/constants/Colors';
import type { AjoGroup } from '@/lib/types';
import { spacing } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

interface Props {
  groups: AjoGroup[];
  selectedId: string;
  onSelect: (groupId: string) => void;
}

export function HomeGroupSwitcher({ groups, selectedId, onSelect }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  if (groups.length < 2) return null;

  return (
    <View style={styles.row}>
      {groups.map((group) => {
        const selected = group.id === selectedId;
        return (
          <Pressable
            key={group.id}
            onPress={() => onSelect(group.id)}
            style={[
              styles.chip,
              {
                backgroundColor: selected ? brand.primary + '18' : colors.card,
                borderColor: selected ? brand.primary : colors.border,
              },
            ]}>
            <Text
              style={[styles.chipText, { color: selected ? brand.primary : colors.text }]}
              numberOfLines={1}>
              {group.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    maxWidth: '100%',
  },
  chipText: { fontSize: 13, fontWeight: '600', maxWidth: 160 },
});
