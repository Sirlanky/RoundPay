import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { brand } from '@/theme/colors';
import { useThemeTokens } from '@/theme';

export default function Index() {
  const { configured, session, loading, buildMode } = useAuth();
  const { colors } = useThemeTokens();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={brand.primary} />
      </View>
    );
  }

  if (!configured) return <Redirect href="/(auth)/setup" />;
  if (session || buildMode) return <Redirect href="/(tabs)" />;
  return <Redirect href="/(auth)/login" />;
}
