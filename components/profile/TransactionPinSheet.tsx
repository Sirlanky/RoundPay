import { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { PinEntry } from '@/components/security/PinEntry';
import Colors from '@/constants/Colors';
import { useTranslation } from '@/contexts/LanguageContext';
import {
  isTransactionPinEnabled,
  removeTransactionPin,
  setTransactionPin,
  TRANSACTION_PIN_LENGTH,
  verifyTransactionPin,
} from '@/lib/transaction-pin';
import { spacing } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onChanged?: () => void;
}

type Step = 'menu' | 'current' | 'new' | 'confirm' | 'remove';

export function TransactionPinSheet({ visible, onClose, onChanged }: Props) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [hasPin, setHasPin] = useState(false);
  const [step, setStep] = useState<Step>('menu');
  const [pin, setPin] = useState('');
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) return;
    void isTransactionPinEnabled().then((enabled) => {
      setHasPin(enabled);
      setStep(enabled ? 'menu' : 'new');
      setPin('');
      setDraft('');
    });
  }, [visible]);

  const resetFlow = (enabled: boolean) => {
    setHasPin(enabled);
    setStep(enabled ? 'menu' : 'new');
    setPin('');
    setDraft('');
    onChanged?.();
  };

  const handleNewPin = (value: string) => {
    setPin(value);
    if (value.length !== TRANSACTION_PIN_LENGTH) return;
    setDraft(value);
    setPin('');
    setStep('confirm');
  };

  const handleConfirmPin = async (value: string) => {
    setPin(value);
    if (value.length !== TRANSACTION_PIN_LENGTH) return;
    if (value !== draft) {
      Alert.alert(t('security.pin.mismatchTitle'), t('security.pin.mismatch'));
      setPin('');
      setDraft('');
      setStep('new');
      return;
    }
    setBusy(true);
    try {
      await setTransactionPin(value);
      Alert.alert(t('security.pin.savedTitle'), t('security.pin.savedBody'));
      resetFlow(true);
    } catch (e) {
      Alert.alert(t('security.pin.saveFailedTitle'), e instanceof Error ? e.message : t('security.pin.saveFailedBody'));
      setPin('');
      setDraft('');
      setStep('new');
    } finally {
      setBusy(false);
    }
  };

  const handleCurrentPin = async (value: string) => {
    setPin(value);
    if (value.length !== TRANSACTION_PIN_LENGTH || busy) return;
    setBusy(true);
    const ok = await verifyTransactionPin(value);
    setBusy(false);
    if (!ok) {
      Alert.alert(t('security.pin.wrongPinTitle'), t('security.pin.wrongPin'));
      setPin('');
      return;
    }
    setPin('');
    setStep('new');
  };

  const removePin = () => {
    Alert.alert(t('security.pin.removeConfirmTitle'), t('security.pin.removeConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('security.pin.remove'),
        style: 'destructive',
        onPress: () => {
          setPin('');
          setStep('remove');
        },
      },
    ]);
  };

  const handleRemovePin = async (value: string) => {
    setPin(value);
    if (value.length !== TRANSACTION_PIN_LENGTH || busy) return;
    setBusy(true);
    const ok = await verifyTransactionPin(value);
    if (!ok) {
      setBusy(false);
      Alert.alert(t('security.pin.wrongPinTitle'), t('security.pin.wrongPin'));
      setPin('');
      return;
    }
    try {
      await removeTransactionPin();
      Alert.alert(t('security.pin.removedTitle'), t('security.pin.removedBody'));
      resetFlow(false);
    } catch (e) {
      Alert.alert(
        t('security.pin.saveFailedTitle'),
        e instanceof Error ? e.message : t('security.pin.saveFailedBody')
      );
      setPin('');
      setStep('menu');
    } finally {
      setBusy(false);
    }
  };

  const title =
    step === 'menu'
      ? t('security.pin.title')
      : step === 'current' || step === 'remove'
        ? t('security.pin.current')
        : step === 'new'
          ? hasPin
            ? t('security.pin.new')
            : t('security.pin.set')
          : t('security.pin.confirm');

  const hint =
    step === 'menu'
      ? t('security.pin.hint')
      : step === 'confirm'
        ? t('security.pin.confirmHint')
        : t('security.pin.enterHint');

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>{hint}</Text>

          {step === 'menu' ? (
            <View style={styles.menu}>
              <Button title={t('security.pin.change')} onPress={() => setStep('current')} />
              <Button title={t('security.pin.remove')} onPress={removePin} variant="secondary" />
            </View>
          ) : (
            <PinEntry
              value={pin}
              disabled={busy}
              onChange={(value) => {
                if (step === 'new') handleNewPin(value);
                else if (step === 'confirm') void handleConfirmPin(value);
                else if (step === 'remove') void handleRemovePin(value);
                else void handleCurrentPin(value);
              }}
            />
          )}
        </ScrollView>
        <View style={styles.footer}>
          <Button title={t('common.done')} onPress={onClose} variant="secondary" />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.md },
  title: { fontSize: 22, fontWeight: '700', marginBottom: spacing.xs },
  hint: { fontSize: 14, lineHeight: 20, marginBottom: spacing.lg },
  menu: { gap: spacing.sm },
  footer: { padding: spacing.lg, paddingTop: spacing.sm },
});
