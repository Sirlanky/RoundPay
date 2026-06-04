import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Button } from '@/components/Button';
import { useColorScheme } from '@/components/useColorScheme';
import Colors, { brand } from '@/constants/Colors';
import { createContributionPayment } from '@/lib/paystack';

export default function PayScreen() {
  const { contributionId } = useLocalSearchParams<{ contributionId: string }>();
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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
      setLoading(true);
      Alert.alert('Payment submitted', 'We will confirm your payment shortly.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
      setLoading(false);
    }
  };

  if (paymentUrl) {
    return (
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
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Button title="Pay with Paystack" onPress={startPayment} loading={initializing} />
      <Button title="Cancel" onPress={() => router.back()} variant="secondary" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
