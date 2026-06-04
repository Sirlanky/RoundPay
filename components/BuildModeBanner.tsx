import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { brand } from '@/constants/Colors';
import { spacing } from '@/constants/theme';

/** Compact notice — use inside screen content, not above the tab header. */
export function BuildModeBanner() {
  const { buildMode, exitBuildMode, signInAsGuest } = useAuth();
  const router = useRouter();
  if (!buildMode) return null;

  const goSignIn = () => {
    exitBuildMode();
    router.replace('/(auth)/login');
  };

  const goGuest = () => {
    void signInAsGuest()
      .then(() => router.replace('/(tabs)/groups'))
      .catch((e) =>
        Alert.alert('Guest sign-in failed', e instanceof Error ? e.message : 'Try again')
      );
  };

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>Preview mode — use Guest on Create group, or sign in with email.</Text>
      <View style={styles.links}>
        {__DEV__ ? (
          <Pressable onPress={goGuest} hitSlop={8}>
            <Text style={styles.link}>Guest</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={goSignIn} hitSlop={8}>
          <Text style={styles.link}>Sign in</Text>
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
    backgroundColor: brand.primary + '14',
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  text: { flex: 1, fontSize: 12, lineHeight: 16, color: '#0D5C38' },
  links: { flexDirection: 'row', gap: spacing.sm },
  link: { fontSize: 13, fontWeight: '700', color: brand.primary },
});
