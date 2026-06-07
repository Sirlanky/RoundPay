import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { RoundPayTabBar } from '@/components/navigation/RoundPayTabBar';
import { useAuth } from '@/contexts/AuthContext';
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

  return (
    <Tabs
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
      <Tabs.Screen name="index" options={{ title: t('nav.home') }} />
      <Tabs.Screen name="groups" options={{ title: t('nav.groups') }} />
      <Tabs.Screen name="contributions" options={{ title: t('nav.contributions') }} />
      <Tabs.Screen name="notifications" options={{ title: t('nav.alerts') }} />
      <Tabs.Screen name="profile" options={{ title: t('nav.profile') }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontWeight: '700',
  },
});
