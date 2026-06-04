import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useColorScheme } from '@/components/useColorScheme';
import Colors, { brand } from '@/constants/Colors';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export default function VerifyOtpScreen() {
  const { email, demo } = useLocalSearchParams<{ email: string; demo?: string }>();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const handleVerify = async () => {
    if (!token.trim()) {
      setError('Enter the code from your email');
      return;
    }
    setError('');
    setLoading(true);

    if (demo === '1' || !isSupabaseConfigured) {
      setLoading(false);
      setError('Configure Supabase in .env to enable authentication.');
      return;
    }

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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Verify your email</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Enter the 6-digit code sent to {email}
      </Text>

      <Input
        label="Verification code"
        placeholder="123456"
        value={token}
        onChangeText={setToken}
        keyboardType="number-pad"
        maxLength={8}
        error={error}
      />

      <Button title="Verify & continue" onPress={handleVerify} loading={loading} />

      <Pressable onPress={() => router.back()}>
        <Text style={[styles.resend, { color: brand.primary }]}>Use a different email</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 80 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 15, marginBottom: 32, lineHeight: 22 },
  resend: { fontSize: 15, textAlign: 'center', marginTop: 24 },
});
