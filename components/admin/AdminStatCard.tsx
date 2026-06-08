import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui';
import { spacing, useThemeTokens } from '@/theme';

interface Props {
  label: string;
  value: string;
  hint?: string;
  accent?: 'default' | 'success' | 'warning' | 'error';
  onPress?: () => void;
}

export function AdminStatCard({ label, value, hint, accent = 'default', onPress }: Props) {
  const { colors, radius, shadow } = useThemeTokens();

  const accentColor =
    accent === 'success'
      ? colors.success
      : accent === 'warning'
        ? colors.warning
        : accent === 'error'
          ? colors.error
          : colors.primary;

  const body = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.lg,
        },
        shadow('small'),
      ]}>
      <Text variant="caption" color="secondary" style={styles.label}>
        {label}
      </Text>
      <Text variant="headingMedium" style={{ fontWeight: '800', color: accentColor }}>
        {value}
      </Text>
      {hint ? (
        <Text variant="caption" color="muted" style={styles.hint}>
          {hint}
        </Text>
      ) : null}
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: {
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  value: { fontWeight: '800' },
  hint: { marginTop: 4 },
});
