import { Stack } from 'expo-router';
import { useColorScheme } from '@/components/useColorScheme';
import { formScreenOptions, stackScreenOptions } from '@/lib/stack-screen-options';

export default function GroupLayout() {
  const scheme = useColorScheme() ?? 'light';

  return (
    <Stack screenOptions={stackScreenOptions(scheme)}>
      <Stack.Screen name="create" options={formScreenOptions(scheme, 'Create Group')} />
      <Stack.Screen name="join" options={formScreenOptions(scheme, 'Join Group')} />
      <Stack.Screen name="[id]/index" options={{ title: 'Group Details' }} />
      <Stack.Screen name="[id]/pay" options={formScreenOptions(scheme, 'Pay Contribution')} />
    </Stack>
  );
}
