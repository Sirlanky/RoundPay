import { Stack } from 'expo-router';

export default function GroupLayout() {
  return (
    <Stack>
      <Stack.Screen name="create" options={{ title: 'Create Group', presentation: 'modal' }} />
      <Stack.Screen name="join" options={{ title: 'Join Group', presentation: 'modal' }} />
      <Stack.Screen name="[id]/index" options={{ title: 'Group' }} />
      <Stack.Screen name="[id]/pay" options={{ title: 'Pay Contribution', presentation: 'modal' }} />
    </Stack>
  );
}
