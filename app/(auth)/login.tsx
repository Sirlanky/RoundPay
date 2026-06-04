import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { AuthShell } from '@/components/AuthShell';
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
      setError(authError.message);
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
});
