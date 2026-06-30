import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Button, Text } from '@/components/ui';
import { useTranslation } from '@/contexts/LanguageContext';
import { spacing, useThemeTokens } from '@/theme';

export interface CollectorOption {
  userId: string;
  name: string;
  avatarUrl?: string | null;
}

interface Props {
  visible: boolean;
  round: number;
  selectedUserId?: string;
  options: CollectorOption[];
  onSelect: (userId: string) => void;
  onClose: () => void;
}

export function CollectorPickerSheet({
  visible,
  round,
  selectedUserId,
  options,
  onSelect,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useThemeTokens();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text variant="headingSmall" style={styles.title}>
          {t('payoutOrder.changeCollectorTitle', { round })}
        </Text>

        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {options.map((option) => {
            const selected = option.userId === selectedUserId;
            return (
              <Pressable
                key={option.userId}
                onPress={() => {
                  onSelect(option.userId);
                  onClose();
                }}
                style={({ pressed }) => [
                  styles.row,
                  {
                    backgroundColor: selected ? colors.primary + '12' : colors.surface,
                    borderColor: selected ? colors.primary : colors.border,
                    opacity: pressed ? 0.88 : 1,
                  },
                ]}>
                <Avatar name={option.name} uri={option.avatarUrl} size={44} />
                <Text variant="bodyMedium" style={styles.name} numberOfLines={1}>
                  {option.name}
                </Text>
                {selected ? <MaterialIcons name="check-circle" size={22} color={colors.primary} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>

        <Button title={t('common.cancel')} variant="secondary" onPress={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, paddingBottom: spacing.xl },
  title: { marginBottom: spacing.lg },
  list: { gap: spacing.sm, paddingBottom: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
  },
  name: { flex: 1, fontWeight: '600' },
});
