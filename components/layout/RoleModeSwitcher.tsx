import { Pressable, StyleSheet, View } from 'react-native';
import { PlatformIcon } from '@/components/navigation/PlatformIcon';
import { Text } from '@/components/ui';
import { useTranslation } from '@/contexts/LanguageContext';
import { useAdminMode } from '@/contexts/AdminModeContext';
import { primaryAlpha, spacing, useThemeTokens } from '@/theme';

export function RoleModeSwitcher() {
  const { t } = useTranslation();
  const { mode, canAdmin, toggleMode } = useAdminMode();
  const { colors, scheme, radius } = useThemeTokens();

  if (!canAdmin) return null;

  const isAdmin = mode === 'admin';

  return (
    <Pressable
      onPress={toggleMode}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.wrap,
        {
          backgroundColor: primaryAlpha(scheme, 12),
          borderColor: colors.border,
          borderRadius: radius.lg,
          opacity: pressed ? 0.9 : 1,
        },
      ]}>
      <PlatformIcon
        name={
          isAdmin
            ? { ios: 'briefcase.fill', android: 'work', web: 'work' }
            : { ios: 'person.fill', android: 'person', web: 'person' }
        }
        size={18}
        color={colors.primary}
      />
      <View style={styles.body}>
        <Text variant="caption" color="secondary">
          {t('admin.modeLabel')}
        </Text>
        <Text variant="bodyMedium" style={styles.mode}>
          {isAdmin ? t('admin.modeManaging') : t('admin.modeParticipating')}
        </Text>
      </View>
      <Text variant="caption" color="accent" style={styles.action}>
        {t('admin.modeSwitch')}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.md,
  },
  body: { flex: 1 },
  mode: { fontWeight: '700' },
  action: { fontWeight: '700' },
});
