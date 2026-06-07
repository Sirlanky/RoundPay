import { Pressable, StyleSheet, Text, View } from 'react-native';
import Colors, { brand } from '@/constants/Colors';
import { radius, spacing } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import { TRANSACTION_PIN_LENGTH } from '@/lib/transaction-pin';

interface Props {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'] as const;

export function PinEntry({ value, onChange, disabled }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const pressKey = (key: (typeof KEYS)[number]) => {
    if (disabled) return;
    if (key === 'del') {
      onChange(value.slice(0, -1));
      return;
    }
    if (!key || value.length >= TRANSACTION_PIN_LENGTH) return;
    onChange(value + key);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.dots}>
        {Array.from({ length: TRANSACTION_PIN_LENGTH }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                borderColor: colors.border,
                backgroundColor: i < value.length ? brand.primary : 'transparent',
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.pad}>
        {KEYS.map((key, index) => {
          if (key === '') {
            return <View key={`spacer-${index}`} style={styles.keySpacer} />;
          }
          const label = key === 'del' ? '⌫' : key;
          return (
            <Pressable
              key={key}
              onPress={() => pressKey(key)}
              disabled={disabled}
              style={({ pressed }) => [
                styles.key,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: pressed && !disabled ? 0.85 : 1,
                },
              ]}>
              <Text style={[styles.keyLabel, { color: colors.text }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.lg },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
  },
  pad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    maxWidth: 280,
    alignSelf: 'center',
  },
  key: {
    width: 76,
    height: 52,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keySpacer: { width: 76, height: 52 },
  keyLabel: { fontSize: 22, fontWeight: '600' },
});
