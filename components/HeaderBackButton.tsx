import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { brand } from '@/constants/Colors';

interface Props {
  label?: string;
  /** Where to go if there is nothing to pop (e.g. opened from a deep link). */
  fallbackHref?: '/(tabs)' | '/(auth)/login';
}

export function HeaderBackButton({ label = 'Back', fallbackHref = '/(tabs)' }: Props) {
  const router = useRouter();

  const onPress = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(fallbackHref);
  };

  return (
    <Pressable onPress={onPress} hitSlop={12} style={styles.hit} accessibilityRole="button" accessibilityLabel={label}>
      <Text style={styles.text}>← {label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: { paddingHorizontal: 4, paddingVertical: 6, minWidth: 72 },
  text: { color: brand.primary, fontSize: 17, fontWeight: '600' },
});
