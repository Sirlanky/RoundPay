import { useRouter } from 'expo-router';
import { Alert, StyleSheet, Text } from 'react-native';
import { Button } from './Button';
import { Card } from './Card';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/Colors';
import { spacing } from '@/constants/theme';
import { useColorScheme } from './useColorScheme';

interface Props {
  action: string;
}

/** Shown on flows that need a signed-in user (create/join group). */
export function AuthActionBanner({ action }: Props) {
  const { canSave, signInAsGuest } = useAuth();
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  if (canSave) return null;

  return (
    <Card style={styles.card}>
      <Text style={[styles.title, { color: colors.text }]}>Enter app to continue</Text>
      <Text style={[styles.body, { color: colors.textSecondary }]}>
        Tap Enter app (no email) on Profile, or use the buttons below to {action}.
      </Text>
      {__DEV__ ? (
        <Button
          title="Continue as guest"
          onPress={() => {
            void signInAsGuest().catch((e) =>
              Alert.alert('Guest sign-in failed', e instanceof Error ? e.message : 'Try again')
            );
          }}
          style={styles.btn}
        />
      ) : null}
      <Button
        title="Sign in with email"
        variant={__DEV__ ? 'secondary' : 'primary'}
        onPress={() => router.push('/(auth)/login')}
        style={styles.btn}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  title: { fontSize: 15, fontWeight: '700', marginBottom: spacing.xs },
  body: { fontSize: 14, lineHeight: 20 },
  btn: { marginTop: spacing.sm, marginBottom: 0 },
});
