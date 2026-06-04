import { useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
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
  const { user, buildMode } = useAuth();
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  if (user) return null;

  return (
    <Card style={styles.card}>
      <Text style={[styles.title, { color: colors.text }]}>
        {buildMode ? 'Preview only' : 'Sign in required'}
      </Text>
      <Text style={[styles.body, { color: colors.textSecondary }]}>
        {buildMode
          ? `You can fill out this form in build mode, but ${action} after you sign in.`
          : `Sign in to ${action}.`}
      </Text>
      {!buildMode ? (
        <Button title="Go to sign in" onPress={() => router.push('/(auth)/login')} style={styles.btn} />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  title: { fontSize: 15, fontWeight: '700', marginBottom: spacing.xs },
  body: { fontSize: 14, lineHeight: 20 },
  btn: { marginTop: spacing.sm, marginBottom: 0 },
});
