import React, { createContext, useCallback, useContext, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { PinEntry } from '@/components/security/PinEntry';
import { useTranslation } from '@/contexts/LanguageContext';
import { isTransactionPinEnabled, TRANSACTION_PIN_LENGTH, verifyTransactionPin } from '@/lib/transaction-pin';
import { spacing, useThemeTokens } from '@/theme';

interface TransactionPinContextValue {
  requestTransactionPin: () => Promise<boolean>;
}

const TransactionPinContext = createContext<TransactionPinContextValue | undefined>(undefined);

export function TransactionPinProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { colors } = useThemeTokens();
  const [visible, setVisible] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [verifying, setVerifying] = useState(false);
  const resolverRef = React.useRef<((ok: boolean) => void) | null>(null);

  const finish = useCallback((ok: boolean) => {
    setVisible(false);
    setPin('');
    setError(undefined);
    setVerifying(false);
    resolverRef.current?.(ok);
    resolverRef.current = null;
  }, []);

  const requestTransactionPin = useCallback(async () => {
    const enabled = await isTransactionPinEnabled();
    if (!enabled) return true;

    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setVisible(true);
      setPin('');
      setError(undefined);
    });
  }, []);

  const tryVerify = async (value: string) => {
    if (value.length !== TRANSACTION_PIN_LENGTH || verifying) return;
    setVerifying(true);
    const ok = await verifyTransactionPin(value);
    if (ok) {
      finish(true);
      return;
    }
    setError(t('security.pin.wrongPin'));
    setPin('');
    setVerifying(false);
  };

  return (
    <TransactionPinContext.Provider value={{ requestTransactionPin }}>
      {children}
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => finish(false)}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{t('security.pin.verifyTitle')}</Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>{t('security.pin.verifyHint')}</Text>
          {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
          <PinEntry
            value={pin}
            disabled={verifying}
            onChange={(next) => {
              setPin(next);
              setError(undefined);
              if (next.length === TRANSACTION_PIN_LENGTH) void tryVerify(next);
            }}
          />
        </View>
      </Modal>
    </TransactionPinContext.Provider>
  );
}

export function useTransactionPin() {
  const ctx = useContext(TransactionPinContext);
  if (!ctx) throw new Error('useTransactionPin must be used within TransactionPinProvider');
  return ctx;
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, paddingTop: spacing.xl },
  title: { fontSize: 22, fontWeight: '700', marginBottom: spacing.xs },
  hint: { fontSize: 14, lineHeight: 20, marginBottom: spacing.lg },
  error: { fontSize: 14, fontWeight: '600', textAlign: 'center', marginBottom: spacing.sm },
});
