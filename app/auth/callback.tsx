import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { brand } from '@/constants/Colors';
import { createSessionFromUrl } from '@/lib/auth';
import { spacing } from '@/constants/theme';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const [message, setMessage] = useState('Signing you in…');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async (url: string | null) => {
      if (!url) {
        setFailed(true);
        setMessage('No sign-in data in this link. Open the app from the email again, or enter your 6-digit code.');
        return;
      }
      const result = await createSessionFromUrl(url);
      if (cancelled) return;
      if (result.ok) {
        router.replace('/(tabs)');
        return;
      }
      setFailed(true);
      setMessage(result.error ?? 'Sign-in link expired or invalid.');
    };

    Linking.getInitialURL().then(run);

    const sub = Linking.addEventListener('url', ({ url }) => run(url));
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, [router]);

  return (
    <View style={styles.container}>
      {!failed ? <ActivityIndicator size="large" color={brand.primary} /> : null}
      <Text style={styles.text}>{message}</Text>
      {failed ? (
        <Button
          title="Back to sign in"
          onPress={() => router.replace('/(auth)/login')}
          style={styles.btn}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: '#F8FAF9',
  },
  text: { marginTop: spacing.lg, fontSize: 15, textAlign: 'center', lineHeight: 22, color: '#334155' },
  btn: { marginTop: spacing.xl, alignSelf: 'stretch' },
});
