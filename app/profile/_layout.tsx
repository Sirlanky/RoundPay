import { Stack } from 'expo-router';
import { useColorScheme } from '@/components/useColorScheme';
import { stackScreenOptions } from '@/lib/stack-screen-options';

export default function ProfileStackLayout() {
  const scheme = useColorScheme() ?? 'light';

  return (
    <Stack screenOptions={stackScreenOptions(scheme)}>
      <Stack.Screen name="bank" options={{ title: 'Bank Account' }} />
    </Stack>
  );
}
