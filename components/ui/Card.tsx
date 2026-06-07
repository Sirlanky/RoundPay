import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useThemeTokens } from '@/theme';

export type CardVariant = 'standard' | 'elevated' | 'group' | 'summary';

interface Props {
  children: ReactNode;
  style?: ViewStyle;
  variant?: CardVariant;
}

export function Card({ children, style, variant = 'standard' }: Props) {
  const theme = useThemeTokens();
  const { colors, radius, spacing, shadow } = theme;

  const isElevated = variant === 'elevated';
  const isGroup = variant === 'group';
  const isSummary = variant === 'summary';

  return (
    <View
      style={[
        styles.base,
        {
          padding: spacing.md,
          borderRadius: isGroup ? radius.md : radius.lg,
          backgroundColor: isSummary ? colors.surfaceSecondary : colors.surface,
          borderColor: colors.border,
          borderWidth: isElevated || isSummary ? 0 : 1,
        },
        isElevated && shadow('medium'),
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    marginBottom: 16,
  },
});
