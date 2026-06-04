import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import Colors, { brand } from '@/constants/Colors';
import { createContributionPayment } from '@/lib/paystack';
import { spacing } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

export default function PayScreen() {
  const { contributionId } = useLocalSearchParams<{ contributionId: string }>();
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(false);
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const startPayment = async () => {
    if (!contributionId) return;
    setInitializing(true);
    try {
      const { authorization_url } = await createContributionPayment(contributionId);
      setPaymentUrl(authorization_url);
    } catch (e) {
      Alert.alert('Payment error', (e as Error).message);
    }
    setInitializing(false);
  };

  const handleNavigationChange = (url: string) => {
    if (url.includes('payment-callback') || url.includes('ajoesusu://')) {
      Alert.alert('Payment submitted', 'We will confirm your payment shortly.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  };

  if (paymentUrl) {
    return (
      <View style={styles.webview}>
        <WebView
          source={{ uri: paymentUrl }}
          onNavigationStateChange={(nav) => handleNavigationChange(nav.url)}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loader}>
              <ActivityIndicator color={brand.primary} size="large" />
            </View>
          )}
        />
      </View>
    );
  }

  return (
    <Screen safeArea={false} contentStyle={styles.content}>
      <Text style={[styles.title, { color: colors.text }]}>Pay with Paystack</Text>
      <Text style={[styles.body, { color: colors.textSecondary }]}>
        You will complete payment in a secure checkout. Use test card 4084084084084081 in sandbox mode.
      </Text>
      <Button title="Continue to payment" onPress={startPayment} loading={initializing} />
      <Button title="Cancel" onPress={() => router.back()} variant="secondary" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.lg },
  title: { fontSize: 20, fontWeight: '700', marginBottom: spacing.sm },
  body: { fontSize: 15, lineHeight: 22, marginBottom: spacing.xl },
  webview: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
