import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Button, Input, Text } from '@/components/ui';
import { useTranslation } from '@/contexts/LanguageContext';
import { spacing, useThemeTokens } from '@/theme';

interface Props {
  visible: boolean;
  profileName: string;
  currentLabel: string;
  saving?: boolean;
  onSave: (label: string) => void;
  onClear: () => void;
  onClose: () => void;
}

export function MessageContactLabelSheet({
  visible,
  profileName,
  currentLabel,
  saving,
  onSave,
  onClear,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useThemeTokens();
  const [value, setValue] = useState(currentLabel);

  useEffect(() => {
    if (visible) setValue(currentLabel);
  }, [visible, currentLabel]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.flex, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}>
          <Text variant="headingSmall" style={styles.title}>
            {t('messages.saveNameTitle')}
          </Text>
          <Text variant="bodySmall" color="secondary" style={styles.hint}>
            {t('messages.saveNameHint', { name: profileName })}
          </Text>

          <Input
            label={t('messages.saveNameLabel')}
            placeholder={t('messages.saveNamePlaceholder')}
            value={value}
            onChangeText={setValue}
            autoFocus
            maxLength={80}
          />

          <Button
            title={t('common.save')}
            onPress={() => onSave(value)}
            loading={saving}
            disabled={!value.trim() || saving}
          />

          {currentLabel ? (
            <Button
              title={t('messages.saveNameClear')}
              onPress={onClear}
              variant="secondary"
              disabled={saving}
              style={styles.clearBtn}
            />
          ) : null}

          <Button title={t('common.cancel')} onPress={onClose} variant="secondary" style={styles.cancelBtn} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xl },
  title: { fontWeight: '700', marginBottom: spacing.xs },
  hint: { marginBottom: spacing.md, lineHeight: 20 },
  clearBtn: { marginTop: spacing.sm, marginBottom: 0 },
  cancelBtn: { marginTop: spacing.sm },
});
