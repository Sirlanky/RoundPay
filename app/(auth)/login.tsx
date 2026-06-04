import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { AuthShell } from '@/components/AuthShell';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { sendEmailOtp } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { spacing } from '@/constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { enterBuildMode } = useAuth();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const handleLogin = async () => {
    if (!email.trim()) {
      setError('Enter your email');
      return;
    }
    setError('');
    setLoading(true);

    if (!isSupabaseConfigured) {
      setLoading(false);
      Alert.alert(
        'Supabase not connected',
        'Add your Project URL and anon key to .env, then restart with: npx expo start --clear\n\nSee docs/SUPABASE_SETUP.md'
      );
      return;
    }

    const { error: authError } = await sendEmailOtp(email.trim());

    setLoading(false);
    if (authError) {
      const msg = authError.message;
      if (/rate limit/i.test(msg)) {
        setError(
          'Too many sign-in emails sent. Wait about 1 hour, then try once. Check your inbox/spam for an older code or link — or use a different email.'
        );
      } else {
        setError(msg);
      }
      return;
    }

    Alert.alert(
      'Check your email',
      'You may get a 6-digit code OR a sign-in link.\n\n• Code: enter it on the next screen\n• Link: tap it to open the app\n\nCheck spam/junk if nothing arrives.',
      [{ text: 'OK', onPress: () => router.push({ pathname: '/(auth)/verify-otp', params: { email: email.trim() } }) }]
    );
  };

  return (
    <AuthShell title="Sign in" subtitle="We'll email you a one-time code or sign-in link." keyboard>
      <Input
        label="Email address"
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        error={error}
      />
      <Button title="Send sign-in email" onPress={handleLogin} loading={loading} />
      {__DEV__ ? (
        <Button
          title="Preview app (skip sign-in)"
          variant="secondary"
          onPress={() => {
            enterBuildMode();
            router.replace('/(tabs)');
          }}
          style={styles.skip}
        />
      ) : null}
      {!isSupabaseConfigured && (
        <Text style={[styles.hint, { color: colors.error }]}>
          Supabase is not configured in .env — emails will not be sent until you add your API keys.
        </Text>
      )}
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 13, textAlign: 'center', marginTop: spacing.md, lineHeight: 18 },
  skip: { marginTop: spacing.sm },
});
