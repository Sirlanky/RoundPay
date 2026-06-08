import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  clampIntervalCount,
  INTERVAL_UNITS,
  intervalLabel,
  parseFrequency,
  serializeInterval,
} from '@/lib/group-frequency';
import type { GroupFrequency, IntervalUnit } from '@/lib/types';
import { spacing, useThemeTokens } from '@/theme';

interface Props {
  value: GroupFrequency;
  onChange: (frequency: GroupFrequency) => void;
  /** @deprecated kept for back-compat; intervals are no longer gated. */
  supported?: GroupFrequency[];
  disabled?: boolean;
}

export function GroupFrequencyPicker({ value, onChange, disabled }: Props) {
  const { colors } = useThemeTokens();
  const current = parseFrequency(value);

  const update = (unit: IntervalUnit, count: number) => {
    if (disabled) return;
    onChange(serializeInterval({ unit, count: clampIntervalCount(count) }));
  };

  return (
    <View style={[styles.wrap, { opacity: disabled ? 0.5 : 1 }]}>
      <View style={[styles.segment, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {INTERVAL_UNITS.map((u) => {
          const selected = current.unit === u.unit;
          return (
            <Pressable
              key={u.unit}
              disabled={disabled}
              onPress={() => update(u.unit, current.count)}
              style={[
                styles.segmentItem,
                selected && { backgroundColor: colors.primary },
              ]}>
              <Text
                style={{
                  color: selected ? '#fff' : colors.textPrimary,
                  fontWeight: '600',
                  fontSize: 14,
                }}>
                {current.count > 1 ? u.pluralLabel : u.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.stepperRow}>
        <Pressable
          disabled={disabled || current.count <= 1}
          onPress={() => update(current.unit, current.count - 1)}
          hitSlop={6}
          style={[
            styles.stepBtn,
            { borderColor: colors.border, opacity: current.count <= 1 ? 0.4 : 1 },
          ]}>
          <Text style={[styles.stepSign, { color: colors.textPrimary }]}>−</Text>
        </Pressable>

        <View style={styles.caption}>
          <Text style={[styles.captionText, { color: colors.textPrimary }]}>
            {intervalLabel(current)}
          </Text>
        </View>

        <Pressable
          disabled={disabled}
          onPress={() => update(current.unit, current.count + 1)}
          hitSlop={6}
          style={[styles.stepBtn, { borderColor: colors.border }]}>
          <Text style={[styles.stepSign, { color: colors.textPrimary }]}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  segment: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepSign: { fontSize: 24, fontWeight: '600', lineHeight: 26 },
  caption: { flex: 1, alignItems: 'center' },
  captionText: { fontSize: 16, fontWeight: '700' },
});
