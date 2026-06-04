import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Colors, { brand } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function SetupScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.logo, { color: brand.primary }]}>Ajo Esusu</Text>
      <Text style={[styles.title, { color: colors.text }]}>Setup required</Text>
      <Text style={[styles.body, { color: colors.textSecondary }]}>
        Copy `.env.example` to `.env` and add your Supabase URL, anon key, and Paystack public key.
      </Text>
      <View style={[styles.code, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.codeText, { color: colors.text }]}>
          EXPO_PUBLIC_SUPABASE_URL{'\n'}
          EXPO_PUBLIC_SUPABASE_ANON_KEY{'\n'}
          EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY
        </Text>
      </View>
      <Text style={[styles.body, { color: colors.textSecondary }]}>
        Run the SQL migration in `supabase/migrations/001_schema.sql` in your Supabase SQL editor, then deploy Edge Functions.
      </Text>
      <Link href="/(auth)/login" style={[styles.link, { color: brand.primary }]}>
        Continue to login (demo mode)
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 80 },
  logo: { fontSize: 32, fontWeight: '800', marginBottom: 24 },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 12 },
  body: { fontSize: 15, lineHeight: 22, marginBottom: 16 },
  code: { borderRadius: 10, padding: 16, borderWidth: 1, marginBottom: 16 },
  codeText: { fontFamily: 'SpaceMono', fontSize: 13, lineHeight: 20 },
  link: { fontSize: 16, fontWeight: '600', marginTop: 24 },
});
