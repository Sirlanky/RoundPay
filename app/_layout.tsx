import 'react-native-reanimated';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments, type Href } from 'expo-router';
import * as Linking from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppLockGate } from '@/components/AppLockGate';
import { PushNotificationHandler } from '@/components/PushNotificationHandler';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { MessagesProvider } from '@/contexts/MessagesContext';
import { AdminModeProvider } from '@/contexts/AdminModeContext';
import { PlanProvider } from '@/contexts/PlanContext';
import { TransactionPinProvider } from '@/contexts/TransactionPinContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { brand } from '@/theme/colors';
import { useThemeTokens } from '@/theme';
import { createSessionFromUrl } from '@/lib/auth';
import { SIMPLE_GUEST_AUTH } from '@/lib/auth-mode';
import { urlHasAuthParams } from '@/lib/redirect';
import { supabase } from '@/lib/supabase';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync();

function MessagesGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return <MessagesProvider userId={user?.id}>{children}</MessagesProvider>;
}

function PasswordRecoveryRedirect() {
  const router = useRouter();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        router.replace('/(auth)/reset-password');
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  return null;
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading, configured, buildMode } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const lastNavRef = useRef<string | null>(null);

  useEffect(() => {
    const handleUrl = async (url: string) => {
      if (!urlHasAuthParams(url) && !url.includes('auth/callback')) {
        return;
      }
      const result = await createSessionFromUrl(url);
      if (result.ok) {
        await supabase.auth.getSession();
        if (result.recovery) {
          router.replace('/(auth)/reset-password');
          return;
        }
        router.replace('/(tabs)');
        return;
      }
      if (url.includes('auth/callback')) {
        router.replace('/auth/callback');
        return;
      }
      Alert.alert('Sign-in link', result.error ?? 'Could not sign in from this link. Try the 6-digit code instead.');
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, [router]);

  useEffect(() => {
    if (loading) return;

    let cancelled = false;

    void (async () => {
      const root = segments[0];
      const inAuthGroup = root === '(auth)';
      const inAuthCallback = root === 'auth';

      let hasSession = Boolean(session);
      if (!hasSession && configured) {
        const { data: { session: stored } } = await supabase.auth.getSession();
        if (cancelled) return;
        hasSession = Boolean(stored);
      }

      let target: Href | null = null;
      const authScreen = segments[1];
      const isAnonymous = session?.user?.is_anonymous === true;
      const onLogin = inAuthGroup && authScreen === 'login';
      const onVerifyOtp = inAuthGroup && authScreen === 'verify-otp';
      const onResetPassword = inAuthGroup && authScreen === 'reset-password';
      // Email OTP flow only — guest "Enter app" should go straight to tabs.
      const stayForEmailAuth =
        !SIMPLE_GUEST_AUTH &&
        ((onLogin && isAnonymous) || (onVerifyOtp && (!hasSession || isAnonymous)));

      if (!configured) {
        if (!inAuthGroup || segments[1] !== 'setup') target = '/(auth)/setup';
      } else if (!hasSession && !buildMode && !inAuthGroup && !inAuthCallback) {
        target = '/(auth)/login';
      } else if ((hasSession || buildMode) && inAuthGroup) {
        if (!stayForEmailAuth && !onResetPassword && (buildMode || hasSession)) {
          target = '/(tabs)';
        }
      }

      if (target && lastNavRef.current !== target) {
        lastNavRef.current = target as string;
        router.replace(target);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session, loading, configured, buildMode, segments, router]);

  if (loading) {
    return <BootScreen />;
  }

  return <>{children}</>;
}

function BootScreen() {
  const { colors } = useThemeTokens();
  return (
    <View style={[styles.boot, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={brand.primary} />
    </View>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) {
      console.warn('[fonts] SpaceMono failed to load:', error);
    }
  }, [error]);

  useEffect(() => {
    if (loaded || error) {
      void SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  // SpaceMono is optional (OTP debug text only) — do not block the app on fonts.
  if (!loaded && !error) {
    return <BootScreen />;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <AdminModeProvider>
              <PlanProvider>
            <TransactionPinProvider>
              <AuthGate>
                <PasswordRecoveryRedirect />
                <MessagesGate>
                <AppLockGate>
                  <PushNotificationHandler />
                  <RootStatusBar />
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="group" />
                    <Stack.Screen name="profile" />
                    <Stack.Screen name="member" />
                    <Stack.Screen name="messages" />
                    <Stack.Screen name="auth" />
                    <Stack.Screen name="join/[code]" />
                    <Stack.Screen name="index" />
                  </Stack>
                </AppLockGate>
                </MessagesGate>
              </AuthGate>
            </TransactionPinProvider>
              </PlanProvider>
            </AdminModeProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function RootStatusBar() {
  const { colorScheme } = useTheme();
  return <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />;
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
