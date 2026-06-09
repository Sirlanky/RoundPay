import { useRouter, type Href } from 'expo-router';
import { Pressable } from 'react-native';
import { PlatformIcon } from '@/components/navigation/PlatformIcon';
import { useThemeTokens } from '@/theme';

export function MessagesComposeButton() {
  const router = useRouter();
  const { colors } = useThemeTokens();

  return (
    <Pressable
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="New message"
      onPress={() => router.push('/messages/new' as Href)}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, marginRight: 4 })}>
      <PlatformIcon
        name={{ ios: 'square.and.pencil', android: 'edit', web: 'edit' }}
        color={colors.primary}
        size={22}
      />
    </Pressable>
  );
}
