import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColorScheme } from './useColorScheme';
import Colors, { brand } from '@/constants/Colors';
import { FREQUENCY_OPTIONS } from '@/lib/group-frequency';
import type { GroupFrequency } from '@/lib/types';
import { spacing } from '@/constants/theme';

interface Props {
  value: GroupFrequency;
  onChange: (frequency: GroupFrequency) => void;
  /** When set, options not in this list are hidden. */
  supported?: GroupFrequency[];
  disabled?: boolean;
}

export function GroupFrequencyPicker({ value, onChange, supported, disabled }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const options = supported
    ? FREQUENCY_OPTIONS.filter((o) => supported.includes(o.value))
    : FREQUENCY_OPTIONS;

  return (
    <View style={styles.row}>
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <Pressable
            key={option.value}
            disabled={disabled}
            style={[
              styles.chip,
              {
                backgroundColor: selected ? brand.primary : colors.background,
                borderColor: brand.primary,
                opacity: disabled ? 0.5 : 1,
              },
            ]}
            onPress={() => onChange(option.value)}>
            <Text style={{ color: selected ? '#fff' : colors.text, fontWeight: '600', fontSize: 13 }}>
              {option.chipLabel}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  chip: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1.5,
  },
});
