import { Stack } from 'expo-router';
import { HeaderBackButton } from '@/components/HeaderBackButton';
import { useColorScheme } from '@/components/useColorScheme';
import { stackScreenOptions } from '@/lib/stack-screen-options';

export default function AuthCallbackLayout() {
  const scheme = useColorScheme() ?? 'light';

  return (
    <Stack screenOptions={stackScreenOptions(scheme)}>
      <Stack.Screen
        name="callback"
        options={{
          title: 'Sign in',
          headerLeft: () => <HeaderBackButton fallbackHref="/(auth)/login" />,
        }}
      />
    </Stack>
  );
}
