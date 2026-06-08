import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { RoundPayTabBar } from '@/components/navigation/RoundPayTabBar';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminMode } from '@/contexts/AdminModeContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { typography, useThemeTokens } from '@/theme';

export default function TabLayout() {
  const { user } = useAuth();

  return (
    <NotificationsProvider userId={user?.id}>
      <TabLayoutInner />
    </NotificationsProvider>
  );
}

function TabLayoutInner() {
  const { t } = useTranslation();
  const { colors } = useThemeTokens();
  const { mode, canAdmin, loading } = useAdminMode();

  const isAdminMode = canAdmin && mode === 'admin';

  if (loading) {
    return null;
  }

  return (
    <Tabs
      initialRouteName={isAdminMode ? 'dashboard' : 'index'}
      tabBar={(props) => <RoundPayTabBar {...props} />}
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: [styles.headerTitle, typography.headingSmall, { color: colors.textPrimary }],
        headerTitleAlign: 'center',
        headerShadowVisible: false,
        tabBarHideOnKeyboard: true,
        sceneStyle: { backgroundColor: colors.background },
      }}>
      <Tabs.Screen name="dashboard" options={{ title: t('nav.dashboard'), href: isAdminMode ? undefined : null }} />
      <Tabs.Screen name="index" options={{ title: t('nav.home'), href: isAdminMode ? null : undefined }} />
      <Tabs.Screen name="groups" options={{ title: t('nav.groups') }} />
      <Tabs.Screen name="ledger" options={{ title: t('nav.ledger'), href: isAdminMode ? undefined : null }} />
      <Tabs.Screen
        name="contributions"
        options={{ title: t('nav.contributions'), href: isAdminMode ? null : undefined }}
      />
      <Tabs.Screen
        name="payouts"
        options={{ title: t('nav.payouts'), href: isAdminMode ? undefined : null }}
      />
      <Tabs.Screen
        name="notifications"
        options={{ title: t('nav.alerts'), href: isAdminMode ? null : undefined }}
      />
      <Tabs.Screen name="more" options={{ title: t('nav.more'), href: isAdminMode ? undefined : null }} />
      <Tabs.Screen name="profile" options={{ title: t('nav.profile'), href: isAdminMode ? null : undefined }} />
      <Tabs.Screen name="transparency" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontWeight: '700',
  },
});
