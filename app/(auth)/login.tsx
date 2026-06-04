import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useColorScheme } from '@/components/useColorScheme';
import Colors, { brand } from '@/constants/Colors';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

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
      router.push({ pathname: '/(auth)/verify-otp', params: { email: email.trim(), demo: '1' } });
      return;
    }

    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });

    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    router.push({ pathname: '/(auth)/verify-otp', params: { email: email.trim() } });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.logo, { color: brand.primary }]}>Ajo Esusu</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Save together. Collect your turn.
        </Text>

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

        <Button title="Send verification code" onPress={handleLogin} loading={loading} />

        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          We will email you a one-time code to sign in or create an account.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 80 },
  logo: { fontSize: 36, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 16, marginBottom: 40 },
  hint: { fontSize: 13, textAlign: 'center', marginTop: 16, lineHeight: 18 },
});
