import { Stack } from 'expo-router';
import { HeaderBackButton } from '@/components/HeaderBackButton';
import { useColorScheme } from '@/components/useColorScheme';
import { stackScreenOptions } from '@/lib/stack-screen-options';

export default function AuthLayout() {
  const scheme = useColorScheme() ?? 'light';

  return (
    <Stack screenOptions={stackScreenOptions(scheme)}>
      <Stack.Screen name="setup" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen
        name="verify-otp"
        options={{
          title: 'Verify email',
          headerLeft: () => <HeaderBackButton fallbackHref="/(auth)/login" />,
        }}
      />
      <Stack.Screen name="reset-password" options={{ headerShown: false }} />
    </Stack>
  );
}
