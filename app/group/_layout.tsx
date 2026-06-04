import { Stack } from 'expo-router';
import Colors, { brand } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function GroupLayout() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: brand.primary,
        headerTitleStyle: { fontWeight: '600', color: colors.text },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="create" options={{ title: 'Create Group', presentation: 'modal' }} />
      <Stack.Screen name="join" options={{ title: 'Join Group', presentation: 'modal' }} />
      <Stack.Screen name="[id]/index" options={{ title: 'Group Details' }} />
      <Stack.Screen name="[id]/pay" options={{ title: 'Pay Contribution', presentation: 'modal' }} />
    </Stack>
  );
}
