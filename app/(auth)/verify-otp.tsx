import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Platform, StyleSheet, Text } from 'react-native';
import { AuthShell } from '@/components/AuthShell';
import { useTranslation } from '@/contexts/LanguageContext';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { messageFromAuthError } from '@/lib/auth-errors';
import {
  resendEmailSignIn,
  resolveSignInEmail,
  verifyEmailSignIn,
} from '@/lib/email-sign-in';
import { isSupabaseConfigured } from '@/lib/supabase';
import { spacing } from '@/constants/theme';
import { useThemeTokens } from '@/theme';

const RESEND_COOLDOWN_SEC = 60;
const CODE_LENGTH = 6;

export default function VerifyOtpScreen() {
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendIn, setResendIn] = useState(RESEND_COOLDOWN_SEC);
  const [error, setError] = useState('');
  const verifyingRef = useRef(false);
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useThemeTokens();

  useEffect(() => {
    void resolveSignInEmail(typeof emailParam === 'string' ? emailParam : null).then((resolved) => {
      if (resolved) {
        setEmail(resolved);
        return;
      }
      router.replace('/(auth)/login');
    });
  }, [emailParam, router]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setInterval(() => {
      setResendIn((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendIn]);

  const handleVerify = useCallback(
    async (code: string) => {
      if (verifyingRef.current) return;
      const trimmed = code.trim();
      if (!trimmed) {
        setError(t('auth.enterCodeError'));
        return;
      }
      if (!isSupabaseConfigured || !email) {
        setError(t('auth.configureSupabaseFirst'));
        return;
      }

      verifyingRef.current = true;
      setError('');
      setLoading(true);

      const { error: authError } = await verifyEmailSignIn(email, trimmed);

      setLoading(false);
      verifyingRef.current = false;

      if (authError) {
        setError(messageFromAuthError(authError));
        return;
      }

      router.replace('/(tabs)');
    },
    [email, router, t]
  );

  useEffect(() => {
    if (token.length === CODE_LENGTH && /^\d+$/.test(token)) {
      void handleVerify(token);
    }
  }, [token, handleVerify]);

  const handleResend = async () => {
    if (!email || !isSupabaseConfigured || resendIn > 0) return;
    setResending(true);
    setError('');
    const { error: authError } = await resendEmailSignIn(email);
    setResending(false);
    if (authError) {
      setError(messageFromAuthError(authError));
      return;
    }
    setResendIn(RESEND_COOLDOWN_SEC);
  };

  const openEmailApp = () => {
    void Linking.openURL(Platform.OS === 'ios' ? 'message://' : 'mailto:');
  };

  if (!email) return null;

  return (
    <AuthShell title={t('auth.verifyTitle')} subtitle={t('auth.verifySubtitle', { email })} keyboard>
      <Text style={[styles.help, { color: colors.textSecondary }]}>{t('auth.verifyHelp')}</Text>
      <Input
        label={t('auth.codeLabel')}
        placeholder={t('auth.codePlaceholder')}
        value={token}
        onChangeText={(value) => setToken(value.replace(/\D/g, '').slice(0, CODE_LENGTH))}
        keyboardType="number-pad"
        maxLength={CODE_LENGTH}
        error={error}
        autoFocus
      />
      <Button title={t('auth.verifyCode')} onPress={() => void handleVerify(token)} loading={loading} />
      <Button
        title={resendIn > 0 ? t('auth.resendWait', { seconds: resendIn }) : t('auth.resendEmail')}
        onPress={() => void handleResend()}
        loading={resending}
        disabled={resendIn > 0}
        variant="secondary"
      />
      <Button title={t('auth.openEmailApp')} onPress={openEmailApp} variant="secondary" />
      <Button
        title={t('auth.backToSignIn')}
        onPress={() => router.replace('/(auth)/login')}
        variant="secondary"
      />
      <Text style={[styles.backHint, { color: colors.textSecondary }]}>{t('auth.wrongEmailHint')}</Text>
      <Text style={[styles.tip, { color: colors.textSecondary }]}>{t('auth.noEmailTip')}</Text>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  help: { fontSize: 14, lineHeight: 20, marginBottom: spacing.md },
  backHint: { fontSize: 13, textAlign: 'center', marginTop: spacing.md, lineHeight: 18 },
  tip: { fontSize: 12, lineHeight: 18, marginTop: spacing.lg, textAlign: 'center' },
});
