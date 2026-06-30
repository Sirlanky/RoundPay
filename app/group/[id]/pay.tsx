import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Button, Card, Text } from '@/components/ui';
import { Screen } from '@/components/ui/Screen';
import { ProfileSetupBanner } from '@/components/ProfileSetupBanner';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { useTransactionPin } from '@/contexts/TransactionPinContext';
import { mapPaystackFunctionError } from '@/lib/auth-session';
import { getContribution } from '@/lib/contributions';
import { formatNaira } from '@/lib/format';
import { createContributionPayment, isPaystackConfigured } from '@/lib/paystack';
import { paystackCollectContributions } from '@/lib/paystack-mode';
import { promptProfileSetupForTransfer } from '@/lib/prompt-profile-setup';
import { isProfileReadyForTransfers } from '@/lib/profile-setup';
import { spacing, useThemeTokens } from '@/theme';

const CALLBACK_PATTERNS = ['payment-callback', 'roundpayajo://', 'roundpay://'];

async function waitForPaidStatus(contributionId: string, attempts = 10): Promise<boolean> {
  for (let i = 0; i < attempts; i++) {
    const row = await getContribution(contributionId);
    if (row.status === 'paid') return true;
    await new Promise((r) => setTimeout(r, 2000));
  }
  return false;
}

export default function PayScreen() {
  const { profile } = useAuth();
  const { t } = useTranslation();
  const { requestTransactionPin } = useTransactionPin();
  const { contributionId } = useLocalSearchParams<{ contributionId: string }>();
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [amount, setAmount] = useState<number | null>(null);
  const [groupName, setGroupName] = useState('');
  const router = useRouter();
  const { colors } = useThemeTokens();
  const handledCallbackRef = useRef(false);

  useEffect(() => {
    if (!contributionId) return;
    setLoadingDetails(true);
    getContribution(contributionId)
      .then((row) => {
        const cycles = row.cycles as {
          groups?: { name?: string; contribution_amount?: number };
        } | null;
        setAmount(row.amount);
        setGroupName(cycles?.groups?.name ?? 'Ajo group');
      })
      .catch(() => {
        Alert.alert('Error', 'Could not load payment details.');
        router.back();
      })
      .finally(() => setLoadingDetails(false));
  }, [contributionId, router]);

  const startPayment = async () => {
    if (!contributionId) return;
    if (!promptProfileSetupForTransfer(profile, router, t)) return;
    if (!(await requestTransactionPin())) return;
    if (!isPaystackConfigured()) {
      Alert.alert(
        'Paystack not set up',
        'Add EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY to .env and deploy Edge Functions. For now, ask the admin to record your payment on the group screen.'
      );
      return;
    }
    setInitializing(true);
    try {
      const { authorization_url } = await createContributionPayment(contributionId);
      setPaymentUrl(authorization_url);
    } catch (e) {
      Alert.alert('Payment error', mapPaystackFunctionError((e as Error).message));
    }
    setInitializing(false);
  };

  const handlePaymentReturn = useCallback(async () => {
    if (!contributionId || handledCallbackRef.current) return;
    handledCallbackRef.current = true;
    setPaymentUrl(null);
    setConfirming(true);
    try {
      const paid = await waitForPaidStatus(contributionId);
      Alert.alert(
        paid ? 'Payment confirmed' : 'Payment submitted',
        paid
          ? 'Your contribution is marked as paid.'
          : 'We are still confirming. Check Contributions in a moment.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch {
      Alert.alert('Payment submitted', 'Check Contributions shortly for your updated status.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } finally {
      setConfirming(false);
    }
  }, [contributionId, router]);

  const handleNavigationChange = (url: string) => {
    if (CALLBACK_PATTERNS.some((p) => url.includes(p))) {
      void handlePaymentReturn();
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
              <ActivityIndicator color={colors.primary} size="large" />
            </View>
          )}
        />
        {confirming ? (
          <View style={[styles.confirmOverlay, { backgroundColor: colors.background + 'CC' }]}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text variant="bodySmall" color="secondary" style={{ marginTop: spacing.md }}>
              Confirming payment…
            </Text>
          </View>
        ) : null}
      </View>
    );
  }

  if (loadingDetails) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const profileReady = isProfileReadyForTransfers(profile);
  const cardPayEnabled = paystackCollectContributions && isPaystackConfigured();

  if (!cardPayEnabled) {
    return (
      <Screen safeArea={false} contentStyle={styles.content}>
        <Card variant="standard">
          <Text variant="headingSmall">{groupName}</Text>
          <Text variant="display" color="accent" style={{ marginTop: spacing.sm }}>
            {amount != null ? formatNaira(amount) : '—'}
          </Text>
        </Card>
        <Text variant="bodyMedium" color="secondary" style={styles.body}>
          {t('payments.cardPayDisabled')}
        </Text>
        <Button title={t('common.ok')} onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen safeArea={false} contentStyle={styles.content}>
      <ProfileSetupBanner profile={profile} variant="persistent" />
      <Card variant="standard">
        <Text variant="caption" color="secondary">
          Group
        </Text>
        <Text variant="headingSmall">{groupName}</Text>
        <Text variant="caption" color="secondary" style={{ marginTop: spacing.md }}>
          Amount
        </Text>
        <Text variant="display" color="accent">
          {amount != null ? formatNaira(amount) : '—'}
        </Text>
      </Card>

      <Text variant="bodyMedium" color="secondary" style={styles.body}>
        Pay with card via Paystack. In test mode use card 4084084084084081, any future expiry, CVV 408.
      </Text>
      <Button
        title="Continue to Paystack"
        onPress={startPayment}
        loading={initializing}
        disabled={!profileReady}
      />
      <Button title="Cancel" onPress={() => router.back()} variant="secondary" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.lg },
  body: { lineHeight: 22, marginVertical: spacing.lg },
  webview: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  confirmOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
