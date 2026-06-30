import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Button, Input, Text } from '@/components/ui';
import { useTranslation } from '@/contexts/LanguageContext';
import { MANUAL_PAYMENT_METHODS, type PaymentMethod } from '@/lib/payment-methods';
import { spacing, useThemeTokens } from '@/theme';

interface Props {
  visible: boolean;
  memberName: string;
  amountLabel: string;
  saving?: boolean;
  onConfirm: (method: PaymentMethod, note: string) => void;
  onClose: () => void;
}

export function RecordPaymentMethodSheet({
  visible,
  memberName,
  amountLabel,
  saving,
  onConfirm,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useThemeTokens();
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [note, setNote] = useState('');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
          <Text variant="headingSmall" style={styles.title}>
            {t('payment.recordTitle')}
          </Text>
          <Text variant="bodySmall" color="secondary" style={styles.subtitle}>
            {memberName} · {amountLabel}
          </Text>

          <Text variant="caption" color="secondary" style={styles.label}>
            {t('payment.methodLabel')}
          </Text>
          <View style={styles.methods}>
            {MANUAL_PAYMENT_METHODS.map((m) => (
              <Pressable
                key={m}
                onPress={() => setMethod(m)}
                style={[
                  styles.methodChip,
                  {
                    borderColor: method === m ? colors.primary : colors.border,
                    backgroundColor: method === m ? colors.primary + '14' : colors.background,
                  },
                ]}>
                <Text variant="caption" style={{ fontWeight: method === m ? '700' : '500' }}>
                  {t(
                    m === 'cash'
                      ? 'payment.methodCash'
                      : m === 'bank_transfer'
                        ? 'payment.methodTransfer'
                        : m === 'pos'
                          ? 'payment.methodPos'
                          : 'payment.methodOther'
                  )}
                </Text>
              </Pressable>
            ))}
          </View>

          <Input
            label={t('payment.noteLabel')}
            value={note}
            onChangeText={setNote}
            placeholder={t('payment.notePlaceholder')}
            containerStyle={styles.note}
          />

          <Button
            title={t('payment.confirmRecord')}
            onPress={() => onConfirm(method, note.trim())}
            loading={saving}
            style={styles.btn}
          />
          <Button title={t('common.cancel')} variant="secondary" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: { marginBottom: spacing.xs },
  subtitle: { marginBottom: spacing.md },
  label: { fontWeight: '600', marginBottom: spacing.sm },
  methods: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  methodChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  note: { marginBottom: spacing.md },
  btn: { marginBottom: spacing.sm },
});
