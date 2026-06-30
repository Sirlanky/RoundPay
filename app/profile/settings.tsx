import { StyleSheet } from 'react-native';
import { ProfileSettingsMenu, ProfileSheets } from '@/components/profile';
import { Screen } from '@/components/Screen';
import { useProfileScreen } from '@/hooks/useProfileScreen';
import { spacing } from '@/theme';

export default function ProfileSettingsScreen() {
  const state = useProfileScreen();

  return (
    <Screen
      safeArea={false}
      contentStyle={styles.content}
      refreshing={state.refreshing}
      onRefresh={state.onRefresh}>
      <ProfileSettingsMenu {...state} />
      <ProfileSheets {...state} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.sm, paddingBottom: spacing.xl },
});
