import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { messageFromAuthError } from '@/lib/auth-errors';
import { isValidSignInEmail, requestEmailSignIn } from '@/lib/email-sign-in';
import { isSupabaseConfigured } from '@/lib/supabase';
import { spacing } from '@/constants/theme';
import { useThemeTokens } from '@/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { signInAsGuest } = useAuth();
  const { t } = useTranslation();
  const { colors } = useThemeTokens();

  const handleEmailSignIn = async () => {
    if (!isSupabaseConfigured) {
      Alert.alert(t('auth.supabaseNotConfiguredTitle'), t('auth.supabaseNotConfiguredBody'));
      return;
    }

    const trimmed = email.trim();
    if (!trimmed) {
      setError(t('auth.enterEmailError'));
      return;
    }
    if (!isValidSignInEmail(trimmed)) {
      setError(t('auth.invalidEmail'));
      return;
    }

    setEmailLoading(true);
    setError('');
    const { error: authError } = await requestEmailSignIn(trimmed);
    setEmailLoading(false);

    if (authError) {
      setError(messageFromAuthError(authError));
      return;
    }

    router.push({ pathname: '/(auth)/verify-otp', params: { email: trimmed.toLowerCase() } });
  };

  const handleEnterApp = async () => {
    if (!isSupabaseConfigured) {
      Alert.alert(t('auth.supabaseNotConfiguredTitle'), t('auth.supabaseNotConfiguredBody'));
      return;
    }

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

  return (
    <AuthShell title={t('auth.loginTitle')} subtitle={t('auth.loginSubtitle')} keyboard>
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
      <Button
        title={t('auth.sendSignInEmail')}
        onPress={() => void handleEmailSignIn()}
        loading={emailLoading}
        disabled={guestLoading}
      />

      <View style={styles.dividerRow}>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        <Text style={[styles.dividerText, { color: colors.textMuted }]}>{t('auth.emailOptionalDivider')}</Text>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
      </View>

      <Button
        title={t('auth.enterAppButton')}
        onPress={() => void handleEnterApp()}
        loading={guestLoading}
        disabled={emailLoading}
        variant="secondary"
      />

      {!isSupabaseConfigured ? (
        <Text style={[styles.hint, { color: colors.error }]}>{t('auth.supabaseNotConfiguredInline')}</Text>
      ) : null}
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  dividerText: { fontSize: 12, fontWeight: '600' },
  hint: { fontSize: 13, textAlign: 'center', marginTop: spacing.md, lineHeight: 18 },
});
