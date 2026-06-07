import { Text as DefaultText, View as DefaultView } from 'react-native';
import { useThemeTokens } from '@/theme';
import { useColorScheme } from './useColorScheme';
import Colors from '@/constants/Colors';

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type TextProps = ThemeProps & DefaultText['props'];
export type ViewProps = ThemeProps & DefaultView['props'];

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  }
  return Colors[theme][colorName];
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
