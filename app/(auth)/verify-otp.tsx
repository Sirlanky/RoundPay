import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import Colors, { brand } from '@/constants/Colors';
import { sendEmailOtp } from '@/lib/auth';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { spacing } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

export default function VerifyOtpScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const handleVerify = async () => {
    if (!token.trim()) {
      setError('Enter the 6-digit code from your email');
      return;
    }
    if (!isSupabaseConfigured) {
      setError('Configure Supabase in .env first.');
      return;
    }
    setError('');
    setLoading(true);

    const { error: authError } = await supabase.auth.verifyOtp({
      email: email ?? '',
      token: token.trim(),
      type: 'email',
    });

    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    router.replace('/(tabs)');
  };

  const handleResend = async () => {
    if (!email || !isSupabaseConfigured) return;
    setResending(true);
    setError('');
    const { error: authError } = await sendEmailOtp(email);
    setResending(false);
    if (authError) setError(authError.message);
    else setError('');
  };

  return (
    <AuthShell title="Check your email" subtitle={`We sent a sign-in message to ${email ?? 'your inbox'}`}>
      <Text style={[styles.help, { color: colors.textSecondary }]}>
        If your email has a 6-digit code, enter it below. If it has a “Sign in” link, tap that link instead (it opens
        this app).
      </Text>
      <Input
        label="6-digit code (if shown in email)"
        placeholder="123456"
        value={token}
        onChangeText={setToken}
        keyboardType="number-pad"
        maxLength={8}
        error={error}
      />
      <Button title="Verify code" onPress={handleVerify} loading={loading} />
      <Button title="Resend email" onPress={handleResend} loading={resending} variant="secondary" />
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Text style={{ color: brand.primary, fontWeight: '600' }}>Use a different email</Text>
      </Pressable>
      <Text style={[styles.tip, { color: colors.textSecondary }]}>
        No email? Check spam. In Supabase: Authentication → Email Templates → Magic Link must include{' '}
        <Text style={styles.mono}>{'{{ .Token }}'}</Text> for a code.
      </Text>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  help: { fontSize: 14, lineHeight: 20, marginBottom: spacing.md },
  back: { alignItems: 'center', marginTop: spacing.md },
  tip: { fontSize: 12, lineHeight: 18, marginTop: spacing.lg, textAlign: 'center' },
  mono: { fontFamily: 'SpaceMono', fontSize: 11 },
});
