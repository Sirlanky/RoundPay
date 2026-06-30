import { Pressable, StyleSheet, View } from 'react-native';
import { PlatformIcon } from '@/components/navigation/PlatformIcon';
import { Text } from '@/components/ui';
import { useTranslation } from '@/contexts/LanguageContext';
import { primaryAlpha, spacing, useThemeTokens } from '@/theme';

interface Props {
  isDraft: boolean;
  isAdmin: boolean;
  onSchedule: () => void;
  onAdmin?: () => void;
  onEdit?: () => void;
  onInvite?: () => void;
}

export function GroupQuickActions({ isDraft, isAdmin, onSchedule, onAdmin, onEdit, onInvite }: Props) {
  const { t } = useTranslation();
  const { colors, scheme, radius } = useThemeTokens();

  const actions: Array<{
    key: string;
    label: string;
    icon: { ios: string; android: string; web: string };
    onPress: () => void;
  }> = [
    {
      key: 'schedule',
      label: t('group.quickActionSchedule'),
      icon: { ios: 'calendar', android: 'event', web: 'event' },
      onPress: onSchedule,
    },
  ];

  if (isDraft && onInvite) {
    actions.unshift({
      key: 'invite',
      label: t('group.quickActionInvite'),
      icon: { ios: 'square.and.arrow.up', android: 'share', web: 'share' },
      onPress: onInvite,
    });
  }

  if (isDraft && isAdmin && onEdit) {
    actions.push({
      key: 'edit',
      label: t('group.quickActionEdit'),
      icon: { ios: 'slider.horizontal.3', android: 'tune', web: 'tune' },
      onPress: onEdit,
    });
  }

  if (isAdmin && onAdmin) {
    actions.push({
      key: 'admin',
      label: t('group.quickActionAdmin'),
      icon: { ios: 'shield.fill', android: 'admin_panel_settings', web: 'admin_panel_settings' },
      onPress: onAdmin,
    });
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.grid}>
        {actions.map((action) => (
          <Pressable
            key={action.key}
            onPress={action.onPress}
            style={({ pressed }) => [
              styles.tile,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.md,
                opacity: pressed ? 0.88 : 1,
              },
            ]}>
            <View style={[styles.iconWrap, { backgroundColor: primaryAlpha(scheme, 12) }]}>
              <PlatformIcon name={action.icon} color={colors.primary} size={20} />
            </View>
            <Text variant="caption" style={styles.label}>
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  grid: { flexDirection: 'row', gap: spacing.sm },
  tile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
    minHeight: 76,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontWeight: '600', textAlign: 'center' },
});
