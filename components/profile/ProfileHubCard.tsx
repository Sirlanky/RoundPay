import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { PlatformIcon } from '@/components/navigation/PlatformIcon';
import { Card, Text } from '@/components/ui';
import { useTranslation } from '@/contexts/LanguageContext';
import { useMessagesUnreadCount } from '@/contexts/MessagesContext';
import { primaryAlpha, spacing, useThemeTokens } from '@/theme';

interface Props {
  onEdit: () => void;
  onMessages: () => void;
}

export function ProfileHubCard({ onEdit, onMessages }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, scheme, radius } = useThemeTokens();
  const unreadMessages = useMessagesUnreadCount();

  const items = [
    {
      key: 'messages',
      label: t('nav.messages'),
      subtitle: t('profile.messagesHubSubtitle'),
      icon: { ios: 'bubble.left.and.bubble.right.fill', android: 'forum', web: 'forum' } as const,
      badge: unreadMessages > 0 ? unreadMessages : undefined,
      onPress: onMessages,
    },
    {
      key: 'edit',
      label: t('profile.editProfile'),
      subtitle: t('profile.personalInfoSubtitle'),
      icon: { ios: 'person.text.rectangle.fill', android: 'badge', web: 'badge' } as const,
      onPress: onEdit,
    },
    {
      key: 'groups',
      label: t('profile.myGroups'),
      subtitle: t('profile.myGroupsSubtitle'),
      icon: { ios: 'person.3.fill', android: 'group', web: 'group' } as const,
      onPress: () => router.push('/(tabs)/groups'),
    },
  ];

  return (
    <Card variant="elevated" style={styles.card}>
      <Text variant="bodyMedium" style={styles.title}>
        {t('profile.hubTitle')}
      </Text>
      <View style={styles.grid}>
        {items.map((item) => (
          <Pressable
            key={item.key}
            onPress={item.onPress}
            style={({ pressed }) => [
              styles.tile,
              {
                backgroundColor: primaryAlpha(scheme, 8),
                borderColor: colors.border,
                borderRadius: radius.md,
                opacity: pressed ? 0.88 : 1,
              },
            ]}>
            <View style={[styles.iconWrap, { backgroundColor: primaryAlpha(scheme, 16) }]}>
              <PlatformIcon name={item.icon} color={colors.primary} size={20} />
              {item.badge ? (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text variant="caption" style={{ color: colors.textInverse, fontWeight: '800', fontSize: 10 }}>
                    {item.badge > 9 ? '9+' : item.badge}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text variant="caption" style={styles.tileLabel} numberOfLines={1}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md, paddingVertical: spacing.md },
  title: { fontWeight: '700', marginBottom: spacing.sm },
  grid: { flexDirection: 'row', gap: spacing.sm },
  tile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  tileLabel: { fontWeight: '700', textAlign: 'center' },
});
