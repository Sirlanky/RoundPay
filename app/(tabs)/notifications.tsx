import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui';
import { EmptyState } from '@/components/EmptyState';
import { NotificationRow } from '@/components/NotificationRow';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { useNotificationsContext } from '@/contexts/NotificationsContext';
import { getNotificationPath } from '@/lib/in-app-notifications';
import type { AppNotification } from '@/lib/types';
import { spacing, useThemeTokens } from '@/theme';

export default function NotificationsScreen() {
  const { canSave } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useThemeTokens();

  const {
    notifications,
    loading,
    loadError,
    tableMissing,
    unreadCount,
    markRead,
    markAllRead,
    refetch,
  } = useNotificationsContext();

  const [refreshing, setRefreshing] = useState(false);

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

  if (loading && notifications.length === 0 && !loadError && !tableMissing) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <Screen
      safeArea={false}
      tabBarInset
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentStyle={styles.content}>
      {tableMissing ? (
        <EmptyState
          title={t('notifications.notSetupTitle')}
          message={t('notifications.notSetupMessage')}
        />
      ) : null}

      {!tableMissing && !canSave ? (
        <Text variant="bodySmall" color="secondary" style={styles.hint}>
          {t('notifications.signInHint')}
        </Text>
      ) : null}

      {!tableMissing && unreadCount > 0 ? (
        <Pressable onPress={() => markAllRead()} style={styles.markAllWrap}>
          <Text variant="bodySmall" color="accent" style={{ fontWeight: '600' }}>
            {t('notifications.markAllRead')}
          </Text>
        </Pressable>
      ) : null}

      {loadError ? (
        <Text variant="bodySmall" color="error" style={styles.error}>
          {loadError}
        </Text>
      ) : null}

      {!tableMissing && notifications.length === 0 && !loadError ? (
        <EmptyState title={t('notifications.empty')} message={t('notifications.emptyMessage')} />
      ) : null}

      {!tableMissing && notifications.length > 0 ? (
        <View style={styles.list}>
          {notifications.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              onPress={() => handlePress(notification)}
            />
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingTop: 8, paddingBottom: spacing.xl },
  hint: { lineHeight: 20, marginBottom: spacing.md },
  markAllWrap: { alignSelf: 'flex-end', marginBottom: spacing.sm },
  error: { marginBottom: spacing.md, lineHeight: 20 },
  list: { gap: spacing.xs },
});
