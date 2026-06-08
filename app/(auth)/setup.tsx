import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/ui';
import { spacing, useThemeTokens } from '@/theme';

export default function SetupScreen() {
  const router = useRouter();
  const { colors } = useThemeTokens();

  return (
    <AuthShell
      title="Connect Supabase"
      subtitle="Create a free project, then paste keys into .env in the project folder.">
      <Text style={[styles.step, { color: colors.textPrimary }]}>
        1. Create a project at supabase.com (name: RoundPay)
      </Text>
      <Button
        title="Open Supabase dashboard"
        onPress={() => WebBrowser.openBrowserAsync('https://supabase.com/dashboard/new')}
        variant="secondary"
      />
      <Text style={[styles.step, { color: colors.textPrimary }]}>
        2. Copy Project URL + anon key into <Text style={styles.mono}>.env</Text>
      </Text>
      <Text style={[styles.code, { color: colors.textPrimary, backgroundColor: colors.background }]}>
        EXPO_PUBLIC_SUPABASE_URL=…{'\n'}
        EXPO_PUBLIC_SUPABASE_ANON_KEY=…
      </Text>
      <Text style={[styles.step, { color: colors.textPrimary }]}>
        3. SQL Editor → run <Text style={styles.mono}>supabase/migrations/001_schema.sql</Text>
      </Text>
      <Text style={[styles.step, { color: colors.textPrimary }]}>
        4. Authentication → enable Email provider
      </Text>
      <Text style={[styles.step, { color: colors.textSecondary, fontSize: 13 }]}>
        Full guide: docs/SUPABASE_SETUP.md — then restart with npx expo start --clear
      </Text>
      <Button title="I added keys — reload app" onPress={() => router.replace('/(auth)/login')} />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  step: { fontSize: 15, lineHeight: 22, marginBottom: spacing.sm },
  mono: { fontFamily: 'SpaceMono', fontSize: 13 },
  code: {
    fontFamily: 'SpaceMono',
    fontSize: 12,
    lineHeight: 18,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
});
