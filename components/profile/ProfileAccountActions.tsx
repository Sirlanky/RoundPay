import { useRouter } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { accountModeLabel, canSaveToCloud, getAccountMode } from '@/lib/account-status';
import { GUEST_SIGN_IN_SETUP } from '@/lib/guest-auth';
import { alertProfileDatabaseFix, PROFILE_SETUP_FIX_MESSAGE } from '@/lib/profile';
import { primaryAlpha, spacing, useThemeTokens } from '@/theme';

/** Guest / preview / sign-in controls — shown when user cannot save or needs account actions. */
export function ProfileAccountActions() {
  const { user, profile, buildMode, signInAsGuest, signOut, exitBuildMode, refreshProfile } = useAuth();
  const router = useRouter();
  const { colors, scheme } = useThemeTokens();
  const mode = getAccountMode(user, buildMode);
  const canSave = canSaveToCloud(mode);

  const enterAppAsGuest = () => {
    exitBuildMode();
    void signInAsGuest()
      .then(() => Alert.alert("You're in", 'Create and manage groups from the Groups tab.'))
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

  const handleSignOut = () => {
    Alert.alert('Sign out?', 'You will need to sign in again to access your groups.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => void signOut().then(() => router.replace('/(auth)/login')),
      },
    ]);
  };

  if (canSave && profile) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      {!canSave ? (
        <View style={[styles.banner, { backgroundColor: primaryAlpha(scheme, 16), borderColor: primaryAlpha(scheme, 32) }]}>
          <Text style={[styles.bannerTitle, { color: colors.textPrimary }]}>
            {mode === 'preview' ? 'Preview mode' : 'Sign in to save'}
          </Text>
          <Text style={[styles.bannerBody, { color: colors.textSecondary }]}>
            {mode === 'preview'
              ? 'You are browsing without saving. Enter the app to create and join groups.'
              : 'Tap Enter app to take control — no email needed if guest sign-in is enabled.'}
          </Text>
          <Text style={[styles.modeLabel, { color: colors.primary }]}>{accountModeLabel(mode)}</Text>
        </View>
      ) : null}

      {canSave && !profile ? (
        <View style={[styles.banner, { backgroundColor: colors.error + '10', borderColor: colors.error + '33' }]}>
          <Text style={[styles.bannerTitle, { color: colors.error }]}>Profile setup needed</Text>
          <Text style={[styles.bannerBody, { color: colors.textSecondary }]}>
            Your profile row is missing in the database. Create group will fail until this is fixed.
          </Text>
          <Button title="How to fix database" variant="secondary" onPress={() => alertProfileDatabaseFix()} />
          <Button
            title="Retry profile setup"
            variant="secondary"
            onPress={() => {
              void signInAsGuest()
                .then(() => refreshProfile())
                .catch((e) =>
                  Alert.alert('Still blocked', e instanceof Error ? e.message : PROFILE_SETUP_FIX_MESSAGE)
                );
            }}
            style={styles.btn}
          />
        </View>
      ) : null}

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
          <Button title="Sign out" onPress={handleSignOut} variant="secondary" style={styles.btn} />
        </>
      ) : null}
      {mode === 'preview' ? (
        <Button title="Leave preview — enter app" onPress={enterAppAsGuest} style={styles.btn} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  banner: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  bannerTitle: { fontSize: 15, fontWeight: '700', marginBottom: spacing.xs },
  bannerBody: { fontSize: 14, lineHeight: 20, marginBottom: spacing.sm },
  modeLabel: { fontSize: 13, fontWeight: '600' },
  btn: { marginTop: spacing.xs, marginBottom: 0 },
});
