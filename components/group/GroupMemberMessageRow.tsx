import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { PlatformIcon } from '@/components/navigation/PlatformIcon';
import { Text } from '@/components/ui';
import { useTranslation } from '@/contexts/LanguageContext';
import { primaryAlpha, spacing, useThemeTokens } from '@/theme';

export interface GroupMessagePerson {
  userId: string;
  name: string;
  avatarUrl?: string | null;
  subtitle: string;
  isYou?: boolean;
}

interface Props {
  person: GroupMessagePerson;
  canMessage: boolean;
  onMessage: (userId: string) => void;
  /** Inside a grouped card — no outer border or margin. */
  embedded?: boolean;
}

export function GroupMemberMessageRow({ person, canMessage, onMessage, embedded }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, scheme, radius } = useThemeTokens();

  return (
    <View
      style={[
        styles.row,
        embedded
          ? styles.rowEmbedded
          : [styles.rowCard, { backgroundColor: colors.surface, borderColor: colors.border }],
      ]}>
      <Pressable
        onPress={() => router.push(`/member/${person.userId}` as Href)}
        style={({ pressed }) => [styles.main, { opacity: pressed ? 0.85 : 1 }]}>
        <Avatar name={person.name} uri={person.avatarUrl} size={40} />
        <View style={styles.body}>
          <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>
            {person.name}
            {person.isYou ? ` (${t('messages.you')})` : ''}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{person.subtitle}</Text>
        </View>
        <PlatformIcon
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          size={14}
          color={colors.textSecondary}
        />
      </Pressable>

      {canMessage && !person.isYou ? (
        <Pressable
          onPress={() => onMessage(person.userId)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('messages.sendTo', { name: person.name })}
          style={({ pressed }) => [
            styles.messageBtn,
            {
              backgroundColor: primaryAlpha(scheme, 12),
              borderColor: colors.border,
              borderRadius: radius.md,
              opacity: pressed ? 0.88 : 1,
            },
          ]}>
          <PlatformIcon
            name={{
              ios: 'bubble.left.fill',
              android: 'chat',
              web: 'chat',
            }}
            size={20}
            color={colors.primary}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  rowEmbedded: {
    marginBottom: 0,
    borderWidth: 0,
    borderRadius: 0,
  },
  rowCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.sm,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minWidth: 0,
  },
  body: { flex: 1, minWidth: 0 },
  messageBtn: {
    width: 40,
    height: 40,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
