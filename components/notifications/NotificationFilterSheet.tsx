import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlatformIcon } from '@/components/navigation/PlatformIcon';
import { Text } from '@/components/ui';
import { useTranslation } from '@/contexts/LanguageContext';
import type { TranslationKey } from '@/lib/i18n/keys';
import { primaryAlpha, radius, spacing, useThemeTokens } from '@/theme';

export type NotificationFilterId = 'all' | 'unread' | 'payments' | 'payouts' | 'members';

const FILTER_IDS: NotificationFilterId[] = ['all', 'unread', 'payments', 'payouts', 'members'];

const FILTER_LABEL_KEYS: Record<NotificationFilterId, TranslationKey> = {
  all: 'notifications.filterAll',
  unread: 'notifications.filterUnread',
  payments: 'notifications.filterPayments',
  payouts: 'notifications.filterPayouts',
  members: 'notifications.filterMembers',
};

interface Props {
  visible: boolean;
  active: NotificationFilterId;
  unreadCount: number;
  onSelect: (id: NotificationFilterId) => void;
  onClose: () => void;
}

export function NotificationFilterSheet({
  visible,
  active,
  unreadCount,
  onSelect,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const { colors, scheme } = useThemeTokens();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              paddingBottom: Math.max(insets.bottom, spacing.md),
            },
          ]}
          onPress={(e) => e.stopPropagation()}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <Text variant="headingSmall" style={styles.title}>
            {t('notifications.filterTitle')}
          </Text>

          <View style={styles.options}>
            {FILTER_IDS.map((id) => {
              const selected = active === id;
              const showCount = id === 'unread' && unreadCount > 0;
              return (
                <Pressable
                  key={id}
                  onPress={() => {
                    onSelect(id);
                    onClose();
                  }}
                  style={({ pressed }) => [
                    styles.option,
                    {
                      backgroundColor: selected ? primaryAlpha(scheme, 16) : colors.surfaceSecondary,
                      borderColor: selected ? colors.primary : colors.border,
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}>
                  <Text variant="bodyMedium" style={{ fontWeight: selected ? '700' : '600', flex: 1 }}>
                    {t(FILTER_LABEL_KEYS[id])}
                    {showCount ? ` (${unreadCount})` : ''}
                  </Text>
                  {selected ? (
                    <PlatformIcon
                      name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
                      size={20}
                      color={colors.primary}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: primaryAlpha(scheme, 12) }]}>
            <Text variant="bodyMedium" color="accent" style={styles.closeText}>
              {t('common.done')}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function notificationFilterLabel(
  id: NotificationFilterId,
  t: (key: TranslationKey) => string
): string {
  return t(FILTER_LABEL_KEYS[id]);
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  title: { fontWeight: '700', marginBottom: spacing.md },
  options: { gap: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  closeBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.lg,
  },
  closeText: { fontWeight: '700' },
});
