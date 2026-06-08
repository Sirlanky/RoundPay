import { Text as DefaultText, View as DefaultView } from 'react-native';
import type { ThemeColors } from '@/theme/colors';
import { useThemeTokens } from '@/theme';
import { useColorScheme } from './useColorScheme';

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type TextProps = ThemeProps & DefaultText['props'];
export type ViewProps = ThemeProps & DefaultView['props'];

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof ThemeColors
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];
  const { colors } = useThemeTokens();

  if (colorFromProps) {
    return colorFromProps;
  }
  return colors[colorName];
}

export function Text(props: TextProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const { colors } = useThemeTokens();
  const scheme = useColorScheme() ?? 'light';
  const color = lightColor && darkColor
    ? scheme === 'dark'
      ? darkColor
      : lightColor
    : colors.textPrimary;

  return <DefaultText style={[{ color }, style]} {...otherProps} />;
}

export function View(props: ViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const { colors } = useThemeTokens();
  const scheme = useColorScheme() ?? 'light';
  const backgroundColor = lightColor && darkColor
    ? scheme === 'dark'
      ? darkColor
      : lightColor
    : colors.background;

  return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />;
}
