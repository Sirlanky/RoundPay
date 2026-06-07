import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { HeaderBackButton } from '@/components/HeaderBackButton';
import { brand, getColors } from '@/theme/colors';
import { typography } from '@/theme/typography';

export function stackScreenOptions(scheme: 'light' | 'dark'): NativeStackNavigationOptions {
  const colors = getColors(scheme);
  return {
    headerShown: true,
    headerBackVisible: true,
    headerBackTitle: 'Back',
    headerTintColor: brand.primary,
    headerStyle: { backgroundColor: colors.background },
    headerTitleStyle: { ...typography.headingSmall, color: colors.textPrimary },
    headerShadowVisible: false,
    contentStyle: { backgroundColor: colors.background, flex: 1 },
    gestureEnabled: true,
  };
}

export function formScreenOptions(
  scheme: 'light' | 'dark',
  title: string
): NativeStackNavigationOptions {
  return {
    ...stackScreenOptions(scheme),
    title,
    presentation: 'card',
    headerLeft: () => <HeaderBackButton label="Close" />,
  };
}
