import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/contexts/AuthContext';
import { primaryAlpha, spacing, useThemeTokens } from '@/theme';

export function BuildModeBanner() {
  const { buildMode, exitBuildMode, signInAsGuest } = useAuth();
  const router = useRouter();
  const { colors, scheme, radius } = useThemeTokens();
  if (!buildMode) return null;

  const goSignIn = () => {
    exitBuildMode();
    router.replace('/(auth)/login');
  };

  const goGuest = () => {
    void signInAsGuest().catch((e) =>
      Alert.alert('Guest sign-in failed', e instanceof Error ? e.message : 'Try again')
    );
  };

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: primaryAlpha(scheme, 16),
          borderRadius: radius.sm,
        },
      ]}>
      <Text variant="caption" color="success" style={styles.text}>
        Preview mode — use Guest on Create group, or sign in with email.
      </Text>
      <View style={styles.links}>
        {__DEV__ ? (
          <Pressable onPress={goGuest} hitSlop={8}>
            <Text variant="caption" style={{ color: colors.primary, fontWeight: '700' }}>
              Guest
            </Text>
          </Pressable>
        ) : null}
        <Pressable onPress={goSignIn} hitSlop={8}>
          <Text variant="caption" style={{ color: colors.primary, fontWeight: '700' }}>
            Sign in
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  text: { flex: 1, lineHeight: 16 },
  links: { flexDirection: 'row', gap: spacing.sm },
});
