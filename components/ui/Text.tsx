import { Text as RNText, TextProps, TextStyle } from 'react-native';
import { TypographyVariant, useThemeTokens } from '@/theme';

type TextColor = 'primary' | 'secondary' | 'muted' | 'inverse' | 'accent' | 'success' | 'error' | 'warning';

interface Props extends TextProps {
  variant?: TypographyVariant;
  color?: TextColor;
  style?: TextStyle;
}

export function Text({ variant = 'bodySmall', color = 'primary', style, children, ...rest }: Props) {
  const theme = useThemeTokens();
  const { colors, typography } = theme;

  const colorMap: Record<TextColor, string> = {
    primary: colors.textPrimary,
    secondary: colors.textSecondary,
    muted: colors.textMuted,
    inverse: colors.textInverse,
    accent: colors.primary,
    success: colors.success,
    error: colors.error,
    warning: colors.warning,
  };

  return (
    <RNText style={[typography[variant], { color: colorMap[color] }, style]} {...rest}>
      {children}
    </RNText>
  );
}
