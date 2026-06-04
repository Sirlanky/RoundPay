import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { HeaderBackButton } from '@/components/HeaderBackButton';
import Colors, { brand } from '@/constants/Colors';

export function stackScreenOptions(scheme: 'light' | 'dark'): NativeStackNavigationOptions {
  const colors = Colors[scheme];
  return {
    headerShown: true,
    headerBackVisible: true,
    headerBackTitle: 'Back',
    headerTintColor: brand.primary,
    headerStyle: { backgroundColor: colors.background },
    headerTitleStyle: { fontWeight: '600', color: colors.text },
    headerShadowVisible: false,
    contentStyle: { backgroundColor: colors.background, flex: 1 },
    gestureEnabled: true,
  };
}

/** Form sheets (create/join/pay): card stack, not iOS modal — avoids extra top gap. */
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
