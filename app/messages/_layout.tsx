import { Stack } from 'expo-router';
import { HeaderBackButton } from '@/components/HeaderBackButton';
import { MessagesComposeButton } from '@/components/messages/MessagesComposeButton';
import { useColorScheme } from '@/components/useColorScheme';
import { stackScreenOptions } from '@/lib/stack-screen-options';

export default function MessagesLayout() {
  const scheme = useColorScheme() ?? 'light';

  return (
    <Stack screenOptions={stackScreenOptions(scheme)}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Messages',
          headerLeft: () => <HeaderBackButton label="Back" />,
          headerRight: () => <MessagesComposeButton />,
        }}
      />
      <Stack.Screen name="[id]" options={{ title: 'Chat' }} />
      <Stack.Screen name="new" options={{ title: 'New message' }} />
    </Stack>
  );
}
