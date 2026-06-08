import { Modal, StyleSheet, View } from 'react-native';
import { PlatformIcon } from '@/components/navigation/PlatformIcon';
import { Button, Text } from '@/components/ui';
import { useTranslation } from '@/contexts/LanguageContext';
import type { TranslationKey } from '@/lib/i18n/keys';
import { primaryAlpha, spacing, useThemeTokens } from '@/theme';

export type HomeFeatureId = 'secure' | 'schedule' | 'turns';

interface Props {
  feature: HomeFeatureId | null;
  onClose: () => void;
}

const FEATURE_KEYS: Record<
  HomeFeatureId,
  { title: TranslationKey; body: TranslationKey; icon: { ios: string; android: string; web: string } }
> = {
  secure: {
    title: 'home.featureSecure',
    body: 'home.featureSecureDetail',
    icon: { ios: 'lock.shield.fill', android: 'verified_user', web: 'verified_user' },
  },
  schedule: {
    title: 'home.featureSchedule',
    body: 'home.featureScheduleDetail',
    icon: { ios: 'calendar.badge.clock', android: 'schedule', web: 'schedule' },
  },
  turns: {
    title: 'home.featureTurns',
    body: 'home.featureTurnsDetail',
    icon: { ios: 'arrow.triangle.2.circlepath', android: 'sync', web: 'sync' },
  },
} as const;

export function HomeFeatureSheet({ feature, onClose }: Props) {
  const { t } = useTranslation();
  const { colors, scheme } = useThemeTokens();

  if (!feature) return null;

  const config = FEATURE_KEYS[feature];

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <View style={[styles.iconWrap, { backgroundColor: primaryAlpha(scheme, 12) }]}>
            <PlatformIcon name={config.icon} size={28} color={colors.primary} />
          </View>
          <Text variant="headingMedium" style={styles.title}>
            {t(config.title)}
          </Text>
        </View>

        <Text variant="bodyMedium" color="secondary" style={styles.body}>
          {t(config.body)}
        </Text>

        <Button title={t('common.gotIt')} onPress={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: { textAlign: 'center' },
  body: { lineHeight: 24, marginBottom: spacing.xl, textAlign: 'center' },
});
