import { useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AdminDashboardContent } from '@/components/admin/AdminDashboardContent';
import { HeaderBackButton } from '@/components/HeaderBackButton';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminMode } from '@/contexts/AdminModeContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { useThemeTokens } from '@/theme';

export default function AdminDashboardScreen() {
  const { user } = useAuth();
  const { loading: adminLoading } = useAdminMode();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { colors } = useThemeTokens();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('admin.dashboardTitle'),
      headerLeft: () => <HeaderBackButton label="Home" fallbackHref="/(tabs)" />,
    });
  }, [navigation, t]);

  if (adminLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!user?.id) {
    return null;
  }

  return <AdminDashboardContent userId={user.id} standalone />;
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
