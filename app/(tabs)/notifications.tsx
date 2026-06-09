import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { PlatformIcon } from '@/components/navigation/PlatformIcon';
import { EmptyState } from '@/components/EmptyState';
import { NotificationRow } from '@/components/NotificationRow';
import {
  NotificationFilterSheet,
  notificationFilterLabel,
  type NotificationFilterId,
} from '@/components/notifications/NotificationFilterSheet';
import { Screen } from '@/components/Screen';
import { Badge, Text } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { useNotificationsContext } from '@/contexts/NotificationsContext';
import { getNotificationPath } from '@/lib/in-app-notifications';
import type { AppNotification, NotificationType } from '@/lib/types';
import { primaryAlpha, spacing, useThemeTokens } from '@/theme';

function categoryOf(type: NotificationType): Exclude<NotificationFilterId, 'all' | 'unread'> | null {
  switch (type) {
    case 'contribution_due':
    case 'contribution_overdue':
    case 'payment_confirmed':
    case 'payment_received':
      return 'payments';
    case 'payout_soon':
    case 'payout_completed':
      return 'payouts';
    case 'member_joined':
    case 'group_joined':
      return 'members';
    default:
      return null;
  }
}

function matchesFilter(n: AppNotification, filter: NotificationFilterId): boolean {
  if (filter === 'all') return true;
  if (filter === 'unread') return !n.read_at;
  return categoryOf(n.type) === filter;
}

type Bucket = 'Today' | 'This week' | 'Earlier';

function bucketOf(createdAt: string): Bucket {
  const created = new Date(createdAt);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (created.getTime() >= startOfToday) return 'Today';
  if (created.getTime() >= startOfToday - 6 * 24 * 60 * 60 * 1000) return 'This week';
  return 'Earlier';
}

const BUCKET_ORDER: Bucket[] = ['Today', 'This week', 'Earlier'];

export default function NotificationsScreen() {
  const { canSave } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, scheme, radius } = useThemeTokens();

  const { notifications, loading, loadError, tableMissing, unreadCount, markRead, markAllRead, refetch } =
    useNotificationsContext();

  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<NotificationFilterId>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handlePress = async (notification: AppNotification) => {
    if (!notification.read_at) {
      await markRead(notification.id);
    }
    const path = getNotificationPath(notification);
    if (path) router.push(path as never);
  };

  const sections = useMemo(() => {
    const filtered = notifications.filter((n) => matchesFilter(n, filter));
    const groups = new Map<Bucket, AppNotification[]>();
    for (const n of filtered) {
      const b = bucketOf(n.created_at);
      const arr = groups.get(b) ?? [];
      arr.push(n);
      groups.set(b, arr);
    }
    return BUCKET_ORDER.filter((b) => groups.get(b)?.length).map((b) => ({
      title: b,
      data: groups.get(b)!,
    }));
  }, [notifications, filter]);

  if (loading && notifications.length === 0 && !loadError && !tableMissing) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <Screen safeArea={false} tabBarInset refreshing={refreshing} onRefresh={onRefresh} contentStyle={styles.content}>
      {tableMissing ? (
        <EmptyState title={t('notifications.notSetupTitle')} message={t('notifications.notSetupMessage')} />
      ) : null}

      {!tableMissing && !canSave ? (
        <Text variant="bodySmall" color="secondary" style={styles.hint}>
          {t('notifications.signInHint')}
        </Text>
      ) : null}

      {loadError ? (
        <Text variant="bodySmall" color="error" style={styles.error}>
          {loadError}
        </Text>
      ) : null}

      {!tableMissing && notifications.length > 0 ? (
        <View style={styles.toolbar}>
          <Pressable
            onPress={() => setFiltersOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={t('notifications.filterTitle')}
            style={({ pressed }) => [
              styles.filterBtn,
              {
                backgroundColor: primaryAlpha(scheme, filter !== 'all' ? 16 : 8),
                borderColor: filter !== 'all' ? colors.primary : colors.border,
                borderRadius: radius.md,
                opacity: pressed ? 0.9 : 1,
              },
            ]}>
            <PlatformIcon
              name={{
                ios: 'line.3.horizontal.decrease.circle',
                android: 'filter_list',
                web: 'filter_list',
              }}
              size={22}
              color={filter !== 'all' ? colors.primary : colors.textPrimary}
            />
            {filter !== 'all' ? (
              <View style={[styles.filterDot, { backgroundColor: colors.primary }]} />
            ) : null}
          </Pressable>

          <Pressable
            onPress={() => setFiltersOpen(true)}
            style={({ pressed }) => [styles.filterSummary, { opacity: pressed ? 0.85 : 1 }]}>
            <Text variant="bodyMedium" style={styles.filterLabel}>
              {notificationFilterLabel(filter, t)}
            </Text>
            {filter === 'unread' && unreadCount > 0 ? (
              <Badge label={String(unreadCount)} variant="info" />
            ) : null}
          </Pressable>

          {unreadCount > 0 ? (
            <Pressable onPress={() => markAllRead()} style={styles.markAllWrap}>
              <Text variant="bodySmall" color="accent" style={{ fontWeight: '600' }}>
                {t('notifications.markAllRead')}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {!tableMissing && notifications.length === 0 && !loadError ? (
        <EmptyState title={t('notifications.empty')} message={t('notifications.emptyMessage')} />
      ) : null}

      {!tableMissing && notifications.length > 0 && sections.length === 0 ? (
        <Text variant="bodySmall" color="secondary" style={styles.noMatch}>
          {t('notifications.filterEmpty')}
        </Text>
      ) : null}

      {sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text variant="caption" color="secondary" style={styles.sectionTitle}>
            {section.title}
          </Text>
          <View style={styles.list}>
            {section.data.map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                onPress={() => handlePress(notification)}
              />
            ))}
          </View>
        </View>
      ))}

      <NotificationFilterSheet
        visible={filtersOpen}
        active={filter}
        unreadCount={unreadCount}
        onSelect={setFilter}
        onClose={() => setFiltersOpen(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingTop: 8, paddingBottom: spacing.xl },
  hint: { lineHeight: 20, marginBottom: spacing.md },
  error: { marginBottom: spacing.md, lineHeight: 20 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  filterDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  filterSummary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
  },
  filterLabel: { fontWeight: '700' },
  markAllWrap: { paddingVertical: spacing.xs, paddingHorizontal: spacing.xs },
  noMatch: { marginTop: spacing.md },
  section: { marginBottom: spacing.md },
  sectionTitle: { textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.xs, fontWeight: '700' },
  list: { gap: spacing.xs },
});
