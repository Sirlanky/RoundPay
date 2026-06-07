import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { useThemeTokens } from '@/theme';

interface Props {
  title: string;
  message: string;
}

export function EmptyState({ title, message }: Props) {
  const { colors, radius, spacing } = useThemeTokens();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.md,
          padding: spacing.xl,
        },
      ]}>
      <Text variant="headingSmall" style={styles.title}>
        {title}
      </Text>
      <Text variant="bodySmall" color="secondary" style={styles.message}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
  },
});
