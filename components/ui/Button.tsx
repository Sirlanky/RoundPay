import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { useThemeTokens } from '@/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  style,
  fullWidth = true,
}: Props) {
  const theme = useThemeTokens();
  const { colors, radius, typography } = theme;
  const isDisabled = Boolean(disabled || loading);

  const palette = getVariantColors(variant, colors, isDisabled);
  const textColor = palette.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderWidth: palette.borderWidth,
          borderRadius: radius.md,
          opacity: pressed && !isDisabled ? 0.92 : isDisabled ? 0.55 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[typography.bodyLarge, styles.label, { color: textColor, fontWeight: '600' }]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

function getVariantColors(
  variant: ButtonVariant,
  colors: ReturnType<typeof useThemeTokens>['colors'],
  disabled: boolean
) {
  if (disabled) {
    return {
      bg: colors.surfaceSecondary,
      border: colors.border,
      borderWidth: 1,
      text: colors.textMuted,
    };
  }

  switch (variant) {
    case 'secondary':
      return {
        bg: colors.primaryLight,
        border: colors.primaryLight,
        borderWidth: 0,
        text: colors.primary,
      };
    case 'outline':
      return {
        bg: 'transparent',
        border: colors.primary,
        borderWidth: 1.5,
        text: colors.primary,
      };
    case 'ghost':
      return {
        bg: 'transparent',
        border: 'transparent',
        borderWidth: 0,
        text: colors.primary,
      };
    case 'destructive':
      return {
        bg: colors.error,
        border: colors.error,
        borderWidth: 0,
        text: colors.textInverse,
      };
    case 'primary':
    default:
      return {
        bg: colors.primary,
        border: colors.primary,
        borderWidth: 0,
        text: colors.textInverse,
      };
  }
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  label: { textAlign: 'center' },
});
