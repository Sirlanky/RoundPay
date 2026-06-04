import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as Linking from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { brand } from '@/constants/Colors';
import { createSessionFromUrl } from '@/lib/auth';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync();

function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading, configured, buildMode } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const handleUrl = async (url: string) => {
      if (!url.includes('auth/callback') && !url.includes('access_token') && !url.includes('code=') && !url.includes('token_hash')) {
        return;
      }
      const result = await createSessionFromUrl(url);
      if (result.ok) {
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
    const root = segments[0];
    const inAuth = root === '(auth)';

    if (!configured) {
      if (root !== '(auth)' || segments[1] !== 'setup') router.replace('/(auth)/setup');
      return;
    }

    if (!session && !buildMode && root !== '(auth)') {
      router.replace('/(auth)/login');
    } else if ((session || buildMode) && inAuth) {
      router.replace('/(tabs)');
    }
  }, [session, loading, configured, buildMode, segments, router]);

  if (loading) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={brand.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={brand.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AuthGate>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="group" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="auth" />
            <Stack.Screen name="join" />
            <Stack.Screen name="index" />
          </Stack>
        </AuthGate>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAF9',
  },
});
