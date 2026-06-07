import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/Text';
import { useThemeTokens } from '@/theme';

interface Props {
  label?: string;
  fallbackHref?: '/(tabs)' | '/(auth)/login';
}

export function HeaderBackButton({ label = 'Back', fallbackHref = '/(tabs)' }: Props) {
  const router = useRouter();
  const { colors } = useThemeTokens();

  const onPress = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(fallbackHref);
  };

  return (
    <Pressable onPress={onPress} hitSlop={12} style={styles.hit} accessibilityRole="button" accessibilityLabel={label}>
      <Text variant="headingSmall" style={{ color: colors.primary, fontWeight: '600' }}>
        ← {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: { paddingHorizontal: 4, paddingVertical: 6, minWidth: 72 },
});
