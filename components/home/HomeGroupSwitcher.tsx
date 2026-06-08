import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AjoGroup } from '@/lib/types';
import { primaryAlpha, spacing, useThemeTokens } from '@/theme';

interface Props {
  groups: AjoGroup[];
  selectedId: string;
  onSelect: (groupId: string) => void;
}

export function HomeGroupSwitcher({ groups, selectedId, onSelect }: Props) {
  const { colors, scheme } = useThemeTokens();

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
                backgroundColor: selected ? primaryAlpha(scheme, 24) : colors.surface,
                borderColor: selected ? colors.primary : colors.border,
              },
            ]}>
            <Text
              style={[styles.chipText, { color: selected ? colors.primary : colors.textPrimary }]}
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
