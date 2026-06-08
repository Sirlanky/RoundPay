import { StyleSheet, Text, View } from 'react-native';
import { legacyTypography, spacing, useThemeTokens } from '@/theme';

interface Props {
  title: string;
  subtitle?: string;
  large?: boolean;
}

export function ScreenHeader({ title, subtitle, large }: Props) {
  const { colors } = useThemeTokens();

  return (
    <View style={styles.wrap}>
      <Text
        style={[
          large ? styles.large : styles.title,
          { color: colors.textPrimary },
        ]}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg, marginTop: spacing.sm },
  large: { ...legacyTypography.hero, marginBottom: spacing.xs },
  title: { ...legacyTypography.title, marginBottom: spacing.xs },
  subtitle: { ...legacyTypography.body, lineHeight: 22 },
});
