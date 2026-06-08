import { useGlobalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui';
import { useTranslation } from '@/contexts/LanguageContext';
import { createSessionFromUrl } from '@/lib/auth';
import { getPendingSignInEmail } from '@/lib/pending-sign-in-email';
import { callbackUrlFromParams, urlHasAuthParams } from '@/lib/redirect';
import { spacing, useThemeTokens } from '@/theme';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useGlobalSearchParams<Record<string, string | string[]>>();
  const { t } = useTranslation();
  const { colors } = useThemeTokens();
  const [message, setMessage] = useState(t('auth.callbackSigningIn'));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async (url: string | null) => {
      if (!url || !urlHasAuthParams(url)) {
        setFailed(true);
        setMessage(t('auth.callbackNoData'));
        return;
      }
      const result = await createSessionFromUrl(url);
      if (cancelled) return;
      if (result.ok) {
        router.replace('/(tabs)');
        return;
      }
      setFailed(true);
      setMessage(result.error ?? t('auth.callbackFailed'));
    };

    const resolve = async () => {
      const initial = await Linking.getInitialURL();
      if (initial && urlHasAuthParams(initial)) {
        await run(initial);
        return;
      }
      const fromRoute = callbackUrlFromParams(params);
      await run(fromRoute ?? initial);
    };

    void resolve();

    const sub = Linking.addEventListener('url', ({ url }) => {
      void run(url);
    });
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, [router, params, t]);

  const goVerify = async () => {
    const email = await getPendingSignInEmail();
    if (email) {
      router.replace({ pathname: '/(auth)/verify-otp', params: { email } });
      return;
    }
    router.replace('/(auth)/verify-otp');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {!failed ? <ActivityIndicator size="large" color={colors.primary} /> : null}
      <Text style={[styles.text, { color: colors.textSecondary }]}>{message}</Text>
      {failed ? (
        <>
          <Button title={t('auth.verifyCode')} onPress={() => void goVerify()} style={styles.btn} />
          <Button
            title={t('auth.backToSignIn')}
            onPress={() => router.replace('/(auth)/login')}
            variant="secondary"
            style={styles.btn}
          />
        </>
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
  },
  text: { marginTop: spacing.lg, fontSize: 15, textAlign: 'center', lineHeight: 22 },
  btn: { marginTop: spacing.md, alignSelf: 'stretch' },
});
