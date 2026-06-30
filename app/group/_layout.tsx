import { Stack } from 'expo-router';
import { HeaderBackButton } from '@/components/HeaderBackButton';
import { useColorScheme } from '@/components/useColorScheme';
import { formScreenOptions, stackScreenOptions } from '@/lib/stack-screen-options';

export default function GroupLayout() {
  const scheme = useColorScheme() ?? 'light';

  return (
    <Stack screenOptions={stackScreenOptions(scheme)}>
      <Stack.Screen name="create" options={formScreenOptions(scheme, 'Create Group')} />
      <Stack.Screen name="join" options={formScreenOptions(scheme, 'Join Group')} />
      <Stack.Screen
        name="[id]/index"
        options={{
          title: 'Group Details',
          headerLeft: () => <HeaderBackButton label="Home" fallbackHref="/(tabs)" />,
        }}
      />
      <Stack.Screen
        name="[id]/invite"
        options={{
          title: 'Invite Members',
          headerLeft: () => <HeaderBackButton label="Back" />,
        }}
      />
      <Stack.Screen
        name="[id]/schedule"
        options={{
          title: 'Payout Calendar',
          headerLeft: () => <HeaderBackButton label="Back" />,
        }}
      />
      <Stack.Screen
        name="[id]/history"
        options={{
          title: 'Circle History',
          headerLeft: () => <HeaderBackButton label="Back" />,
        }}
      />
      <Stack.Screen
        name="[id]/admin"
        options={{
          title: 'Group Admin',
          headerLeft: () => <HeaderBackButton label="Back" />,
        }}
      />
      <Stack.Screen name="[id]/pay" options={formScreenOptions(scheme, 'Pay Contribution')} />
    </Stack>
  );
}
