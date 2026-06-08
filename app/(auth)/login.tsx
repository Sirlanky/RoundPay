import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { AuthShell } from '@/components/AuthShell';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { Button } from '@/components/Button';
import { messageFromAuthError } from '@/lib/auth-errors';
import { isSupabaseConfigured } from '@/lib/supabase';
import { spacing } from '@/constants/theme';
import { useThemeTokens } from '@/theme';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signInAsGuest } = useAuth();
  const { t } = useTranslation();
  const { colors } = useThemeTokens();

  const handleEnterApp = async () => {
    if (!isSupabaseConfigured) {
      Alert.alert(t('auth.supabaseNotConfiguredTitle'), t('auth.supabaseNotConfiguredBody'));
      return;
    }

    setLoading(true);
    try {
      await signInAsGuest();
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert(t('auth.couldNotEnterAppTitle'), messageFromAuthError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title={t('auth.loginTitle')} subtitle={t('auth.simpleLoginSubtitle')}>
      <Text style={[styles.body, { color: colors.textSecondary }]}>{t('auth.simpleLoginBody')}</Text>
      <Button title={t('auth.enterAppButton')} onPress={() => void handleEnterApp()} loading={loading} />
      {!isSupabaseConfigured ? (
        <Text style={[styles.hint, { color: colors.error }]}>{t('auth.supabaseNotConfiguredInline')}</Text>
      ) : null}
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  body: { fontSize: 15, lineHeight: 22, marginBottom: spacing.lg, textAlign: 'center' },
  hint: { fontSize: 13, textAlign: 'center', marginTop: spacing.md, lineHeight: 18 },
});
