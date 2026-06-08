import { useNavigation, useRouter } from 'expo-router';
import { useLayoutEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import {
  HomeGroupSwitcher,
  HomeHeader,
  HomeHeroCard,
  HomeNextPayoutCard,
  HomeNoActiveEmpty,
  HomeNoGroupsEmpty,
  HomeQuickActions,
  HomeRecentActivity,
  HomeStatusStrip,
} from '@/components/home';
import { ProfileSetupBanner } from '@/components/ProfileSetupBanner';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useHomeDashboard } from '@/hooks/useHomeDashboard';
import { promptProfileSetupForTransfer } from '@/lib/prompt-profile-setup';
import { useTranslation } from '@/contexts/LanguageContext';
import { spacing, useThemeTokens } from '@/theme';

export default function HomeScreen() {
  const { user, profile } = useAuth();
  const {
    dashboard,
    loading,
    loadError,
    refreshing,
    onRefresh,
    selectGroup,
    hasGroups,
    hasPrimary,
    groupId,
    isDraft,
    showPayNow,
    showViewPayments,
    showAdminPayments,
  } = useHomeDashboard(user?.id);
  const router = useRouter();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { colors } = useThemeTokens();

  const isEmptyHome = !hasPrimary;

  useLayoutEffect(() => {
    navigation.setOptions({ headerTitle: isEmptyHome ? '' : t('nav.home') });
  }, [navigation, isEmptyHome, t]);

  const goToInvite = () => {
    if (groupId) router.push(`/group/${groupId}/invite`);
  };

  const goToSchedule = () => {
    if (groupId) router.push(`/group/${groupId}/schedule`);
  };

  const goToDetails = () => {
    if (groupId) router.push(`/group/${groupId}`);
  };

  const goToPay = () => {
    if (!groupId || !dashboard?.userPendingContributionId) return;
    if (!promptProfileSetupForTransfer(profile, router, t)) return;
    router.push(`/group/${groupId}/pay?contributionId=${dashboard.userPendingContributionId}`);
  };

  if (loading) {
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
      <HomeHeader profile={profile} user={user} variant={isEmptyHome ? 'welcome' : 'dashboard'} />

      <ProfileSetupBanner profile={profile} />

      {loadError ? <Text style={[styles.error, { color: colors.error }]}>{loadError}</Text> : null}

      {!hasGroups ? (
        <HomeNoGroupsEmpty
          onCreate={() => router.push('/group/create')}
          onJoin={() => router.push('/group/join')}
        />
      ) : (
        <>
          {hasPrimary && dashboard && groupId ? (
            <>
              <HomeGroupSwitcher
                groups={dashboard.inProgressGroups}
                selectedId={groupId}
                onSelect={selectGroup}
              />
              <HomeHeroCard data={dashboard} onPress={goToDetails} />
              <HomeNextPayoutCard data={dashboard} />
              <HomeStatusStrip data={dashboard} onViewPayments={goToDetails} />
              <HomeQuickActions
                groupId={groupId}
                isDraft={!!isDraft}
                showPayNow={showPayNow}
                showViewPayments={showViewPayments}
                showAdminPayments={showAdminPayments}
                onInvite={goToInvite}
                onSchedule={goToSchedule}
                onDetails={goToDetails}
                onPay={goToPay}
                onViewPayments={goToDetails}
              />
              {dashboard.recentActivity.length > 0 ? (
                <HomeRecentActivity activities={dashboard.recentActivity} />
              ) : null}
            </>
          ) : (
            <HomeNoActiveEmpty
              onCreate={() => router.push('/group/create')}
              onJoin={() => router.push('/group/join')}
              onViewGroups={() => router.push('/(tabs)/groups')}
            />
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingTop: spacing.sm, paddingBottom: spacing.xl },
  error: { fontSize: 14, marginBottom: spacing.md, lineHeight: 20 },
});
