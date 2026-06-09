import { Stack } from 'expo-router';
import { HeaderBackButton } from '@/components/HeaderBackButton';
import { useColorScheme } from '@/components/useColorScheme';
import { formScreenOptions, stackScreenOptions } from '@/lib/stack-screen-options';

export default function ProfileStackLayout() {
  const scheme = useColorScheme() ?? 'light';

  return (
    <Stack screenOptions={stackScreenOptions(scheme)}>
      <Stack.Screen name="bank" options={{ title: 'Bank Account' }} />
      <Stack.Screen name="payouts" options={{ title: 'Payout History' }} />
      <Stack.Screen
        name="earnings"
        options={{
          title: 'My earnings',
          headerLeft: () => <HeaderBackButton label="Back" />,
        }}
      />
      <Stack.Screen name="help" options={{ title: 'Help Center' }} />
      <Stack.Screen name="support" options={{ title: 'Contact Support' }} />
      <Stack.Screen name="terms" options={{ title: 'Terms & Privacy' }} />
      <Stack.Screen name="about" options={{ title: 'About RoundPay' }} />
      <Stack.Screen name="identity" options={{ title: 'Identity Verification' }} />
    </Stack>
  );
}
