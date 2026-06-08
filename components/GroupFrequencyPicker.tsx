import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FREQUENCY_OPTIONS } from '@/lib/group-frequency';
import type { GroupFrequency } from '@/lib/types';
import { spacing, useThemeTokens } from '@/theme';

interface Props {
  value: GroupFrequency;
  onChange: (frequency: GroupFrequency) => void;
  /** When set, options not in this list are hidden. */
  supported?: GroupFrequency[];
  disabled?: boolean;
}

export function GroupFrequencyPicker({ value, onChange, supported, disabled }: Props) {
  const { colors } = useThemeTokens();

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
                backgroundColor: selected ? colors.primary : colors.background,
                borderColor: colors.primary,
                opacity: disabled ? 0.5 : 1,
              },
            ]}
            onPress={() => onChange(option.value)}>
            <Text style={{ color: selected ? '#fff' : colors.textPrimary, fontWeight: '600', fontSize: 13 }}>
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
