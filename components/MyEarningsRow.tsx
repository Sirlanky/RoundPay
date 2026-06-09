import { Pressable, StyleSheet, View } from 'react-native';
import { Card, Text } from '@/components/ui';
import { formatNaira } from '@/lib/format';
import { spacing, useThemeTokens } from '@/theme';

interface Props {
  total: number;
  onPress: () => void;
}

export function MyEarningsRow({ total, onPress }: Props) {
  const { colors } = useThemeTokens();

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}>
      <Card variant="standard" style={styles.card}>
        <View style={styles.row}>
          <Text variant="bodyMedium" style={styles.label}>
            My earnings
          </Text>
          <Text variant="bodyLarge" color="success" style={styles.amount}>
            {formatNaira(total)}
          </Text>
          <Text variant="bodyLarge" style={{ color: colors.textSecondary }}>
            ›
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md, paddingVertical: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { flex: 1, fontWeight: '600' },
  amount: { fontWeight: '800' },
});
