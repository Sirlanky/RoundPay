import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { primaryAlpha, spacing, useThemeTokens } from '@/theme';

interface Props {
  title: string;
  message: string;
}

export function EmptyState({ title, message }: Props) {
  const { colors, scheme, radius, shadow } = useThemeTokens();

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
        shadow('small'),
      ]}>
      <View style={[styles.iconCircle, { backgroundColor: primaryAlpha(scheme, 12) }]}>
        <SymbolView
          name={{ ios: 'tray', android: 'inbox', web: 'inbox' } as never}
          tintColor={colors.primary}
          size={22}
        />
      </View>
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
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
  },
});
