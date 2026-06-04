import { useRouter } from 'expo-router';
import { Alert, StyleSheet, Text } from 'react-native';
import { Button } from './Button';
import { Card } from './Card';
import { useAuth } from '@/contexts/AuthContext';
import Colors, { brand } from '@/constants/Colors';
import { accountModeLabel, canSaveToCloud, getAccountMode } from '@/lib/account-status';
import { GUEST_SIGN_IN_SETUP } from '@/lib/guest-auth';
import { spacing } from '@/constants/theme';
import { useColorScheme } from './useColorScheme';

/** Profile hub: see account mode and switch how you use the app. */
export function AccountControlCard() {
  const { user, buildMode, signInAsGuest, signOut, exitBuildMode, enterBuildMode } = useAuth();
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const mode = getAccountMode(user, buildMode);
  const canSave = canSaveToCloud(mode);

  const enterAppAsGuest = () => {
    exitBuildMode();
    void signInAsGuest()
      .then(() => Alert.alert('You’re in', 'Create and manage groups from the Groups tab.'))
      .catch((e) =>
        Alert.alert('Could not sign in', e instanceof Error ? e.message : GUEST_SIGN_IN_SETUP)
      );
  };

  const switchToEmail = () => {
    exitBuildMode();
    router.push('/(auth)/login');
  };

  const newGuestSession = () => {
    Alert.alert(
      'New session?',
      'Sign out and start a fresh guest account. Groups on the old account stay there.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => {
            void signOut().then(() => enterAppAsGuest());
          },
        },
      ]
    );
  };

  const enterPreviewOnly = () => {
    void signOut().then(() => {
      enterBuildMode();
      router.replace('/(tabs)');
    });
  };

  return (
    <Card style={styles.card}>
      <Text style={[styles.title, { color: colors.text }]}>Your account</Text>
      <Text style={[styles.status, { color: canSave ? brand.primary : colors.error }]}>
        {accountModeLabel(mode)}
      </Text>
      {user ? (
        <Text style={[styles.id, { color: colors.textSecondary }]}>
          ID {user.id.slice(0, 8)}…{user.email ? ` · ${user.email}` : ''}
        </Text>
      ) : null}
      <Text style={[styles.body, { color: colors.textSecondary }]}>
        {canSave
          ? 'You can create groups, join with codes, and start cycles when you are the admin.'
          : 'Tap Enter app to take control — no email needed if Anonymous sign-in is on in Supabase.'}
      </Text>

      {mode === 'preview' || mode === 'signed_out' ? (
        <Button title="Enter app (no email)" onPress={enterAppAsGuest} style={styles.btn} />
      ) : null}
      {mode === 'guest' ? (
        <Button title="Switch to email sign-in" onPress={switchToEmail} variant="secondary" style={styles.btn} />
      ) : null}
      {mode === 'email' ? (
        <Button title="Use different email" onPress={switchToEmail} variant="secondary" style={styles.btn} />
      ) : null}
      {mode === 'guest' || mode === 'email' ? (
        <>
          <Button title="New guest session" onPress={newGuestSession} variant="secondary" style={styles.btn} />
          <Button
            title="Sign out"
            onPress={() => void signOut().then(() => router.replace('/(auth)/login'))}
            variant="secondary"
            style={styles.btn}
          />
        </>
      ) : null}
      {__DEV__ && mode !== 'preview' ? (
        <Button title="Preview UI only (no saving)" onPress={enterPreviewOnly} variant="secondary" style={styles.btn} />
      ) : null}
      {mode === 'preview' ? (
        <Button title="Leave preview — enter app" onPress={enterAppAsGuest} style={styles.btn} />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  title: { fontSize: 17, fontWeight: '700', marginBottom: spacing.xs },
  status: { fontSize: 15, fontWeight: '600', marginBottom: spacing.xs },
  id: { fontSize: 12, marginBottom: spacing.sm },
  body: { fontSize: 14, lineHeight: 20, marginBottom: spacing.sm },
  btn: { marginTop: spacing.xs, marginBottom: 0 },
});
