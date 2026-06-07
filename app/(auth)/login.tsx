import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { AuthShell } from '@/components/AuthShell';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { messageFromAuthError } from '@/lib/auth-errors';
import { isValidSignInEmail, requestEmailSignIn } from '@/lib/email-sign-in';
import { isGuestUser } from '@/lib/guest-auth';
import { requestPasswordReset, signInWithEmailPassword } from '@/lib/password-sign-in';
import { getAuthRedirectUrl, getAuthRedirectUrlForDocs } from '@/lib/redirect';
import { isSupabaseConfigured } from '@/lib/supabase';
import { spacing } from '@/constants/theme';
import { useThemeTokens } from '@/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [usePasswordSignIn, setUsePasswordSignIn] = useState(true);
  const [guestLoading, setGuestLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { user, signInAsGuest } = useAuth();
  const { t } = useTranslation();
  const { colors } = useThemeTokens();
  const redirectUrl = getAuthRedirectUrl();
  const isGuest = isGuestUser(user);

  const copyRedirect = async () => {
    await Clipboard.setStringAsync(getAuthRedirectUrlForDocs());
    Alert.alert(t('auth.copyRedirectTitle'), t('auth.copyRedirectBody'));
  };

  const validateEmail = (): string | null => {
    const trimmed = email.trim();
    if (!trimmed) {
      setError(t('auth.enterEmailError'));
      return null;
    }
    if (!isValidSignInEmail(trimmed)) {
      setError(t('auth.invalidEmail'));
      return null;
    }
    setError('');
    return trimmed;
  };

  const handleGuestSignIn = async () => {
    setError('');
    setGuestLoading(true);
    try {
      await signInAsGuest();
    } catch (e) {
      Alert.alert(t('auth.couldNotEnterAppTitle'), messageFromAuthError(e));
    } finally {
      setGuestLoading(false);
    }
  };

  const handlePasswordSignIn = async () => {
    const trimmed = validateEmail();
    if (!trimmed) return;
    if (!password) {
      setError(t('auth.enterPasswordError'));
      return;
    }
    setError('');

    if (!isSupabaseConfigured) {
      Alert.alert(t('auth.supabaseNotConfiguredTitle'), t('auth.supabaseNotConfiguredBody'));
      return;
    }

    setPasswordLoading(true);
    const { error: authError } = await signInWithEmailPassword(trimmed, password);
    setPasswordLoading(false);

    if (authError) {
      setError(messageFromAuthError(authError));
      return;
    }

    router.replace('/(tabs)');
  };

  const handleEmailSignIn = async () => {
    const trimmed = validateEmail();
    if (!trimmed) return;

    if (!isSupabaseConfigured) {
      Alert.alert(t('auth.supabaseNotConfiguredTitle'), t('auth.supabaseNotConfiguredBody'));
      return;
    }

    setEmailLoading(true);
    const { error: authError } = await requestEmailSignIn(trimmed);
    setEmailLoading(false);

    if (authError) {
      setError(messageFromAuthError(authError));
      return;
    }

    router.push({ pathname: '/(auth)/verify-otp', params: { email: trimmed.toLowerCase() } });
  };

  const handleForgotPassword = async () => {
    const trimmed = validateEmail();
    if (!trimmed) return;

    if (!isSupabaseConfigured) {
      Alert.alert(t('auth.supabaseNotConfiguredTitle'), t('auth.supabaseNotConfiguredBody'));
      return;
    }

    setResetLoading(true);
    const { error: authError } = await requestPasswordReset(trimmed);
    setResetLoading(false);

    if (authError) {
      Alert.alert(t('auth.couldNotEnterAppTitle'), messageFromAuthError(authError));
      return;
    }

    Alert.alert(t('auth.resetPasswordSentTitle'), t('auth.resetPasswordSentBody'));
  };

  return (
    <AuthShell title={t('auth.loginTitle')} subtitle={t('auth.loginSubtitle')} keyboard>
      <Text style={[styles.recommend, { color: colors.textPrimary }]}>{t('auth.guestRecommend')}</Text>

      {!isGuest ? (
        <Button
          title={t('auth.enterAppNoEmail')}
          onPress={() => void handleGuestSignIn()}
          loading={guestLoading}
        />
      ) : null}

      <View style={styles.dividerRow}>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        <Text style={[styles.divider, { color: colors.textSecondary }]}>
          {isGuest ? t('auth.linkEmailDivider') : t('auth.emailOptionalDivider')}
        </Text>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
      </View>

      {isGuest ? (
        <Text style={[styles.guestNote, { color: colors.textSecondary }]}>{t('auth.linkingGuestNote')}</Text>
      ) : usePasswordSignIn ? (
        <Text style={[styles.guestNote, { color: colors.textSecondary }]}>{t('auth.passwordDivider')}</Text>
      ) : null}

      <Input
        label={t('auth.emailLabel')}
        placeholder={t('auth.emailPlaceholder')}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        error={error}
      />

      {!isGuest && usePasswordSignIn ? (
        <>
          <Input
            label={t('auth.passwordLabel')}
            placeholder={t('auth.passwordPlaceholder')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
            textContentType="password"
            onSubmitEditing={() => void handlePasswordSignIn()}
          />
          <Button
            title={t('auth.signInWithPassword')}
            onPress={() => void handlePasswordSignIn()}
            loading={passwordLoading}
          />
          <View style={styles.linkRow}>
            <Pressable onPress={() => void handleForgotPassword()} disabled={resetLoading}>
              <Text style={[styles.link, { color: colors.primary, opacity: resetLoading ? 0.5 : 1 }]}>
                {t('auth.forgotPassword')}
              </Text>
            </Pressable>
            <Pressable onPress={() => setUsePasswordSignIn(false)}>
              <Text style={[styles.link, { color: colors.primary }]}>{t('auth.useEmailCodeInstead')}</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          <Button
            title={isGuest ? t('auth.linkEmailButton') : t('auth.sendSignInEmail')}
            onPress={() => void handleEmailSignIn()}
            loading={emailLoading}
            variant={isGuest ? 'primary' : 'secondary'}
          />
          {!isGuest ? (
            <Pressable onPress={() => setUsePasswordSignIn(true)} style={styles.modeToggle}>
              <Text style={[styles.link, { color: colors.primary }]}>{t('auth.usePasswordInstead')}</Text>
            </Pressable>
          ) : null}
        </>
      )}

      {__DEV__ ? (
        <>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>{t('auth.redirectHint')}</Text>
          <Pressable onPress={copyRedirect} style={styles.redirectBox}>
            <Text style={[styles.redirectUrl, { color: colors.primary }]} selectable>
              {redirectUrl}
            </Text>
          </Pressable>
        </>
      ) : null}

      {!isSupabaseConfigured ? (
        <Text style={[styles.hint, { color: colors.error }]}>{t('auth.supabaseNotConfiguredInline')}</Text>
      ) : null}
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  recommend: { fontSize: 14, lineHeight: 21, marginBottom: spacing.md, textAlign: 'center' },
  guestNote: { fontSize: 13, lineHeight: 19, marginBottom: spacing.sm, textAlign: 'center' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.md, gap: spacing.sm },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  divider: { fontSize: 13, textAlign: 'center' },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  link: { fontSize: 13, lineHeight: 18 },
  modeToggle: { marginTop: spacing.sm, alignItems: 'center' },
  hint: { fontSize: 13, textAlign: 'center', marginTop: spacing.md, lineHeight: 18 },
  redirectBox: { marginTop: spacing.xs, marginBottom: spacing.sm, paddingHorizontal: spacing.sm },
  redirectUrl: { fontSize: 11, textAlign: 'center', lineHeight: 16 },
});
