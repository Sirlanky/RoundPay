import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors, { brand } from '@/constants/Colors';
import { formatDate } from '@/lib/format';
import type { AppNotification, NotificationType } from '@/lib/types';
import { radius, spacing } from '@/constants/theme';

const TYPE_ICONS: Record<
  NotificationType,
  { ios: string; android: string; web: string }
> = {
  contribution_due: { ios: 'calendar.badge.clock', android: 'schedule', web: 'schedule' },
  contribution_overdue: { ios: 'exclamationmark.circle.fill', android: 'warning', web: 'warning' },
  payout_soon: { ios: 'gift.fill', android: 'redeem', web: 'redeem' },
  payout_completed: { ios: 'arrow.down.circle.fill', android: 'payments', web: 'payments' },
  member_joined: { ios: 'person.badge.plus', android: 'person_add', web: 'person_add' },
  group_joined: { ios: 'person.3.fill', android: 'group', web: 'group' },
  payment_confirmed: { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' },
  payment_received: { ios: 'banknote.fill', android: 'payments', web: 'payments' },
};

interface Props {
  notification: AppNotification;
  onPress: () => void;
}

export function NotificationRow({ notification, onPress }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const isUnread = !notification.read_at;
  const icon = TYPE_ICONS[notification.type] ?? TYPE_ICONS.payment_confirmed;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}>
      <View
        style={[
          styles.row,
          {
            backgroundColor: isUnread ? brand.primary + '08' : colors.card,
            borderColor: colors.border,
          },
        ]}>
        <View style={[styles.iconWrap, { backgroundColor: brand.primary + '14' }]}>
          <SymbolView name={icon as never} tintColor={brand.primary} size={20} />
        </View>
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {notification.title}
            </Text>
            {isUnread ? <View style={[styles.unreadDot, { backgroundColor: brand.primary }]} /> : null}
          </View>
          <Text style={[styles.message, { color: colors.textSecondary }]} numberOfLines={3}>
            {notification.message}
          </Text>
          <Text style={[styles.time, { color: colors.textSecondary }]}>
            {formatDate(notification.created_at)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 4 },
  title: { flex: 1, fontSize: 15, fontWeight: '700' },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  message: { fontSize: 14, lineHeight: 20 },
  time: { fontSize: 12, marginTop: spacing.xs },
});
