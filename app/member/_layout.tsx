import { Stack } from 'expo-router';
import { HeaderBackButton } from '@/components/HeaderBackButton';
import { useColorScheme } from '@/components/useColorScheme';
import { stackScreenOptions } from '@/lib/stack-screen-options';

export default function MemberLayout() {
  const scheme = useColorScheme() ?? 'light';

  return (
    <Stack screenOptions={stackScreenOptions(scheme)}>
      <Stack.Screen
        name="[id]"
        options={{ title: 'Profile', headerLeft: () => <HeaderBackButton label="Back" /> }}
      />
    </Stack>
  );
}
