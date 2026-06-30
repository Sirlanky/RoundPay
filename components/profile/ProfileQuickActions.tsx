import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { PlatformIcon } from '@/components/navigation/PlatformIcon';
import { Text } from '@/components/ui';
import { useTranslation } from '@/contexts/LanguageContext';
import { useMessagesUnreadCount } from '@/contexts/MessagesContext';
import type { IdentityStatus } from '@/lib/identity-verification';
import { primaryAlpha, spacing, useThemeTokens } from '@/theme';

interface Props {
  canSave: boolean;
  identityStatus: IdentityStatus;
  onRequireSave: (action: string, onOk: () => void) => void;
}

export function ProfileQuickActions({ canSave, identityStatus, onRequireSave }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, scheme, radius } = useThemeTokens();
  const unreadMessages = useMessagesUnreadCount();

  const items = [
    {
      key: 'groups',
      label: t('profile.myGroups'),
      icon: { ios: 'person.3.fill', android: 'group', web: 'group' } as const,
      onPress: () => router.push('/(tabs)/groups'),
    },
    {
      key: 'messages',
      label: t('nav.messages'),
      icon: { ios: 'bubble.left.and.bubble.right.fill', android: 'forum', web: 'forum' } as const,
      badge: unreadMessages > 0 ? unreadMessages : undefined,
      onPress: () => onRequireSave('send messages', () => router.push('/(tabs)/messages')),
    },
    {
      key: 'bank',
      label: t('profile.bank'),
      icon: { ios: 'building.columns.fill', android: 'account_balance', web: 'account_balance' } as const,
      onPress: () => onRequireSave('add a bank account', () => router.push('/profile/bank')),
    },
    {
      key: 'verify',
      label: t('profile.identity'),
      icon: { ios: 'checkmark.shield.fill', android: 'verified_user', web: 'verified_user' } as const,
      highlight: identityStatus !== 'verified',
      onPress: () => onRequireSave('verify your identity', () => router.push('/profile/identity')),
    },
  ];

  return (
    <View style={styles.row}>
      {items.map((item) => (
        <Pressable
          key={item.key}
          onPress={item.onPress}
          disabled={!canSave && item.key !== 'groups'}
          style={({ pressed }) => [
            styles.tile,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.lg,
              opacity: pressed ? 0.9 : !canSave && item.key !== 'groups' ? 0.5 : 1,
            },
            item.highlight ? { borderColor: primaryAlpha(scheme, 32) } : null,
          ]}>
          <View style={[styles.iconWrap, { backgroundColor: primaryAlpha(scheme, 12) }]}>
            <PlatformIcon name={item.icon} color={colors.primary} size={22} />
            {item.badge ? (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text variant="caption" style={styles.badgeText}>
                  {item.badge > 9 ? '9+' : item.badge}
                </Text>
              </View>
            ) : null}
          </View>
          <Text variant="caption" style={styles.label} numberOfLines={2}>
            {item.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  tile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 88,
    justifyContent: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontWeight: '800', fontSize: 10 },
  label: { fontWeight: '600', textAlign: 'center', lineHeight: 16 },
});
