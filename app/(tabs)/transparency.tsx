import { useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { HomeHeroCard, HomeNextPayoutCard, HomeRecentActivity, HomeStatusStrip } from '@/components/home';
import { Screen } from '@/components/Screen';
import { Button, Card, Text } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { useHomeDashboard } from '@/hooks/useHomeDashboard';
import { spacing, useThemeTokens } from '@/theme';

/** Member transparency view — contributions, progress, upcoming payouts. */
export default function TransparencyScreen() {
  const { user, profile } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useThemeTokens();
  const {
    dashboard,
    loading,
    refreshing,
    onRefresh,
    hasPrimary,
    groupId,
    showPayNow,
  } = useHomeDashboard(user?.id);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <Screen tabBarInset refreshing={refreshing} onRefresh={onRefresh} contentStyle={styles.content}>
      <Text variant="display" style={styles.title}>
        {t('admin.transparencyTitle')}
      </Text>
      <Text variant="bodyMedium" color="secondary" style={styles.subtitle}>
        {t('admin.transparencySubtitle')}
      </Text>

      {!hasPrimary || !dashboard || !groupId ? (
        <Card variant="standard">
          <Text variant="bodyMedium">{t('admin.transparencyEmpty')}</Text>
          <Button
            title={t('home.joinGroup')}
            variant="secondary"
            onPress={() => router.push('/group/join')}
            style={styles.btn}
          />
        </Card>
      ) : (
        <>
          <HomeHeroCard data={dashboard} onPress={() => router.push(`/group/${groupId}`)} />
          <HomeNextPayoutCard data={dashboard} />
          <HomeStatusStrip data={dashboard} onViewPayments={() => router.push(`/group/${groupId}`)} />
          {showPayNow ? (
            <Button
              title={t('admin.payContribution')}
              onPress={() => router.push(`/group/${groupId}/pay`)}
              style={styles.btn}
            />
          ) : null}
          <Button
            title={t('admin.viewSchedule')}
            variant="secondary"
            onPress={() => router.push(`/group/${groupId}/schedule`)}
            style={styles.btn}
          />
          {dashboard.recentActivity.length > 0 ? (
            <HomeRecentActivity activities={dashboard.recentActivity} />
          ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingTop: spacing.sm, paddingBottom: spacing.xl },
  title: { marginBottom: spacing.xs },
  subtitle: { marginBottom: spacing.lg, lineHeight: 22 },
  btn: { marginBottom: spacing.sm },
});
