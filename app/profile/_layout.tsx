import { Stack } from 'expo-router';

export default function ProfileStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="bank" options={{ title: 'Bank Account', headerBackTitle: 'Profile' }} />
    </Stack>
  );
}
