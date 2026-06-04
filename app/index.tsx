import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { brand } from '@/constants/Colors';

export default function Index() {
  const { configured, session, loading, buildMode } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAF9' }}>
        <ActivityIndicator size="large" color={brand.primary} />
      </View>
    );
  }

  if (!configured) return <Redirect href="/(auth)/setup" />;
  if (session || buildMode) return <Redirect href="/(tabs)" />;
  return <Redirect href="/(auth)/login" />;
}
