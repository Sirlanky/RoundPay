import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { messageFromAuthError } from '@/lib/auth-errors';
import {
  type EmailAuthMode,
  isValidSignInEmail,
  requestEmailSignIn,
} from '@/lib/email-sign-in';
import {
  isValidAuthPassword,
  requestPasswordReset,
  signInWithEmailPassword,
  signUpWithEmailPassword,
} from '@/lib/password-sign-in';
import { isSupabaseConfigured } from '@/lib/supabase';
import { spacing } from '@/constants/theme';
import { useThemeTokens } from '@/theme';

type AuthMethod = 'code' | 'password';

export default function LoginScreen() {
  const params = useLocalSearchParams<{ method?: string; mode?: string }>();
  const [mode, setMode] = useState<EmailAuthMode>('signup');
  const [authMethod, setAuthMethod] = useState<AuthMethod>('code');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { signInAsGuest } = useAuth();
  const { t } = useTranslation();
  const { colors } = useThemeTokens();

  const isSignUp = mode === 'signup';
  const usingPassword = authMethod === 'password';

  useEffect(() => {
    if (params.mode === 'login' || params.mode === 'signup') {
      setMode(params.mode);
    }
    if (params.method === 'password') {
      setAuthMethod('password');
    }
  }, [params.method, params.mode]);

  const clearErrors = () => setError('');

  const ensureConfigured = () => {
    if (isSupabaseConfigured) return true;
    Alert.alert(t('auth.supabaseNotConfiguredTitle'), t('auth.supabaseNotConfiguredBody'));
    return false;
  };

  const validateEmail = (trimmed: string) => {
    if (!trimmed) {
      setError(t('auth.enterEmailError'));
      return false;
    }
    if (!isValidSignInEmail(trimmed)) {
      setError(t('auth.invalidEmail'));
      return false;
    }
    return true;
  };

  const handleEmailCode = async () => {
    if (!ensureConfigured()) return;

    const trimmed = email.trim();
    if (!validateEmail(trimmed)) return;

    setLoading(true);
    clearErrors();
    const { error: authError } = await requestEmailSignIn(trimmed, mode);
    setLoading(false);

    if (authError) {
      setError(messageFromAuthError(authError, mode));
      return;
    }

    router.push({
      pathname: '/(auth)/verify-otp',
      params: { email: trimmed.toLowerCase(), mode },
    });
  };

  const handlePasswordAuth = async () => {
    if (!ensureConfigured()) return;

    const trimmed = email.trim();
    if (!validateEmail(trimmed)) return;

    if (!password) {
      setError(t('auth.enterPasswordError'));
      return;
    }
    if (!isValidAuthPassword(password)) {
      setError(t('auth.passwordTooShort'));
      return;
    }
    if (isSignUp && password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    setLoading(true);
    clearErrors();

    const result = isSignUp
      ? await signUpWithEmailPassword(trimmed, password)
      : await signInWithEmailPassword(trimmed, password);

    setLoading(false);

    if (result.error) {
      setError(messageFromAuthError(result.error, mode));
      return;
    }

    if (!result.data.session) {
      Alert.alert(
        t('auth.requestAcceptedTitle'),
        t('auth.requestAcceptedBody')
      );
      return;
    }

    router.replace('/(tabs)');
  };

  const handleForgotPassword = async () => {
    if (!ensureConfigured()) return;

    const trimmed = email.trim();
    if (!validateEmail(trimmed)) return;

    setLoading(true);
    clearErrors();
    const { error: resetError } = await requestPasswordReset(trimmed);
    setLoading(false);

    if (resetError) {
      setError(messageFromAuthError(resetError, mode));
      return;
    }

    router.push({
      pathname: '/(auth)/reset-password',
      params: { email: trimmed.toLowerCase() },
    });
  };

  const handleEnterApp = async () => {
    if (!ensureConfigured()) return;

    setGuestLoading(true);
    try {
      await signInAsGuest();
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert(t('auth.couldNotEnterAppTitle'), messageFromAuthError(e));
    } finally {
      setGuestLoading(false);
    }
  };

  const switchMode = () => {
    setMode(isSignUp ? 'login' : 'signup');
    setPassword('');
    setConfirmPassword('');
    clearErrors();
  };

  const switchAuthMethod = () => {
    setAuthMethod(usingPassword ? 'code' : 'password');
    setPassword('');
    setConfirmPassword('');
    clearErrors();
  };

  const primaryCodeLabel = isSignUp ? t('auth.signUpButton') : t('auth.sendSignInCode');
  const primaryPasswordLabel = isSignUp ? t('auth.signUpButton') : t('auth.signInWithPassword');

  return (
    <AuthShell
      title={isSignUp ? t('auth.signUpTitle') : t('auth.logInTitle')}
      keyboard
      footer={
        <Pressable
          onPress={() => void handleEnterApp()}
          disabled={loading || guestLoading}
          accessibilityRole="button"
          hitSlop={8}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : guestLoading ? 0.5 : 1 }]}>
          <Text style={[styles.enterAppLink, { color: colors.textMuted }]}>
            {guestLoading ? t('auth.enterAppLoading') : t('auth.enterAppFooter')}
          </Text>
        </Pressable>
      }>
      <Input
        label={t('auth.emailLabel')}
        placeholder={t('auth.emailPlaceholder')}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        error={usingPassword ? undefined : error}
      />

      {usingPassword ? (
        <>
          <Input
            label={t('auth.passwordLabel')}
            placeholder={t('auth.passwordPlaceholder')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete={isSignUp ? 'new-password' : 'password'}
            error={error}
          />
          {isSignUp ? (
            <Input
              label={t('auth.confirmPasswordLabel')}
              placeholder={t('auth.confirmPasswordPlaceholder')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
            />
          ) : null}
          <Button
            title={primaryPasswordLabel}
            onPress={() => void handlePasswordAuth()}
            loading={loading}
            disabled={guestLoading}
          />
          {!isSignUp ? (
            <Pressable
              onPress={() => void handleForgotPassword()}
              disabled={loading || guestLoading}
              hitSlop={8}
              style={styles.linkBtn}>
              <Text style={[styles.linkText, { color: colors.primary }]}>{t('auth.forgotPassword')}</Text>
            </Pressable>
          ) : null}
        </>
      ) : (
        <Button
          title={primaryCodeLabel}
          onPress={() => void handleEmailCode()}
          loading={loading}
          disabled={guestLoading}
        />
      )}

      <Pressable
        onPress={switchAuthMethod}
        disabled={loading || guestLoading}
        hitSlop={8}
        style={styles.linkBtn}>
        <Text style={[styles.linkText, { color: colors.primary }]}>
          {usingPassword ? t('auth.useEmailCodeInstead') : t('auth.usePasswordInstead')}
        </Text>
      </Pressable>

      <View style={styles.switchRow}>
        <Text style={[styles.switchPrompt, { color: colors.textSecondary }]}>
          {isSignUp ? t('auth.alreadyHaveAccount') : t('auth.needAccountFirst')}
        </Text>
        <Pressable
          onPress={switchMode}
          disabled={loading || guestLoading}
          hitSlop={8}
          accessibilityRole="button">
          <Text style={[styles.switchAction, { color: colors.primary }]}>
            {isSignUp ? t('auth.logInTab') : t('auth.signUpTab')}
          </Text>
        </Pressable>
      </View>

      {!isSupabaseConfigured ? (
        <Text style={[styles.hint, { color: colors.error }]}>{t('auth.supabaseNotConfiguredInline')}</Text>
      ) : null}
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  switchRow: {
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: 4,
  },
  switchPrompt: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  switchAction: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  linkBtn: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
    marginTop: spacing.xs,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  hint: { fontSize: 13, textAlign: 'center', marginTop: spacing.md, lineHeight: 18 },
  enterAppLink: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
  },
});
